require('./settings');
const fs = require('fs');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');
const { exec } = require('child_process');
const { Boom } = require('@hapi/boom');
const NodeCache = require('node-cache');

const {
    default: makeWASocket,
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    useMultiFileAuthState,
    Browsers,
    DisconnectReason,
    makeInMemoryStore,
    makeCacheableSignalKeyStore,
    fetchLatestBaileysVersion,
    proto,
    PHONENUMBER_MCC,
    getAggregateVotesInPollMessage,
    delay,
    areJidsSameUser
} = require('@whiskeysockets/baileys');
const pairingCode = global.pairing_code || process.argv.includes('--pairing-code');
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

const DataBase = require('./lib/database');
const database = new DataBase();

(async () => {
    try {
        const loadData = await database.read();
        global.db = {
            users: {},
            groups: {},
            database: {},
            settings: {},
            ...(loadData || {}),
        };
        if (Object.keys(loadData || {}).length === 0) {
            await database.write(global.db);
        }

        let isSaving = false;
        let pendingSave = false;
        
        const saveDatabase = async () => {
            if (isSaving) {
                pendingSave = true;
                return;
            }
            
            isSaving = true;
            try {
                await database.write(global.db);
            } catch (e) {
                console.error(chalk.hex('#FF0000')('❌ Error Simpan DB:'), chalk.hex('#FFFFFF')(e.message));
            } finally {
                isSaving = false;
                if (pendingSave) {
                    pendingSave = false;
                    setTimeout(saveDatabase, 1000);
                }
            }
        };

        setInterval(saveDatabase, 30000);
    } catch (e) {
        console.error(chalk.hex('#FF0000')('❌ Gagal inisialisasi database:'), chalk.hex('#FFFFFF')(e.message));
        process.exit(1);
    }
})();

const { MessagesUpsert, Solving } = require('./lib/message');
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./lib/myfunction');

let reconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY = 5000;

async function startingBot() {
    console.clear();
    
    // Tampilkan header dengan warna RGB
    console.log(chalk.hex('#FF0000')('┌────────────────────────────────────────┐'));
    console.log(chalk.hex('#FF7F00')('│') + chalk.hex('#FFFF00')('        WHATSAPP BOT - Hady           ') + chalk.hex('#00FF00')('│'));
    console.log(chalk.hex('#0000FF')('└────────────────────────────────────────┘'));
    console.log(chalk.hex('#FFD700')('🚀 Starting WhatsApp Bot...\n'));

    const store = await makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        printQRInTerminal: !pairingCode,   
        logger: pino({ level: "silent" }),  
        auth: state,  
        browser: Browsers.ubuntu('Chrome'),  
        generateHighQualityLinkPreview: true,
        getMessage: async (key) => store.loadMessage(key.remoteJid, key.id, undefined)?.message,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        maxIdleTimeMs: 60000,
        emitOwnEvents: true,
        defaultQueryTimeoutMs: 60000,
    });

    const groupCache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
    sock.safeGroupMetadata = async (id) => {
        if (groupCache.has(id)) return groupCache.get(id);
        try {
            const meta = await Promise.race([
                sock.groupMetadata(id),
                new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout meta")), 10000))
            ]);
            groupCache.set(id, meta);
            return meta;
        } catch (err) {
            console.error(chalk.hex('#FF0000')(`❌ Error ambil metadata grup ${id}:`), chalk.hex('#FFFFFF')(err.message));
            return { id, subject: 'Unknown', participants: [] };
        }
    };
    
    if (pairingCode && !sock.authState.creds.registered) {
        console.log(chalk.hex('#FFD700')('┌────────────────────────────────────────┐'));
        console.log(chalk.hex('#FFD700')('│           PAIRING MODE                 │'));
        console.log(chalk.hex('#FFD700')('└────────────────────────────────────────┘\n'));
        
        const ascii = `
⣿⣿⣿⣿⣿⣿⡿⠛⠉⣁⣶⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠻⣿⣿⣿⣧⣔⡉⠛⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿
⣿⣿⣿⡿⠛⠡⣀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠀⠙⠿⣿⠉⠻⣿⡟⠁⢀⡄⠘⢿⠉⠻⠟⠁⢱⣮⡀⠪⢙⢿⣿⣿⣿⣿⣿⣿
⣿⡿⠋⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠩⠆⠀⠀⠀⠀⠀⠀⣼⣿⣿⣷⣄⠂⡙⢿⣿⣿⣿⣿
⣿⠃⣠⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣤⣀⡈⠀⠀⠂⠁⠀⠀⠀⣀⣠⣴⡻⢿⣿⣿⣿⣿⣷⡄⠂⡙⢿⣿⣿
⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣾⣿⣿⣿⣿⣿⣿⣿⡘⢿⣿⣿⣿⣿⣿⣦⡐⠠⢻⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⢈⣿⣻⣿⣿⣿⣿⣷⣌⠠⢿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⠘⣿⣝⣿⣿⣿⣿⣟⣆⠢
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠐⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣇⠈⢿⢸⣿⣿⣿⣿⣿⣷
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⡀⣿⣿⣿⣿⣿⣿⣿⡏⣿⢻⢿⣿⣿⣿⣿⣿⡄⠘⣽⢻⣿⣿⣿⣿⣾
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡟⢠⢰⠟⠁⢹⣿⣿⣿⣿⡇⣿⣾⡏⠉⠻⢿⣿⣿⣅⠂⢸⣿⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⣟⣿⣿⣿⣿⡿⣿⠟⠀⠃⢀⣠⣶⣿⣯⣿⣿⣿⡇⣿⣿⣹⣷⣤⣀⡉⡉⡃⢸⠀⢾⢻⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⣿⣿⣿⣿⣟⣟⠟⣠⣿⢠⣿⣿⣿⣿⣿⣿⣿⣯⠇⣿⣿⣿⣿⣿⣿⡿⣿⢡⢞⡀⢽⣼⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⡿⠏⠿⠉⠹⠎⣰⣿⡇⠾⠉⡿⣿⣿⠿⢿⡿⡿⠀⡿⢿⡿⣿⢿⣿⣿⡏⣇⢿⡀⢾⣿⣿⣿⣿⣿
⣿⣿⣿⣿⣿⣿⡿⣿⣿⣿⣿⣿⢾⡃⣴⣆⠀⠀⠀⠈⠙⠻⣷⣶⣶⣶⣶⣶⣺⣶⣶⣶⣷⣶⣶⣶⣶⣶⣶⡢⠒⠀⠈⠁⢀⠀⣎⡉⠉⡙
⣿⣿⣿⣿⣿⣿⠥⣿⣿⣿⣿⣿⣻⡅⢿⣿⣦⡀⠀⠀⠀⠀⠈⠛⢿⢋⣵⢟⣾⡿⠟⣿⣿⣻⢟⢿⡿⠟⠁⠀⠀⠀⢀⣴⡏⠀⣾⡻⣟⣷
⣿⣿⣿⣿⡯⠃⠀⣿⣿⣿⣿⠿⡜⣃⢸⣧⢿⠿⠦⠄⠀⠀⠀⠀⠀⠙⢯⠝⣉⣴⡿⣏⣥⢻⠫⠋⠀⠀⠀⠀⠀⢴⡿⢻⠇⠀⣧⢿⡽⣾
⣿⣿⡿⡏⣠⣾⠀⣿⣿⣿⣿⡌⢳⢽⠈⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣞⡝⣦⣳⢟⡮⢋⣰⡀⠀⠀⠀⠀⠀⠀⠈⠘⠂⠰⡹⢯⡞⣽
⣿⣿⠶⡁⣿⣿⠀⣿⣿⣿⣿⣜⡀⢣⡄⠀⠀⠀⠀⠀⠀⣀⣀⢀⣤⡾⣛⣴⢺⡱⣏⢏⡔⣭⢮⠛⣢⣤⣀⠀⠀⠀⠀⠀⠀⠀⣓⣯⡝⣾
⣿⣟⡆⡇⢿⣿⠀⣿⣿⣿⣿⣒⡷⠈⠻⡘⢂⣴⢾⣟⠿⢊⣴⡿⠏⣴⣿⡾⢏⣰⣾⣿⡿⢎⣡⡾⣵⠋⣌⢿⣔⡦⢄⣀⣠⠀⢰⣯⡝⣶
⣿⣯⣟⣷⠈⠷⢀⣿⣿⣿⣿⣒⠀⡄⢠⡈⠘⠱⠷⠩⣜⣻⣯⣥⣾⣿⣿⣥⣾⣿⣿⣿⣷⣦⡻⢉⣴⣾⡻⡟⣠⢕⠯⠻⠡⠄⠐⣯⡞⣼
⣿⣿⢾⡝⢠⠀⢸⣿⣿⣿⣿⣏⠀⢹⡘⣿⡈⣷⡄⠹⣽⣿⣿⠿⠹⠿⢍⣍⡙⠉⠉⠛⠛⠛⠻⢿⣿⣽⡿⠋⣉⢃⣤⡆⢦⠀⠀⢿⡜⣿
⣿⣿⢯⠃⠆⠀⢸⣿⣿⣿⣿⠃⠀⣾⣿⣿⣷⢸⣿⡆⢹⣿⣇⠐⠿⣿⣿⣿⣿⣿⣿⣿⡿⠍⠀⣸⣿⡟⢠⣾⡏⣼⣟⣰⠏⠀⠀⡹⢞⡿
⣿⣿⢋⠜⠀⡀⣼⣿⣿⣿⣿⢳⣄⠈⢻⣿⣿⣿⣿⣷⡀⠹⣿⣷⣶⣴⣬⣭⣿⣯⣤⣥⣴⣶⣾⡿⠋⣰⣿⣿⣷⣿⣿⣿⠀⠀⠁⢘⢻⢹
⣿⠏⠌⠀⡀⢠⢽⣿⣿⣿⣟⡎⡇⠀⠀⠻⣿⣿⣿⣿⣷⠀⠻⠿⢿⣿⣿⣿⣿⣿⣿⣿⠿⠟⢉⠀⣼⣿⣿⣿⣿⣿⠟⠁⠀⡀⠂⢧⠃⣿
⡿⠃⠀⠂⠀⣾⣸⣿⣿⣿⣞⣷⠃⠀⠀⢀⠙⠿⠿⠿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠐⠛⠀⠘⢿⣿⡿⠟⠁⠀⠠⠐⠀⡰⠁⢐⣿

base simple 
        `.split('\n');
        
        ascii.forEach(line => {
            console.log(chalk.hex('#FF00FF')(line));
        });
        
        console.log(chalk.hex('#00FFFF')('\nMasukkan nomor WhatsApp Untuk Dijadikan Bot Contoh 62xxxxxxx:'));
        
        let phoneNumber = await question(chalk.hex('#00FF00')('> '));
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        
        if (!phoneNumber) {
            console.log(chalk.hex('#FF0000')('❌ Nomor tidak valid!'));
            process.exit(1);
        }
        
        try {
            const code = await sock.requestPairingCode(phoneNumber, global.pairingKode);
            console.log(chalk.hex('#00FF00')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#00FF00')('│           PAIRING CODE                 │'));
            console.log(chalk.hex('#00FF00')('├────────────────────────────────────────┤'));
            console.log(chalk.hex('#FFFFFF').bold(`│          ${code}          │`));
            console.log(chalk.hex('#00FF00')('└────────────────────────────────────────┘'));
            console.log(chalk.hex('#00FFFF')('\n📱 Masukkan code di WhatsApp > Linked Devices'));
        } catch (e) {
            console.log(chalk.hex('#FF0000')('❌ Gagal membuat pairing code:'), chalk.hex('#FFFFFF')(e.message));
            process.exit(1);
        }
    }

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
        
        if (qr) {
            console.log(chalk.hex('#FFD700')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#FFD700')('│           SCAN QR CODE                 │'));
            console.log(chalk.hex('#FFD700')('│    WhatsApp > Linked Devices > Scan    │'));
            console.log(chalk.hex('#FFD700')('└────────────────────────────────────────┘'));
        }

        if (connection === 'close') {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            
            console.log(chalk.hex('#FF0000')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#FF0000')('│          CONNECTION CLOSED             │'));
            console.log(chalk.hex('#FF0000')(`│         Reason: ${reason || 'Unknown'}               │`));
            console.log(chalk.hex('#FF0000')('└────────────────────────────────────────┘'));

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.hex('#FF0000')('❌ Device logged out, delete session folder'));
                process.exit(0);
            }

            if (!reconnecting) {
                reconnecting = true;
                reconnectAttempts++;
                const baseDelay = Math.min(RECONNECT_BASE_DELAY * Math.pow(1.5, reconnectAttempts), 60000);
                const jitter = Math.random() * 2000;
                const delayTime = baseDelay + jitter;

                console.log(chalk.hex('#FFD700')(`🔄 Reconnect attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`));
                console.log(chalk.hex('#FFD700')(`⏳ Waiting ${Math.round(delayTime/1000)} seconds...\n`));
                
                setTimeout(async () => {
                    try {
                        await startingBot();
                    } catch (e) {
                        console.error("❌ Reconnect failed:", e.message);
                    } finally {
                        reconnecting = false;
                    }
                }, delayTime);
            }
        }
        
        if (connection === 'open') {
            reconnectAttempts = 0;
            
            console.clear();
            console.log(chalk.hex('#00FF00')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#00FF00')('│          CONNECTED SUCCESSFULLY!       │'));
            console.log(chalk.hex('#00FF00')('└────────────────────────────────────────┘'));
            console.log(chalk.hex('#00FFFF')(`👤 Bot Name: ${global.namaBot || 'WhatsApp Bot'}`));
            console.log(chalk.hex('#00FFFF')(`👤 User: ${sock.user?.name || 'Unknown'}`));
            console.log(chalk.hex('#00FFFF')(`🔢 JID: ${sock.user?.id || 'Unknown'}`));
            console.log(chalk.hex('#00FFFF')(`🕐 Time: ${new Date().toLocaleString('id-ID')}`));
            console.log(chalk.hex('#00FF00')('────────────────────────────────────────'));
            console.log(chalk.hex('#FFD700')('🚀 Ready to receive messages!\n'));
            
            /*
            try {
                if (global.owner && global.owner.length > 0) {
                    for (let owner of global.owner) {
                        await sock.sendMessage(owner + '@s.whatsapp.net', { 
                            text: `✅ *${global.namaBot || 'Bot'} Connected*\n\nBot successfully connected!\nUser: ${sock.user?.name || 'Unknown'}\nTime: ${new Date().toLocaleString('id-ID')}` 
                        }).catch(() => {});
                    }
                }
            } catch (e) {
            }
            */
        }
        
        if (receivedPendingNotifications) {
            console.log(chalk.hex('#00FFFF')('🔄 Syncing pending messages...'));
        }
    });

    await store.bind(sock.ev);
    await Solving(sock, store);

    sock.ev.on('messages.upsert', async (message) => {
        try {
            await MessagesUpsert(sock, message, store);
        } catch (err) {
            console.log(chalk.hex('#FF0000')('❌ Error in messages.upsert:'), chalk.hex('#FFFFFF')(err));
        }
    });

    sock.ev.on('messages.update', async (updates) => {
        for (const { key, update } of updates) {
            if (update.messageStubType === proto.WebMessageInfo.StubType.REVOKE && !update.message) {
                try {
                    const chatId = key.remoteJid;
                    if (!global.db.groups[chatId]?.antidelete) continue;
                    const Banned = await store.loadMessage(chatId, key.id, undefined);
                    if (!Banned || !Banned.message) continue;

                    const sender = Banned.key.fromMe ? sock.user.id : Banned.key.participant || Banned.key.remoteJid;
                    if (areJidsSameUser(sender, sock.user.id)) continue;
                    
                    const messageType = Object.keys(Banned.message)[0];
                    
                    let text = `🚫 *PESAN DIHAPUS TERDETEKSI* 🚫\n\n`;
                    text += `*Dari:* @${sender.split('@')[0]}\n`;
                    text += `*Waktu Hapus:* ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}\n`;
                    text += `*Tipe Pesan:* ${messageType.replace('Message', '')}`;
                    await sock.sendMessage(chatId, {
                        text: text,
                        mentions: [sender]
                    });
                    await sock.relayMessage(chatId, Banned.message, {
                        messageId: Banned.key.id
                    });
                } catch (err) {
                    console.error(chalk.hex('#FF0000')('❌ Error di anti-delete:'), chalk.hex('#FFFFFF')(err));
                }
            }
        }
    });
    
    const userQueues = {};
    const messageTimestamps = new Map();
    const oriSend = sock.sendMessage.bind(sock);

    sock.sendMessage = async (jid, content, options) => {
        const now = Date.now();
        const lastSent = messageTimestamps.get(jid) || 0;
        
        if (now - lastSent < 50) await delay(50 - (now - lastSent));
        if (!userQueues[jid]) userQueues[jid] = Promise.resolve();

        userQueues[jid] = userQueues[jid].then(() => new Promise(async (resolve) => {
            try {
                const result = await Promise.race([
                    oriSend(jid, content, options),
                    new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout sendMessage")), 10000))
                ]);
                messageTimestamps.set(jid, Date.now());
                resolve(result);
            } catch (err) {
                console.error(chalk.hex('#FF0000')(`❌ Error sendMessage ke ${jid}:`), chalk.hex('#FFFFFF')(err.message));
                resolve();
            }
        }));
        return userQueues[jid];
    };

    return sock;
}

startingBot().catch(err => {
    console.error(chalk.hex('#FF0000')('┌────────────────────────────────────────┐'));
    console.error(chalk.hex('#FF0000')('│      FAILED TO START BOT               │'));
    console.error(chalk.hex('#FF0000')(`│      Error: ${err.message}              │`));
    console.error(chalk.hex('#FF0000')('└────────────────────────────────────────┘'));
    setTimeout(startingBot, 10000);
});

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.hex('#FFD700')('┌────────────────────────────────────────┐'));
    console.log(chalk.hex('#FFD700')(`│          UPDATE DETECTED                │`));
    console.log(chalk.hex('#FFD700')(`│        File: ${path.basename(__filename)}        │`));
    console.log(chalk.hex('#FFD700')('└────────────────────────────────────────┘'));
    delete require.cache[file]
    require(file)
});
require('./settings');
const fs = require('fs');
const pino = require('pino');
const path = require('path');
const chalk = require('chalk');
const express = require('express');
const NodeCache = require('node-cache');
const { Boom } = require('@hapi/boom');

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

// ============================================
// CONFIGURACIÓN EXPRESS API
// ============================================
const app = express();
const PORT = process.env.PORT || 3000;
let globalSock = null;
let isConnected = false;

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

// ============================================
// ENDPOINTS DE LA API
// ============================================

// Endpoint raíz
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        bot: global.namaBot || 'WhatsApp Bot - Hady',
        connected: isConnected,
        user: globalSock?.user?.name || 'Not connected',
        timestamp: new Date().toISOString(),
        endpoints: {
            pair: '/pair?number=51929264225',
            status: '/status'
        }
    });
});

// Endpoint de estado
app.get('/status', (req, res) => {
    res.json({
        connected: isConnected,
        user: globalSock?.user?.name || null,
        jid: globalSock?.user?.id || null,
        timestamp: new Date().toISOString()
    });
});

// Endpoint para generar pairing code
app.get('/pair', async (req, res) => {
    try {
        const phoneNumber = req.query.number;

        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                error: 'Número de teléfono requerido',
                example: '/pair?number=51929264225',
                usage: 'Agrega ?number=TU_NUMERO al final de la URL'
            });
        }

        // Limpiar el número
        const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

        if (cleanNumber.length < 10) {
            return res.status(400).json({
                success: false,
                error: 'Número de teléfono inválido (mínimo 10 dígitos)',
                received: cleanNumber,
                example: '/pair?number=51929264225'
            });
        }

        // Verificar si el bot está inicializado
        if (!globalSock) {
            return res.status(503).json({
                success: false,
                error: 'Bot no inicializado completamente',
                message: 'Espera 10-20 segundos e intenta nuevamente',
                retry: true
            });
        }

        // Generar código de emparejamiento
        console.log(chalk.hex('#00FFFF')(`📱 Solicitando pairing code para: ${cleanNumber}`));
        
        const code = await globalSock.requestPairingCode(cleanNumber);

        console.log(chalk.hex('#00FF00')('┌────────────────────────────────────────┐'));
        console.log(chalk.hex('#00FF00')('│       PAIRING CODE GENERADO            │'));
        console.log(chalk.hex('#00FF00')('├────────────────────────────────────────┤'));
        console.log(chalk.hex('#FFFFFF').bold(`│              ${code}                   │`));
        console.log(chalk.hex('#00FF00')('└────────────────────────────────────────┘'));

        res.json({
            success: true,
            pairingCode: code,
            number: cleanNumber,
            message: 'Código generado exitosamente',
            instructions: [
                '1. Abre WhatsApp en tu teléfono',
                '2. Ve a Configuración > Dispositivos vinculados',
                '3. Toca "Vincular un dispositivo"',
                `4. Ingresa el código: ${code}`
            ]
        });

    } catch (error) {
        console.error(chalk.hex('#FF0000')('❌ Error al generar pairing code:'), error);
        
        res.status(500).json({
            success: false,
            error: 'Error al generar código de emparejamiento',
            details: error.message,
            suggestion: 'Intenta nuevamente en unos segundos'
        });
    }
});

// ============================================
// FUNCIÓN PRINCIPAL DEL BOT
// ============================================

async function startingBot() {
    console.clear();
    
    console.log(chalk.hex('#FF0000')('┌────────────────────────────────────────┐'));
    console.log(chalk.hex('#FF7F00')('│') + chalk.hex('#FFFF00')('        WHATSAPP BOT - Hady           ') + chalk.hex('#00FF00')('│'));
    console.log(chalk.hex('#0000FF')('└────────────────────────────────────────┘'));
    console.log(chalk.hex('#FFD700')('🚀 Starting WhatsApp Bot...\n'));
    console.log(chalk.hex('#00FFFF')(`🌐 Server: Railway`));
    console.log(chalk.hex('#00FFFF')(`📡 Port: ${PORT}`));
    console.log(chalk.hex('#00FFFF')(`📱 Pairing: https://tu-app.railway.app/pair?number=51929264225\n`));

    const store = await makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
    const { state, saveCreds } = await useMultiFileAuthState('session');
    const { version, isLatest } = await fetchLatestBaileysVersion()

    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
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

    globalSock = sock;

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

    sock.ev.on('creds.update', saveCreds);
    
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
        
        if (qr) {
            console.log(chalk.hex('#FFD700')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#FFD700')('│         QR CODE DISPONIBLE             │'));
            console.log(chalk.hex('#FFD700')('│    Usa /pair endpoint para vincular    │'));
            console.log(chalk.hex('#FFD700')('└────────────────────────────────────────┘'));
        }

        if (connection === 'close') {
            isConnected = false;
            globalSock = null;
            
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
            isConnected = true;
            reconnectAttempts = 0;
            
            console.clear();
            console.log(chalk.hex('#00FF00')('┌────────────────────────────────────────┐'));
            console.log(chalk.hex('#00FF00')('│        ✅ CONECTADO EXITOSAMENTE!      │'));
            console.log(chalk.hex('#00FF00')('└────────────────────────────────────────┘'));
            console.log(chalk.hex('#00FFFF')(`👤 Bot: ${global.namaBot || 'WhatsApp Bot'}`));
            console.log(chalk.hex('#00FFFF')(`👤 User: ${sock.user?.name || 'Unknown'}`));
            console.log(chalk.hex('#00FFFF')(`🔢 JID: ${sock.user?.id || 'Unknown'}`));
            console.log(chalk.hex('#00FFFF')(`🕐 Time: ${new Date().toLocaleString('id-ID')}`));
            console.log(chalk.hex('#00FFFF')(`🌐 Port: ${PORT}`));
            console.log(chalk.hex('#00FF00')('────────────────────────────────────────'));
            console.log(chalk.hex('#FFD700')('🚀 Listo para recibir mensajes!\n'));
        }
        
        if (receivedPendingNotifications) {
            console.log(chalk.hex('#00FFFF')('🔄 Sincronizando mensajes pendientes...'));
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

// ============================================
// INICIAR SERVIDOR Y BOT
// ============================================

app.listen(PORT, () => {
    console.log(chalk.hex('#00FF00')('╔════════════════════════════════════════╗'));
    console.log(chalk.hex('#00FF00')(`║   🌐 SERVER RAILWAY - PORT ${PORT}        ║`));
    console.log(chalk.hex('#00FF00')('╚════════════════════════════════════════╝\n'));
    
    // Iniciar bot
    startingBot().catch(err => {
        console.error(chalk.hex('#FF0000')('┌────────────────────────────────────────┐'));
        console.error(chalk.hex('#FF0000')('│      ❌ FAILED TO START BOT            │'));
        console.error(chalk.hex('#FF0000')(`│      Error: ${err.message}              │`));
        console.error(chalk.hex('#FF0000')('└────────────────────────────────────────┘'));
        setTimeout(startingBot, 10000);
    });
});

// Manejo de errores globales
process.on('uncaughtException', (err) => {
    console.error(chalk.hex('#FF0000')('❌ Uncaught Exception:'), err);
});

process.on('unhandledRejection', (err) => {
    console.error(chalk.hex('#FF0000')('❌ Unhandled Rejection:'), err);
});

// Auto-reload en cambios
let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.hex('#FFD700')('┌────────────────────────────────────────┐'));
    console.log(chalk.hex('#FFD700')(`│          🔄 UPDATE DETECTED            │`));
    console.log(chalk.hex('#FFD700')(`│        File: ${path.basename(__filename)}        │`));
    console.log(chalk.hex('#FFD700')('└────────────────────────────────────────┘'));
    delete require.cache[file]
    require(file)
});

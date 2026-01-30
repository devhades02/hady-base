require('../settings');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const chalk = require('chalk');
const FileType = require('file-type');
const PhoneNumber = require('awesome-phonenumber');

const { imageToWebp, videoToWebp, writeExif, writeExifImg, addExif } = require('./exif');
const { color } = require('./color');
const { isUrl, getGroupAdmins, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep, getTypeUrlMedia } = require('./myfunction');

// PASTIKAN IMPORT DARI @whiskeysockets/baileys
const {
    jidNormalizedUser,
    proto,
    getBinaryNodeChildren,
    getBinaryNodeChild,
    generateWAMessageContent,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    delay,
    areJidsSameUser,
    extractMessageContent,
    generateMessageID,
    downloadContentFromMessage,  // HANYA SATU
    generateWAMessageFromContent,
    jidDecode,
    generateWAMessage,
    toBuffer,
    getContentType,
    getDevice,
    S_WHATSAPP_NET
} = require('@whiskeysockets/baileys');// Import converter untuk toPTT dan toAudio
const { toPTT, toAudio } = require('./converter');

async function LoadDataBase(sock, m) {
    try {
        const botNumber = sock.decodeJid(sock.user.id); // Hapus await
        const isNumber = x => typeof x === 'number' && !isNaN(x);
        const isBoolean = x => typeof x === 'boolean' && Boolean(x);

        let setBot = global.db.settings || {};
        if (typeof setBot !== 'object') global.db.settings = {};
        if (setBot) {
            if (!('autoread' in setBot)) setBot.autoread = false;
            if (!('autotyping' in setBot)) setBot.autotyping = false;
            if (!('isPublic' in setBot)) setBot.isPublic = false;
        } else {
            global.db.settings = {
                autoread: false,
                autotyping: false,
                isPublic: false
            };
        }

        let user = global.db.users[m.sender];
        if (typeof user !== 'object') global.db.users[m.sender] = {};
        if (user) {
            if (!('status_deposit' in user)) user.status_deposit = false;
            if (!('saldo' in user)) user.saldo = 0;
        } else {
            global.db.users[m.sender] = {
                status_deposit: false,
                saldo: 0
            };
        }

        if (m.isGroup) {
            let group = global.db.groups[m.chat];
            if (typeof group !== 'object') global.db.groups[m.chat] = {};
            if (group) {
                if (!('antibot' in group)) group.antibot = false;
                if (!('antidelete' in group)) group.antidelete = false; // Tambah antidelete
            } else {
                global.db.groups[m.chat] = {
                    antibot: false,
                    antidelete: false
                };
            }
        }

    } catch (e) {
        console.error(chalk.red('❌ LoadDataBase error:'), e.message);
    }
}

async function MessagesUpsert(sock, message, store) {
    try {
        const botNumber = sock.decodeJid(sock.user.id); // Hapus await
        const msg = message.messages[0];
        const type = msg.message ? (getContentType(msg.message) || Object.keys(msg.message)[0]) : '';
        
        // Skip status broadcast
        if (msg.key && msg.key.remoteJid === 'status@broadcast') {
            if (global.db.settings.readsw && global.db.settings.readsw == true) {
                sock.readMessages([msg.key]);
            }
            return;
        }
        
        if (!msg.message) return;

        const m = await Serialize(sock, msg, store);
        if (m.isBaileys) return;

        let isCreator = [botNumber, ...global.owner.map(v => 
            (v.replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        )].includes(m.sender);

        // Jika mode self dan bukan creator, ignore message
        if (!sock.public && !isCreator && message.type === 'notify') {
            return;
        }

        // Auto read dan auto typing
        if (global.db.settings.autoread && global.db.settings.autoread == true) {
            sock.readMessages([msg.key]);
        }
        
        if (global.db.settings.autotyping && global.db.settings.autotyping == true && !msg.key.fromMe) {
            sock.sendPresenceUpdate('composing', msg.key.remoteJid);
        }

        // Process command via elaina.js
        require('../elaina.js')(sock, m, message, store);

        // Handle interactive responses
        if (type === 'interactiveResponseMessage' && m.quoted && m.quoted.fromMe) {
            try {
                const params = JSON.parse(m.msg.nativeFlowResponseMessage?.paramsJson || '{}');
                const responseId = params.id || '';
                
                let apb = await generateWAMessage(m.chat, { 
                    text: responseId, 
                    mentions: m.mentionedJid 
                }, {
                    userJid: sock.user.id,
                    quoted: m.quoted
                });
                
                apb.key = msg.key;
                apb.key.fromMe = areJidsSameUser(m.sender, sock.user.id);
                if (m.isGroup) apb.participant = m.sender;
                
                let pbr = {
                    ...msg,
                    messages: [proto.WebMessageInfo.fromObject(apb)],
                    type: 'append'
                };
                
                sock.ev.emit('messages.upsert', pbr);
            } catch (e) {
                console.error(chalk.red('❌ Interactive response error:'), e);
            }
        }
        
    } catch (e) {
        console.error(chalk.red('❌ MessagesUpsert error:'), e.message);
    }
}

async function Solving(sock, store) {
    sock.public = true;
    
    sock.serializeM = (m) => MessagesUpsert(sock, m, store);
    
    sock.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && decode.user + '@' + decode.server || jid;
        } else {
            return jid;
        }
    };
    
    sock.getName = async (jid, withoutContact = false) => {
        try {
            const id = sock.decodeJid(jid);
            
            if (id.endsWith('@g.us')) {
                // Group
                const groupInfo = await sock.groupMetadata(id).catch(() => ({}));
                return groupInfo.subject || groupInfo.name || `Group ${id.replace('@g.us', '')}`;
            } else {
                // User
                if (id === '0@s.whatsapp.net') return 'WhatsApp';
                
                const contactInfo = store.contacts?.[id] || {};
                if (withoutContact) return '';
                
                return contactInfo.name || 
                       contactInfo.verifiedName || 
                       contactInfo.notify || 
                       PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international');
            }
        } catch (e) {
            return 'Unknown';
        }
    };
    
    sock.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        try {
            let list = [];
            for (let i of kon) {
                const name = await sock.getName(i + '@s.whatsapp.net');
                list.push({
                    displayName: name,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${name}\nFN:${name}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.ADR:;;Indonesia;;;;\nitem2.X-ABLabel:Region\nEND:VCARD`
                });
            }
            
            await sock.sendMessage(jid, { 
                contacts: { 
                    displayName: `${list.length} Kontak`, 
                    contacts: list 
                }, 
                ...opts 
            }, { quoted });
            
        } catch (e) {
            console.error(chalk.red('❌ sendContact error:'), e);
        }
    };
    
    sock.profilePictureUrl = async (jid, type = 'image', timeoutMs = 10000) => {
        try {
            const result = await sock.query({
                tag: 'iq',
                attrs: {
                    target: jidNormalizedUser(jid),
                    to: '@s.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:profile:picture'
                },
                content: [{
                    tag: 'picture',
                    attrs: { type, query: 'url' }
                }]
            }, timeoutMs);
            
            const child = getBinaryNodeChild(result, 'picture');
            return child?.attrs?.url;
            
        } catch (e) {
            console.error(chalk.red('❌ profilePictureUrl error:'), e);
            return null;
        }
    };
    
    sock.setStatus = (status) => {
        try {
            sock.query({
                tag: 'iq',
                attrs: {
                    to: '@s.whatsapp.net',
                    type: 'set',
                    xmlns: 'status',
                },
                content: [{
                    tag: 'status',
                    attrs: {},
                    content: Buffer.from(status, 'utf-8')
                }]
            });
            return status;
        } catch (e) {
            console.error(chalk.red('❌ setStatus error:'), e);
            return null;
        }
    };
    
    sock.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        try {
            let type = await sock.getFile(path, true);
            let { res, data: file, filename: pathFile } = type;
            
            // Error handling untuk response
            if (res && res.status !== 200 || file.length <= 65536) {
                try {
                    throw { json: JSON.parse(file.toString()) };
                } catch (e) {
                    if (e.json) throw e.json;
                }
            }
            
            let opt = { filename };
            if (quoted) opt.quoted = quoted;
            if (!type) options.asDocument = true;
            
            let mtype = '', mimetype = type.mime, convert;
            
            // Tentukan tipe media
            if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) {
                mtype = 'sticker';
            } else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) {
                mtype = 'image';
            } else if (/video/.test(type.mime)) {
                mtype = 'video';
            } else if (/audio/.test(type.mime)) {
                // Convert audio
                convert = await (ptt ? toPTT : toAudio)(file, type.ext);
                file = convert;
                pathFile = convert.filename;
                mtype = 'audio';
                mimetype = ptt ? 'audio/ogg; codecs=opus' : 'audio/mpeg';
            } else {
                mtype = 'document';
            }
            
            if (options.asDocument) mtype = 'document';
            
            let message = {
                ...options,
                caption,
                ptt,
                [mtype]: { url: pathFile },
                mimetype
            };
            
            let m;
            try {
                m = await sock.sendMessage(jid, message, { ...opt, ...options });
            } catch (e) {
                console.error(chalk.red('❌ sendFile error (URL):'), e);
                // Fallback: send as buffer
                m = await sock.sendMessage(jid, {
                    ...message,
                    [mtype]: file
                }, {
                    ...opt,
                    ...options 
                });
            }
            
            return m;
            
        } catch (e) {
            console.error(chalk.red('❌ sendFile error:'), e);
            throw e;
        }
    };
    
    sock.sendTextMentions = async (jid, text, quoted, options = {}) => {
        const mentions = [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net');
        return sock.sendMessage(jid, { 
            text: text, 
            mentions: mentions, 
            ...options 
        }, { quoted });
    };
    
    sock.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        try {
            let buff;
            
            if (Buffer.isBuffer(path)) {
                buff = path;
            } else if (/^data:.*?\/.*?;base64,/i.test(path)) {
                buff = Buffer.from(path.split`,`[1], 'base64');
            } else if (/^https?:\/\//.test(path)) {
                buff = await getBuffer(path);
            } else if (fs.existsSync(path)) {
                buff = fs.readFileSync(path);
            } else {
                buff = Buffer.alloc(0);
            }
            
            // Batasi ukuran file (max 5MB)
            if (buff.length > 5 * 1024 * 1024) {
                throw new Error('File too large for sticker conversion (max 5MB)');
            }
            
            let buffer;
            if (options && (options.packname || options.author)) {
                buffer = await writeExifImg(buff, options);
            } else {
                buffer = await addExif(buff, 
                    options.packname || global.packname || "Elaina Bot", 
                    options.author || global.author || "@elaina"
                );
            }
            
            await sock.sendMessage(jid, { 
                sticker: buffer, 
                ...options 
            }, { quoted });
            
            return buffer;
            
        } catch (error) {
            console.error(chalk.red('❌ sendImageAsSticker error:'), error.message);
            throw error;
        }
    };
    
    sock.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        try {
            let buff;
            
            if (Buffer.isBuffer(path)) {
                buff = path;
            } else if (/^data:.?\/.?;base64,/i.test(path)) {
                buff = Buffer.from(path.split`,`[1], 'base64');
            } else if (/^https?:\/\//.test(path)) {
                buff = await getBuffer(path);
            } else if (fs.existsSync(path)) {
                buff = fs.readFileSync(path);
            } else {
                buff = Buffer.alloc(0);
            }
            
            let buffer;
            if (options && (options.packname || options.author)) {
                const media = { data: buff, mimetype: 'video/mp4' };
                buffer = await writeExif(media, options);
            } else {
                buffer = await videoToWebp(buff);
            }
            
            await sock.sendMessage(jid, {
                sticker: buffer,
                ...options
            }, { quoted });
            
            return buffer;
            
        } catch (error) {
            console.error(chalk.red('❌ sendVideoAsSticker error:'), error.message);
            throw error;
        }
    };
    
    sock.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        try {
            const quoted = message.msg || message;
            const mime = quoted.mimetype || '';
            const messageType = (message.mtype || mime.split('/')[0]).replace(/Message/gi, '');
            const stream = await downloadContentFromMessage(quoted, messageType);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            const type = await FileType.fromBuffer(buffer);
            const trueFileName = attachExtension ? 
                `./tmp/${filename ? filename : Date.now()}.${type?.ext || 'bin'}` : 
                filename;
            
            await fs.promises.writeFile(trueFileName, buffer);
            return trueFileName;
            
        } catch (error) {
            console.error(chalk.red('❌ downloadAndSaveMediaMessage error:'), error.message);
            throw error;
        }
    };
    
    sock.getFile = async (PATH, save = false) => {
        try {
            let res, filename, data;
            
            if (Buffer.isBuffer(PATH)) {
                data = PATH;
            } else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
                data = Buffer.from(PATH.split`,`[1], 'base64');
            } else if (/^https?:\/\//.test(PATH)) {
                res = await axios.get(PATH, { responseType: 'arraybuffer' });
                data = Buffer.from(res.data);
            } else if (fs.existsSync(PATH)) {
                filename = PATH;
                data = fs.readFileSync(PATH);
            } else if (typeof PATH === 'string') {
                data = Buffer.from(PATH, 'utf-8');
            } else {
                data = Buffer.alloc(0);
            }
            
            const type = await FileType.fromBuffer(data) || {
                mime: 'application/octet-stream',
                ext: '.bin'
            };
            
            filename = filename || path.join(__dirname, '../tmp/' + Date.now() + '.' + type.ext);
            
            if (data && save) {
                await fs.promises.writeFile(filename, data);
            }
            
            return {
                res,
                filename,
                size: data.length,
                ...type,
                data
            };
            
        } catch (error) {
            console.error(chalk.red('❌ getFile error:'), error.message);
            throw error;
        }
    };
    
    sock.downloadMediaMessage = async (message) => {
        try {
            const mime = (message.msg || message).mimetype || '';
            const messageType = message.mtype ? 
                message.mtype.replace(/Message/gi, '') : 
                mime.split('/')[0];
            
            const stream = await downloadContentFromMessage(message, messageType);
            let buffer = Buffer.from([]);
            
            for await(const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            
            return buffer;
            
        } catch (error) {
            console.error(chalk.red('❌ downloadMediaMessage error:'), error.message);
            throw error;
        }
    };
    
    sock.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        try {
            const { mime, data, filename } = await sock.getFile(path, true);
            const isWebpSticker = options.asSticker || /webp/.test(mime);
            
            let type = 'document', mimetype = mime, pathFile = filename;
            
            if (isWebpSticker) {
                const media = { mimetype: mime, data };
                pathFile = await writeExif(media, {
                    packname: options.packname || global.packname,
                    author: options.author || global.author,
                    categories: options.categories || [],
                });
                
                await fs.promises.unlink(filename);
                type = 'sticker';
                mimetype = 'image/webp';
            } else if (/image|video|audio/.test(mime)) {
                type = mime.split('/')[0];
            }
            
            await sock.sendMessage(jid, { 
                [type]: { url: pathFile }, 
                caption, 
                mimetype, 
                fileName, 
                ...options 
            }, { quoted, ...options });
            
            // Cleanup
            if (pathFile !== filename) {
                await fs.promises.unlink(pathFile).catch(() => {});
            }
            
        } catch (error) {
            console.error(chalk.red('❌ sendMedia error:'), error.message);
            throw error;
        }
    };
    
    return sock;
}

async function Serialize(sock, m, store) {
    // HAPUS LICENSE VALIDATION
    const botNumber = sock.decodeJid(sock.user.id);
    
    if (!m) return m;
    
    // Key processing
    if (m.key) {
        m.id = m.key.id;
        m.chat = m.key.remoteJid;
        m.fromMe = m.key.fromMe;
        m.isBaileys = m.id ? (m.id.startsWith('3EB0') || m.id.startsWith('BAE5') || m.id.length < 32) : false;
        m.isGroup = m.chat.endsWith('@g.us');
        m.sender = sock.decodeJid(m.fromMe ? sock.user.id : m.participant || m.key.participant || m.chat || '');
        
        // Group processing
        if (m.isGroup) {
            m.metadata = await sock.groupMetadata(m.chat).catch(() => ({})) || {};
            const admins = [];
            
            if (m.metadata?.participants) {
                for (let p of m.metadata.participants) {
                    if (p.admin !== null) {
                        if (p.jid) admins.push(p.jid);
                        if (p.id) admins.push(p.id);
                        if (p.lid) admins.push(p.lid);
                    }
                }
            }
            
            m.admins = admins;
            
            const checkAdmin = (jid, list) =>
                list.some(x =>
                    x === jid ||
                    (jid.endsWith('@s.whatsapp.net') && x === jid.replace('@s.whatsapp.net', '@lid')) ||
                    (jid.endsWith('@lid') && x === jid.replace('@lid', '@s.whatsapp.net'))
                );
            
            m.isAdmin = checkAdmin(m.sender, m.admins);
            m.isBotAdmin = checkAdmin(botNumber, m.admins);
            m.participant = m.key.participant || "";
        }
    }
    
    // Message processing
    if (m.message) {
        m.type = getContentType(m.message) || Object.keys(m.message)[0];
        
        // Handle viewOnce messages
        if (/viewOnceMessage/i.test(m.type)) {
            m.msg = m.message[m.type].message[getContentType(m.message[m.type].message)];
        } else {
            m.msg = extractMessageContent(m.message[m.type]) || m.message[m.type];
        }
        
        // Interactive message handling
        let interactiveData = {};
        try {
            if (m.msg?.interactiveResponseMessage?.paramsJson) {
                interactiveData = JSON.parse(m.msg.interactiveResponseMessage.paramsJson);
            }
            if (m.msg?.nativeFlowResponseMessage?.paramsJson) {
                interactiveData = { ...interactiveData, ...JSON.parse(m.msg.nativeFlowResponseMessage.paramsJson) };
            }
        } catch (e) {
            console.error(chalk.red('❌ Parse interactive error:'), e);
        }
        
        m.interactive = interactiveData;
        
        // Get message body/text
        m.body = interactiveData?.id ||
                m.message?.conversation ||
                m.msg?.text ||
                m.msg?.caption ||
                m.msg?.selectedButtonId ||
                m.msg?.singleSelectReply?.selectedRowId ||
                m.msg?.selectedId ||
                '';
        
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || [];
        m.text = m.body;
        
        // Media info
        m.isMedia = !!m.msg?.mimetype || !!m.msg?.thumbnailDirectPath;
        if (m.isMedia) {
            m.mime = m.msg?.mimetype || '';
            m.size = m.msg?.fileLength || 0;
        }
        
        // Quoted message handling
        if (m.msg?.contextInfo?.quotedMessage) {
            m.quoted = {
                message: extractMessageContent(m.msg.contextInfo.quotedMessage),
                type: getContentType(m.msg.contextInfo.quotedMessage) || Object.keys(m.msg.contextInfo.quotedMessage)[0],
                id: m.msg.contextInfo.stanzaId,
                sender: sock.decodeJid(m.msg.contextInfo.participant),
                fromMe: areJidsSameUser(sock.decodeJid(m.msg.contextInfo.participant), sock.decodeJid(sock.user.id)),
                text: '',
                msg: null
            };
            
            m.quoted.msg = extractMessageContent(m.quoted.message[m.quoted.type]) || m.quoted.message[m.quoted.type];
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || '';
            
            // Download function for quoted media
            m.quoted.download = async () => {
                try {
                    const quotedMsg = m.quoted.msg || m.quoted;
                    const mime = quotedMsg.mimetype || '';
                    const messageType = (m.quoted.type || mime.split('/')[0]).replace(/Message/gi, '');
                    const stream = await downloadContentFromMessage(quotedMsg, messageType);
                    
                    let buffer = Buffer.from([]);
                    for await (const chunk of stream) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }
                    return buffer;
                } catch (e) {
                    console.error(chalk.red('❌ Quoted download error:'), e);
                    return null;
                }
            };
        }
    }
    
    // Download function for main message
    m.download = async () => {
        try {
            const messageToDownload = m.msg || m.quoted;
            const mime = messageToDownload.mimetype || '';
            const messageType = (m.type || mime.split('/')[0]).replace(/Message/gi, '');
            const stream = await downloadContentFromMessage(messageToDownload, messageType);
            
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }
            return buffer;
        } catch (e) {
            console.error(chalk.red('❌ Download error:'), e);
            return null;
        }
    };
    
    // Reply function
    m.reply = async (text, options = {}) => {
        const chatId = options?.chat || m.chat;
        const quoted = options?.quoted || m;
        
        try {
            if (/^https?:\/\//.test(text)) {
                const data = await axios.get(text, { responseType: 'arraybuffer' });
                const mime = data.headers['content-type'];
                
                if (/image|video|audio/i.test(mime)) {
                    return sock.sendMessage(chatId, {
                        [mime.split('/')[0]]: data.data,
                        caption: options.caption || '',
                        ...options
                    }, { quoted });
                }
            }
            
            // Default text message
            const mentions = [...(text.match(/@(\d{0,16})/g) || [])].map(v => v.replace('@', '') + '@s.whatsapp.net');
            return sock.sendMessage(chatId, { 
                text: text, 
                mentions: mentions, 
                ...options 
            }, { quoted });
            
        } catch (e) {
            console.error(chalk.red('❌ Reply error:'), e);
            // Fallback to simple text
            return sock.sendMessage(chatId, { text: text, ...options }, { quoted });
        }
    };
    
    return m;
}

module.exports = { LoadDataBase, MessagesUpsert, Solving };

// Auto reload
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.yellow(`🔄 Update detected: ${path.basename(__filename)}`));
    delete require.cache[file];
    require(file);
});

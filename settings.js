const chalk = require("chalk");
const fs = require("fs");

global.owner = ["6282137487477"]
global.namaOwner = "Nimzz"
global.namaBot = "Elaina-Base"
global.namaBot2 = "Base Bot WhatsApp"

global.tempatDB = 'database.json' // jangan di ubah
global.pairing_code = true 
global.pairingKode = 'ELAINA67'

global.telegram = "t.me/Nimzz4"
global.namaChannel = "Elaina Base"
global.linkSaluran = "https://whatsapp.com/channel/0029VbAwI4cJ3jv4IuzKob04"

global.packname = 'Elaina Bot Sticker';
global.author = 'Elaina Base';

// SETTINGS PAYMENT
global.dana = "-";
global.ovo = "-";
global.gopay = "-";
global.qris = "Gak ada jur";

global.mess = {
    owner: `🚫 *AKSES DITOLAK*\nFitur ini hanya bisa digunakan oleh *Owner Bot* (${global.namaOwner}).`,
    admin: `🚫 *AKSES DITOLAK*\nFitur ini khusus untuk *Admin Grup*.`,
    botAdmin: `🚫 *AKSES DITOLAK*\nBot harus menjadi *Admin Grup* terlebih dahulu untuk menjalankan fitur ini.`,
    group: `🚫 *AKSES DITOLAK*\nFitur ini hanya dapat digunakan di *dalam grup*.`,
    private: `🚫 *AKSES DITOLAK*\nFitur ini hanya bisa digunakan di *chat pribadi*.`,
    prem: `🚫 *AKSES DITOLAK*\nFitur ini hanya tersedia untuk *User Premium*.\n> ketik .prem dan upgrade nomor mu`,
    wait: `⏳ *Mohon tunggu...*\nPermintaan kamu sedang diproses.`,
    error: `❌ *Terjadi kesalahan!*\nSilakan coba lagi nanti.`,
    done: `✅ *Berhasil!*\nProses telah selesai dengan sukses.`
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.white("[•] Update"), chalk.white(`${__filename}\n`))
delete require.cache[file]
require(file)
})
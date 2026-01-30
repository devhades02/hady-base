<div align="center">
  <img src="https://files.catbox.moe/4dt7iv.jpg" width="100%" style="margin-left: auto;margin-right: auto;display: block; border-radius: 10px;">
</div>

<h1 align="center">Elaina Base - WhatsApp Bot</h1>
<h3 align="center">Clean & Simple WhatsApp Bot for Termux</h3>

<div align="center">

![Author](https://img.shields.io/badge/Author-Nimzz-green?style=for-the-badge&logo=github)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Baileys](https://img.shields.io/badge/Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Termux](https://img.shields.io/badge/Termux-000000?style=for-the-badge&logo=android&logoColor=white)

</div>

<div align="center">
  <a href="https://github.com/naim-SC">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=30&duration=4000&color=FF6B8B&center=true&vCenter=true&width=600&lines=Hello,+I+am+Nimzz;Welcome+to+Elaina+Base+☕" alt="Typing SVG">
  </a>
</div>

<div align="center">
  <img src="https://count.getloli.com/@naim-SC?name=elaina-base&theme=booru&padding=7&offset=0&align=center&scale=2&pixelated=1&darkmode=0">
</div>

## 📢 Connect With Me

<div align="center">
  <a href="https://whatsapp.com/channel/0029VbBhZWdGJP8HlbGaE63Q">
    <img src="https://img.shields.io/badge/Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
  </a>
  <a href="https://wa.me/6282137487477">
    <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white">
  </a>
  <a href="https://t.me/Nimzz4">
    <img src="https://img.shields.io/badge/Telegram-0088cc?style=for-the-badge&logo=telegram&logoColor=white">
  </a>
  <a href="https://github.com/naim-SC">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white">
  </a>
</div>

## ✨ Features

### ✅ Core Features
- **Termux Compatible** - Works perfectly on Android Termux
- **Clean Codebase** - No bloat, easy to modify
- **Dual Connection Mode** - QR Code & Pairing Code support
- **Sticker Creator** - Image/Video to WebP with EXIF
- **Multi Database** - JSON & MongoDB support
- **Owner System** - Easy owner management
- **Premium Features** - User premium management
- **Anti-Delete** - Detect deleted messages
- **Auto Backup** - Backup script feature

### 🎯 New Features (Modified Version)
- **Case Management** - Add/del case via command
- **Fun Commands** - Games & entertainment
- **Tools Utility** - Converter & calculators
- **Enhanced Menu** - Better UI & organization
- **Local Data Storage** - No API required

## 🚀 Quick Installation

### For Termux Users
```bash
# Update packages
pkg update && pkg upgrade -y

# Install dependencies
pkg install nodejs git ffmpeg -y

# Clone repository
git clone https://github.com/naim-SC/elaina-base.git
cd base-cases

# Install packages
npm install --legacy-peer-deps

# Configure bot
nano settings.js

# Start bot
npm start
```

For Ubuntu/SSH Users

```bash
# Update system
apt update && apt upgrade -y

# Install dependencies
apt install nodejs git ffmpeg -y

# Clone and setup
git clone https://github.com/naim-SC/elaina-base.git
cd base-cases
npm install --legacy-peer-deps
npm start
```

⚙️ Configuration

Edit settings.js file:

```javascript
// Basic Configuration
global.owner = ["6282137487477"]          // Your WhatsApp number
global.namaOwner = "Nimzz"                // Your name
global.namaBot = "Elaina"                 // Bot name

// Connection Settings
global.pairing_code = false               // false = QR Code, true = Pairing Code
global.pairingKode = 'ELAINA67'           // Pairing code (if enabled)

// Social Links
global.saluran = "https://whatsapp.com/channel/0029VbBhZWdGJP8HlbGaE63Q"
```

📁 Project Structure

```
elaina-base/
├── index.js              # Main bot file
├── settings.js           # Configuration
├── case.js              # Command handler (Main)
├── lib/
│   ├── message.js       # Message processing
│   ├── myfunction.js    # Utilities
│   ├── exif.js          # Sticker creator
│   ├── converter.js     # Media converter
│   └── database.js      # Database handler
├── data/
│   ├── owner.json       # Owner list
│   ├── premium.json     # Premium users
│   └── settings.json    # Bot settings
├── package.json         # Dependencies
├── tmp/                 # Temporary files
└── README.md            # Documentation
```

🛠️ Command Categories

📋 Main Commands

Command Description
.menu Show main menu
.ping Check bot status
.status Bot status info
.help Quick help guide
.time Current time
.date Today's date

🎮 Fun & Games (New!)

Command Description
.fun-menu Show all fun games
.quote Inspirational quotes
.motivasi Motivation words
.fakta Random facts
.tebak Guessing game
.jodoh Match prediction
.truth Truth questions
.dare Dare challenges
.bucin Love quotes
.gombal Sweet talks
.dice Roll dice
.coin Flip coin
.8ball Magic 8-ball

🔧 Tools & Utility

Command Description
.tools-menu Show all tools
.calc Calculator
.base64 Base64 converter
.binary Binary converter
.hex Hex converter
.style Text styling
.fontlist Font list
.qrcode Create QR code
.stickerinfo Sticker information

👑 Owner Commands

Command Description
.owner-menu Owner command list
.addowner Add new owner
.delowner Remove owner
.addprem Add premium user
.delprem Remove premium user
.listprem List premium users
.backup Backup bot script
.addcaser Add case via reply

🎯 Key Features

1. Enhanced Case Management

```javascript
// Example usage:
.addcaser testcase
// Then reply with code to add
```

2. Fun Factory System

· 100+ quotes, facts, and games
· No external API required
· Local data storage
· Interactive gameplay

3. Utility Tools

· Base64/Binary/Hex converters
· Text styling options
· Safe calculator
· QR code generator

4. Smart Menu System

· Organized categories
· Clear descriptions
· External ad integration
· User-friendly interface

📸 Command Examples

Basic Usage

```bash
# Check bot status
.ping

# Get inspirational quote
.quote

# Create QR code
.qrcode https://github.com/naim-SC

# Calculate expression
.calc 10+5*2

# Play guessing game
.tebak
```

Advanced Features

```bash
# Owner: Add new case via reply
.addcaser welcome
# Reply: m.reply("Welcome to the bot!");

# Owner: Backup bot
.backup

# Owner: Add premium user
.addprem 6281234567890 30
```

🔧 Troubleshooting

Common Issues & Solutions

```bash
# 1. Cannot find module
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# 2. Permission denied
chmod 755 *.js
npm install --no-bin-links

# 3. FFmpeg not found
pkg install ffmpeg -y

# 4. Bot not connecting
rm -rf session
node index.js

# 5. JSZip not found (for backup)
npm install jszip --legacy-peer-deps
```

Quick Fix Script

Create fix.sh:

```bash
#!/bin/bash
echo "🔧 Fixing common issues..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps --no-bin-links
echo "✅ Done! Run: npm start"
```

## 🏆 GitHub Profile Metrics

<div align="center">
  
  <!-- Profile Summary Cards -->
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=naim-SC&theme=2077" width="100%" />
  
  <!-- Stats Cards -->
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/stats?username=naim-SC&theme=2077" width="49%" />
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/productive-time?username=naim-SC&theme=2077&utcOffset=7" width="49%" />
  
  <!-- Languages Card -->
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/repos-per-language?username=naim-SC&theme=2077" width="49%" />
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/most-commit-language?username=naim-SC&theme=2077" width="49%" />
  
</div>

🤝 Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

Note: This is a modified version based on the original Elaina Base. Please give proper credit when using or modifying.

⭐ Support

Jika project ini membantu Anda, jangan lupa kasih ⭐ ya!
Saran saya pake panel aja ya 🗿

Bot structure inspiration by denzy

---

<div align="center">

🚀 Modified Version Notice

<p><strong>⚠️ Important:</strong> This is a modified version with enhanced features:</p>

🔥 New Additions:

· Case Management System - Add/delete commands via chat
· Fun & Games Collection - 20+ entertainment commands
· Utility Tools - Converters, calculators, text tools
· Enhanced UI - Better menus and organization
· Improved Safety - Better error handling

📝 Original Credits:

· Base Author: Nimzz
· Repository: naim-SC/elaina-base
· License: MIT

<p>© 2026 - Elaina Base | WhatsApp Bot (Modified Version)</p>
<p>Made with ❤️ by <a href="https://github.com/naim-SC">Nimzz</a></p>

</div>

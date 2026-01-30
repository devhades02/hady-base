const chalk = require('chalk');

// Warna utama
const color = (text, color) => {
    return !color ? chalk.green(text) : chalk.keyword(color)(text);
};

const bgcolor = (text, bgcolor) => {
    return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text);
};

// Warna khusus untuk log
const logColor = (text, color) => {
    const colors = {
        'red': chalk.red,
        'green': chalk.green,
        'yellow': chalk.yellow,
        'blue': chalk.blue,
        'magenta': chalk.magenta,
        'cyan': chalk.cyan,
        'white': chalk.white,
        'gray': chalk.gray
    };
    return colors[color] ? colors[color](text) : chalk.green(text);
};

// Fungsi log dengan format
const Lognyong = (text, type = 'info') => {
    const types = {
        'info': chalk.cyan('[ INFO ]'),
        'success': chalk.green('[ SUCCESS ]'),
        'warning': chalk.yellow('[ WARNING ]'),
        'error': chalk.red('[ ERROR ]'),
        'debug': chalk.magenta('[ DEBUG ]'),
        'cmd': chalk.blue('[ COMMAND ]')
    };
    
    const prefix = types[type] || types['info'];
    return `${prefix} ${text}`;
};

// Export semua fungsi yang mungkin dipakai
module.exports = {
    color,
    bgcolor,
    Lognyong,
    logColor,
    
    // Warna cepat (shortcuts)
    red: (text) => chalk.red(text),
    green: (text) => chalk.green(text),
    yellow: (text) => chalk.yellow(text),
    blue: (text) => chalk.blue(text),
    magenta: (text) => chalk.magenta(text),
    cyan: (text) => chalk.cyan(text),
    white: (text) => chalk.white(text),
    gray: (text) => chalk.gray(text),
    bold: (text) => chalk.bold(text),
    
    // Kombinasi
    success: (text) => chalk.green.bold(`✅ ${text}`),
    error: (text) => chalk.red.bold(`❌ ${text}`),
    warning: (text) => chalk.yellow.bold(`⚠️ ${text}`),
    info: (text) => chalk.cyan.bold(`ℹ️ ${text}`)
};
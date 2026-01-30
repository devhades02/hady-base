require('../settings');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const mongoose = require('mongoose');

let DataBase;

if (/mongo/.test(global.tempatDB)) {
    // MongoDB Class
    DataBase = class mongoDB {
        constructor(url, options = { 
            useNewUrlParser: true, 
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        }) {
            this.url = url || global.mongoURL;
            this.data = {};
            this._model = {};
            this.options = options;
            this.isConnected = false;
        }
        
        async connect() {
            if (this.isConnected) return;
            try {
                await mongoose.connect(this.url, this.options);
                this.isConnected = true;
                console.log(chalk.green('✅ MongoDB connected successfully'));
            } catch (error) {
                console.error(chalk.red('❌ MongoDB connection error:'), error.message);
                throw error;
            }
        }
        
        read = async () => {
            await this.connect();
            
            try {
                // Cek apakah model sudah ada
                if (!this._model || Object.keys(this._model).length === 0) {
                    const schema = new mongoose.Schema({
                        data: {
                            type: Object,
                            required: true,
                            default: {},
                        },
                        updatedAt: {
                            type: Date,
                            default: Date.now
                        }
                    });
                    
                    // Auto-create indexes
                    schema.index({ updatedAt: -1 });
                    
                    try {
                        this._model = mongoose.model('whatsapp_bot_data');
                    } catch {
                        this._model = mongoose.model('whatsapp_bot_data', schema);
                    }
                }
                
                // Cari atau buat data
                this.data = await this._model.findOne({}).lean();
                
                if (!this.data) {
                    const newData = new this._model({ data: {} });
                    await newData.save();
                    this.data = await this._model.findOne({}).lean();
                }
                
                return this.data?.data || {};
                
            } catch (error) {
                console.error(chalk.red('❌ MongoDB read error:'), error.message);
                return {};
            }
        }
        
        write = async (data) => {
            try {
                await this.connect();
                
                if (!this.data || !this.data._id) {
                    const newDoc = new this._model({ data });
                    await newDoc.save();
                    this.data = newDoc;
                } else {
                    await this._model.findByIdAndUpdate(
                        this.data._id, 
                        { 
                            data, 
                            updatedAt: Date.now() 
                        },
                        { new: true }
                    );
                }
                
                return true;
            } catch (error) {
                console.error(chalk.red('❌ MongoDB write error:'), error.message);
                return false;
            }
        }
        
        async close() {
            if (this.isConnected) {
                await mongoose.connection.close();
                this.isConnected = false;
                console.log(chalk.yellow('🔌 MongoDB connection closed'));
            }
        }
    };
    
} else if (/json/.test(global.tempatDB)) {
    // JSON Database Class
    DataBase = class dataBase {
        constructor() {
            this.data = {};
            // Pastikan path benar
            this.file = path.join(process.cwd(), 'data', global.tempatDB);
            this.backupDir = path.join(process.cwd(), 'data', 'backups');
            this.ensureBackupDir();
        }
        
        ensureBackupDir() {
            if (!fs.existsSync(this.backupDir)) {
                fs.mkdirSync(this.backupDir, { recursive: true });
            }
        }
        
        createBackup() {
            try {
                if (fs.existsSync(this.file)) {
                    const backupFile = path.join(
                        this.backupDir, 
                        `backup_${Date.now()}_${path.basename(this.file)}`
                    );
                    fs.copyFileSync(this.file, backupFile);
                }
            } catch (error) {
                console.error(chalk.yellow('⚠️  Backup creation failed:'), error.message);
            }
        }
        
        read = async () => {
            try {
                if (fs.existsSync(this.file)) {
                    const fileContent = fs.readFileSync(this.file, 'utf8');
                    if (!fileContent.trim()) {
                        console.log(chalk.yellow('⚠️  Database file is empty, creating new one'));
                        return this.reset();
                    }
                    
                    this.data = JSON.parse(fileContent);
                    return this.data;
                } else {
                    // Buat directory jika belum ada
                    const dir = path.dirname(this.file);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    
                    // Buat file dengan struktur default
                    this.data = { 
                        users: {}, 
                        groups: {}, 
                        settings: {}, 
                        database: {} 
                    };
                    await this.write(this.data);
                    return this.data;
                }
            } catch (error) {
                console.error(chalk.red('❌ JSON read error:'), error.message);
                
                // Backup corrupted file
                if (fs.existsSync(this.file)) {
                    const corruptedFile = path.join(
                        this.backupDir, 
                        `corrupted_${Date.now()}_${path.basename(this.file)}`
                    );
                    fs.renameSync(this.file, corruptedFile);
                    console.log(chalk.yellow(`⚠️  Corrupted file moved to: ${corruptedFile}`));
                }
                
                // Return default data
                return this.reset();
            }
        }
        
        write = async (data) => {
            try {
                this.data = data || global.db;
                
                // Buat backup sebelum write
                this.createBackup();
                
                const dirname = path.dirname(this.file);
                if (!fs.existsSync(dirname)) {
                    fs.mkdirSync(dirname, { recursive: true });
                }
                
                fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
                return this.file;
                
            } catch (error) {
                console.error(chalk.red('❌ JSON write error:'), error.message);
                return false;
            }
        }
        
        reset() {
            this.data = { 
                users: {}, 
                groups: {}, 
                settings: {}, 
                database: {} 
            };
            return this.data;
        }
        
        getFilePath() {
            return this.file;
        }
    };
} else {
    // Fallback ke JSON jika format tidak dikenali
    console.log(chalk.yellow(`⚠️  Database format "${global.tempatDB}" tidak dikenali, menggunakan JSON default`));
    global.tempatDB = 'database.json';
    // Re-require dengan settings yang sudah diubah
    delete require.cache[require.resolve('../settings')];
    require('../settings');
}

module.exports = DataBase;

// Auto reload jika file diupdate
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.yellow(`🔄 Update detected: ${path.basename(__filename)}`));
    delete require.cache[file];
    require(file);
});
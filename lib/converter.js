const fs = require('fs').promises; // Pakai promises untuk konsistensi
const path = require('path');
const { spawn } = require('child_process');

// Buat folder sampah jika belum ada
const tmpDir = path.join(__dirname, '../database/sampah');
if (!fs.existsSync) {
    const fsSync = require('fs');
    if (!fsSync.existsSync(tmpDir)) {
        fsSync.mkdirSync(tmpDir, { recursive: true });
    }
}

function ffmpeg(buffer, args = [], ext = '', ext2 = '') {
    return new Promise(async (resolve, reject) => {
        try {
            const tmp = path.join(tmpDir, Date.now() + '.' + ext);
            const out = tmp + '.' + ext2;
            
            await fs.writeFile(tmp, buffer);
            
            const ff = spawn('ffmpeg', [
                '-y',
                '-i', tmp,
                ...args,
                out
            ]);
            
            let stderr = '';
            ff.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            ff.on('error', (err) => {
                console.error('FFmpeg spawn error:', err);
                reject(err);
            });
            
            ff.on('close', async (code) => {
                try {
                    await fs.unlink(tmp).catch(() => {});
                    
                    if (code !== 0) {
                        console.error('FFmpeg error:', stderr);
                        return reject(new Error(`FFmpeg exited with code ${code}`));
                    }
                    
                    const result = await fs.readFile(out);
                    await fs.unlink(out).catch(() => {});
                    resolve(result);
                    
                } catch (e) {
                    reject(e);
                }
            });
            
            // Timeout untuk mencegah hanging
            setTimeout(() => {
                if (ff.exitCode === null) {
                    ff.kill();
                    reject(new Error('FFmpeg timeout'));
                }
            }, 30000); // 30 detik timeout
            
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Convert Audio to Playable WhatsApp Audio (MP3)
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext Original File Extension
 */
function toAudio(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-ac', '2',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'mp3'
    ], ext, 'mp3');
}

/**
 * Convert Audio to Playable WhatsApp PTT (Voice Note)
 * @param {Buffer} buffer Audio Buffer
 * @param {String} ext Original File Extension
 */
function toPTT(buffer, ext) {
    return ffmpeg(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-vbr', 'on',
        '-compression_level', '10',
        '-f', 'opus'
    ], ext, 'opus');
}

/**
 * Convert Video to Playable WhatsApp Video (MP4)
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext Original File Extension
 */
function toVideo(buffer, ext) {
    return ffmpeg(buffer, [
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-ab', '128k',
        '-ar', '44100',
        '-crf', '32',
        '-preset', 'slow',
        '-f', 'mp4'
    ], ext, 'mp4');
}

/**
 * Convert Image to WebP (for stickers)
 * @param {Buffer} buffer Image Buffer
 * @param {String} ext Original File Extension
 */
function toWebp(buffer, ext) {
    return ffmpeg(buffer, [
        '-vf', 'scale=512:512:flags=lanczos',
        '-c:v', 'libwebp',
        '-quality', '90',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        '-f', 'webp'
    ], ext, 'webp');
}

/**
 * Convert Video to WebP (animated sticker)
 * @param {Buffer} buffer Video Buffer
 * @param {String} ext Original File Extension
 */
function videoToWebp(buffer, ext) {
    return ffmpeg(buffer, [
        '-vf', 'scale=512:512:flags=lanczos,fps=10',
        '-c:v', 'libwebp',
        '-quality', '90',
        '-loop', '0',
        '-preset', 'default',
        '-an',
        '-vsync', '0',
        '-f', 'webp'
    ], ext, 'webp');
}

/**
 * Convert to WhatsApp Document (keep original)
 * @param {Buffer} buffer File Buffer
 * @param {String} ext Original File Extension
 */
function toDocument(buffer, ext) {
    return Promise.resolve(buffer); // Return as is
}

module.exports = {
    toAudio,
    toPTT,
    toVideo,
    toWebp,
    videoToWebp,
    toDocument,
    ffmpeg
};
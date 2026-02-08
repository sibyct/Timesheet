import path from 'path';

const logDir = path.join(__dirname, '..', '..', 'logs');

export default {
    logDirectory: logDir,
    errorFile: 'error.log',
    combinedFile: 'combined.log',
    maxFileSize: 5242880, // 5MB
    maxFiles: 5,
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        http: 3,
        debug: 4,
    },
    consoleLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    timestampFormat: 'YYYY-MM-DD HH:mm:ss',
};
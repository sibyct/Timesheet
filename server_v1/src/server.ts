import { initializeApp } from './app';
const PORT = process.env.PORT || 3000;
import { logger } from "@utils/loggers";
import http from 'http';
import { pool } from "@configs/database.config";


// Shutdown server gracefully
async function shutdownServer(server: http.Server) {
    logger.info('Server shutting down...');
    await pool.end();
    server.close(() => process.exit(0));
}

function appStarted() {
    logger.info(`Server running on port ${PORT}`);
}

// Register process events
function registerProcessEvents(server: http.Server) {

    server.on('error', (err: NodeJS.ErrnoException) => {
        switch (err.code) {
            case 'EADDRINUSE':
                logger.error(`Port ${PORT} is already in use.`);
                break;
            case 'EACCES':
                logger.error(`Permission denied to use port ${PORT}.`);
                break;
            default:
                logger.error(`Server failed to start:`, err);
                break;
        }
    });

    pool.on('connect', () => {
        logger.info('Database connected successfully');
    });

    pool.on('error', (err: Error) => {
        logger.error('Database connection error', err);
    });

    process.on('SIGTERM', async () => {
        await shutdownServer(server);
    });

    process.on('SIGINT', async () => {
        await shutdownServer(server);
    });

    process.on('uncaughtException', (err) => {
        logger.error('Uncaught Exception:', err);
        process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
        logger.error('Unhandled Rejection:', reason);
        process.exit(1);
    });
}

// Start server
async function startServer() {
    try {
        const app = await initializeApp();
        const server = app.listen(PORT, appStarted);
        registerProcessEvents(server);

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
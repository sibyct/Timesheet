// Load environment variables from .env if present
require('dotenv').config();

module.exports = {
    // MongoDB connection string
    mongoUri: process.env.MONGO_URI,
    // Session secret
    sessionSecret: process.env.SESSION_SECRET,
    // Server port (optional)
    port: process.env.PORT || 3000,
    // Other configuration values can be added here
};

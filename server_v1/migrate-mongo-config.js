/**
 * migrate-mongo configuration
 * https://github.com/seppevs/migrate-mongo
 *
 * Run migrations:
 *   npm run migrate:up
 *   npm run migrate:down
 *   npm run migrate:status
 */

// Load .env so MONGO_URI is available when running migrations directly
require("dotenv").config();

const config = {
  mongodb: {
    url: process.env.MONGO_URI || "mongodb://localhost:27017/timesheet_db",

    options: {
      // No deprecated options needed for Mongoose 8 / MongoDB driver 6+
    },
  },

  // Directory that stores migration files (relative to this config file)
  migrationsDir: "migrations",

  // Collection that tracks which migrations have been applied
  changelogCollectionName: "changelog",

  migrationFileExtension: ".js",

  // Use file-content hash to detect edited-after-applied migrations
  useFileHash: false,

  moduleSystem: "commonjs",
};

module.exports = config;

'use strict';
const fs = require('node:fs');
const path = require('node:path');
// tiny .env loader (no dependency)
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
module.exports = {
  PORT: +process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  JWT_EXPIRES: +process.env.JWT_EXPIRES_SECONDS || 7200, // 2 hours
  DB_FILE: process.env.DB_FILE
    ? path.resolve(process.env.DB_FILE)
    : path.join(__dirname, 'db', 'floodgrid.db'),
  CLIENT_DIR: path.join(__dirname, '..', 'frontend'),
};

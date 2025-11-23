import fs from 'fs';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'inventory.sqlite');

export function getDb() {
  const db = new sqlite3.Database(DB_PATH);
  db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;')
    db.run('PRAGMA journal_mode = WAL;'); 
  });
  return db;
}

function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  const db = getDb();
  db.exec(schema, (err) => {
    if (err) {
      console.error('DB init error:', err);
      process.exit(1);
    }
    console.log('Database initialized at', DB_PATH);
    db.close();
  });
}

if (process.argv.includes('--init')) init();
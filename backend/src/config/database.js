const path = require('path');
const fs = require('fs');

// Simple database with persistence to disk
const dbPath = process.env.DB_PATH || './data/ecg_platform.db';
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

class Database {
  constructor() {
    this.tables = {
      users: [],
      patients: [],
      doctors: [],
      hospitals: [],
      ecg_records: [],
      ai_analyses: [],
      alerts: [],
      notifications: [],
      patient_ecg_profiles: [],
      risk_predictions: [],
      messages: [],
      settings: [],
      reset_tokens: []
    };
    this.nextId = {};
    this.loadFromDisk();
  }

  // Save database to disk
  saveToDisk() {
    try {
      const data = {
        tables: this.tables,
        nextId: this.nextId
      };
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('❌ Failed to save database to disk:', err);
    }
  }

  // Load database from disk
  loadFromDisk() {
    try {
      if (fs.existsSync(dbPath)) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        this.tables = {
          users: [],
          patients: [],
          doctors: [],
          hospitals: [],
          ecg_records: [],
          ai_analyses: [],
          alerts: [],
          notifications: [],
          patient_ecg_profiles: [],
          risk_predictions: [],
          messages: [],
          settings: [],
          reset_tokens: [],
          ...data.tables
        };
        this.nextId = data.nextId || {};
        console.log('✅ Database loaded from disk');
        return true;
      }
    } catch (err) {
      console.error('❌ Failed to load database from disk:', err);
    }
    return false;
  }

  nextAutoId(table) {
    if (!this.nextId[table]) this.nextId[table] = 1;
    return this.nextId[table]++;
  }

  // Generic CRUD
  insert(table, data) {
    const id = this.nextAutoId(table);
    const record = { id, ...data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    this.tables[table].push(record);
    this.saveToDisk(); // Auto-save after insert
    return record;
  }

  findAll(table, filter = {}) {
    return this.tables[table].filter(row => {
      return Object.entries(filter).every(([k, v]) => row[k] === v);
    });
  }

  findOne(table, filter = {}) {
    return this.tables[table].find(row => {
      return Object.entries(filter).every(([k, v]) => row[k] === v);
    });
  }

  findById(table, id) {
    return this.tables[table].find(row => row.id === id);
  }

  update(table, id, data) {
    const idx = this.tables[table].findIndex(row => row.id === id);
    if (idx === -1) return null;
    this.tables[table][idx] = { ...this.tables[table][idx], ...data, updated_at: new Date().toISOString() };
    this.saveToDisk(); // Auto-save after update
    return this.tables[table][idx];
  }

  delete(table, id) {
    const idx = this.tables[table].findIndex(row => row.id === id);
    if (idx === -1) return false;
    this.tables[table].splice(idx, 1);
    this.saveToDisk(); // Auto-save after delete
    return true;
  }

  query(table, fn) {
    return this.tables[table].filter(fn);
  }

  count(table, filter = {}) {
    return this.findAll(table, filter).length;
  }

  isEmpty() {
    // Check if the database has any data
    return Object.values(this.tables).every(table => table.length === 0);
  }
}

const db = new Database();
module.exports = db;

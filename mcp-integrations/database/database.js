/**
 * Database Module
 * Simple SQLite database for storing scraped data and cache
 */

import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Database {
  constructor() {
    this.dbPath = path.join(__dirname, 'agentradar.db');
    this.db = null;
    this.initialized = false;
  }
  
  async init() {
    if (this.initialized) return;
    
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection failed:', err.message);
          reject(err);
          return;
        }
        
        console.error('Connected to SQLite database');
        this.createTables()
          .then(() => {
            this.initialized = true;
            resolve();
          })
          .catch(reject);
      });
    });
  }
  
  async createTables() {
    const tables = [
      // Court filings table
      `CREATE TABLE IF NOT EXISTS court_filings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        address TEXT NOT NULL,
        filing_date TEXT,
        case_number TEXT,
        amount INTEGER,
        priority TEXT,
        source TEXT,
        region TEXT,
        raw_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Property analysis cache
      `CREATE TABLE IF NOT EXISTS property_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT UNIQUE NOT NULL,
        market_value INTEGER,
        confidence REAL,
        analysis_data TEXT, -- JSON blob
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )`,
      
      // Estate sales
      `CREATE TABLE IF NOT EXISTS estate_sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        address TEXT NOT NULL,
        sale_date TEXT,
        executor_contact TEXT,
        estimated_value INTEGER,
        area TEXT,
        source TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Development applications
      `CREATE TABLE IF NOT EXISTS development_apps (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        municipality TEXT NOT NULL,
        application_type TEXT,
        address TEXT,
        application_number TEXT,
        status TEXT,
        filed_date TEXT,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // System metrics
      `CREATE TABLE IF NOT EXISTS system_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];
    
    for (const table of tables) {
      await this.run(table);
    }
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_court_filings_region ON court_filings(region)',
      'CREATE INDEX IF NOT EXISTS idx_court_filings_type ON court_filings(type)',
      'CREATE INDEX IF NOT EXISTS idx_property_analysis_address ON property_analysis(address)',
      'CREATE INDEX IF NOT EXISTS idx_estate_sales_area ON estate_sales(area)',
      'CREATE INDEX IF NOT EXISTS idx_development_apps_municipality ON development_apps(municipality)',
      'CREATE INDEX IF NOT EXISTS idx_system_metrics_name ON system_metrics(metric_name)'
    ];
    
    for (const index of indexes) {
      await this.run(index);
    }
  }
  
  async run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }
  
  async get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }
  
  async all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Database error:', err.message);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  
  // Court filings methods
  async saveCourtFiling(filing) {
    const sql = `
      INSERT OR REPLACE INTO court_filings 
      (type, address, filing_date, case_number, amount, priority, source, region, raw_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    return this.run(sql, [
      filing.type,
      filing.address,
      filing.filingDate,
      filing.caseNumber,
      filing.amount,
      filing.priority,
      filing.source,
      filing.region,
      filing.rawContent
    ]);
  }
  
  async getCourtFilings(region, limit = 50) {
    const sql = `
      SELECT * FROM court_filings 
      WHERE region = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    return this.all(sql, [region, limit]);
  }
  
  // Property analysis cache methods
  async savePropertyAnalysis(address, analysis) {
    const sql = `
      INSERT OR REPLACE INTO property_analysis 
      (address, market_value, confidence, analysis_data, expires_at)
      VALUES (?, ?, ?, ?, datetime('now', '+24 hours'))
    `;
    
    return this.run(sql, [
      address,
      analysis.marketValue?.estimated,
      analysis.marketValue?.confidence,
      JSON.stringify(analysis)
    ]);
  }
  
  async getPropertyAnalysis(address) {
    const sql = `
      SELECT * FROM property_analysis 
      WHERE address = ? AND expires_at > datetime('now')
    `;
    
    const row = await this.get(sql, [address]);
    if (row) {
      return {
        ...row,
        analysis_data: JSON.parse(row.analysis_data)
      };
    }
    return null;
  }
  
  // Estate sales methods
  async saveEstateSale(sale) {
    const sql = `
      INSERT OR REPLACE INTO estate_sales 
      (address, sale_date, executor_contact, estimated_value, area, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    return this.run(sql, [
      sale.address,
      sale.saleDate,
      sale.executorContact,
      sale.estimatedValue,
      sale.area,
      sale.source
    ]);
  }
  
  async getEstateSales(area, limit = 50) {
    const sql = `
      SELECT * FROM estate_sales 
      WHERE area LIKE ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    return this.all(sql, [`%${area}%`, limit]);
  }
  
  // Development applications methods
  async saveDevelopmentApp(app) {
    const sql = `
      INSERT OR REPLACE INTO development_apps 
      (municipality, application_type, address, application_number, status, filed_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    return this.run(sql, [
      app.municipality,
      app.applicationType,
      app.address,
      app.applicationNumber,
      app.status,
      app.filedDate,
      app.description
    ]);
  }
  
  async getDevelopmentApps(municipality, limit = 50) {
    const sql = `
      SELECT * FROM development_apps 
      WHERE municipality = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `;
    
    return this.all(sql, [municipality, limit]);
  }
  
  // System metrics methods
  async saveMetric(name, value) {
    const sql = `INSERT INTO system_metrics (metric_name, metric_value) VALUES (?, ?)`;
    return this.run(sql, [name, value]);
  }
  
  async getMetrics(name, hours = 24) {
    const sql = `
      SELECT * FROM system_metrics 
      WHERE metric_name = ? AND timestamp > datetime('now', '-${hours} hours')
      ORDER BY timestamp DESC
    `;
    
    return this.all(sql, [name]);
  }
  
  // Cleanup methods
  async cleanupExpiredCache() {
    const sql = `DELETE FROM property_analysis WHERE expires_at <= datetime('now')`;
    return this.run(sql);
  }
  
  async cleanupOldData(days = 90) {
    const tables = ['court_filings', 'estate_sales', 'development_apps', 'system_metrics'];
    
    for (const table of tables) {
      const sql = `DELETE FROM ${table} WHERE created_at <= datetime('now', '-${days} days')`;
      await this.run(sql);
    }
  }
  
  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.error('Database connection closed');
          }
          resolve();
        });
      });
    }
  }
  
  async getStats() {
    const stats = {};
    const tables = ['court_filings', 'property_analysis', 'estate_sales', 'development_apps'];
    
    for (const table of tables) {
      const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
      stats[table] = result.count;
    }
    
    return stats;
  }
}

// Singleton instance
export const db = new Database();
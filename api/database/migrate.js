#!/usr/bin/env node

/**
 * Database Migration Tool
 * Handles migration from SQLite to PostgreSQL and ongoing migrations
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
import sqlite3 from 'sqlite3';
import { Database } from '../database/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { Pool } = pg;

class DatabaseMigrator {
    constructor() {
        this.pgPool = new Pool({
            host: process.env.POSTGRES_HOST || 'localhost',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DATABASE || 'agentradar',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'password',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });

        this.sqliteDB = new Database();
        this.migrations = [];
    }

    async initialize() {
        await this.sqliteDB.init();
        console.log('✓ SQLite connection established');
        
        try {
            await this.pgPool.query('SELECT NOW()');
            console.log('✓ PostgreSQL connection established');
        } catch (error) {
            console.error('✗ PostgreSQL connection failed:', error.message);
            throw error;
        }
    }

    async createPostgresSchema() {
        console.log('📄 Creating PostgreSQL schema...');
        
        const schemaPath = join(__dirname, 'postgres-schema.sql');
        const schemaSql = readFileSync(schemaPath, 'utf8');
        
        const client = await this.pgPool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Split and execute each statement
            const statements = schemaSql
                .split(/;\s*$/gm)
                .filter(stmt => stmt.trim().length > 0);
            
            for (const statement of statements) {
                const trimmed = statement.trim();
                if (trimmed && !trimmed.startsWith('--') && trimmed !== 'COMMIT') {
                    try {
                        await client.query(trimmed);
                    } catch (error) {
                        if (!error.message.includes('already exists')) {
                            console.error(`Error executing statement: ${trimmed.substring(0, 100)}...`);
                            throw error;
                        }
                    }
                }
            }
            
            await client.query('COMMIT');
            console.log('✓ PostgreSQL schema created successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async migrateData() {
        console.log('🔄 Starting data migration from SQLite to PostgreSQL...');
        
        const client = await this.pgPool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Migrate court filings
            await this.migrateCourtFilings(client);
            
            // Migrate property analytics cache
            await this.migratePropertyAnalytics(client);
            
            // Migrate estate sales
            await this.migrateEstateSales(client);
            
            // Migrate development applications
            await this.migrateDevelopmentApplications(client);
            
            await client.query('COMMIT');
            console.log('✓ Data migration completed successfully');
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('✗ Data migration failed:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    async migrateCourtFilings(client) {
        console.log('  → Migrating court filings...');
        
        const sqliteFilings = await this.sqliteDB.query(`
            SELECT * FROM court_filings ORDER BY created_at
        `);
        
        if (sqliteFilings.length === 0) {
            console.log('    No court filings to migrate');
            return;
        }
        
        const insertQuery = `
            INSERT INTO court_filings (
                type, case_number, address, city, province, postal_code,
                filing_date, sale_date, upset_price, estimated_value,
                court, lawyer_firm, lawyer_contact, description, source_url,
                scrape_source, scrape_date, is_processed, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
            ON CONFLICT DO NOTHING
        `;
        
        for (const filing of sqliteFilings) {
            try {
                const alertType = this.mapAlertType(filing.type);
                const metadata = filing.metadata ? JSON.parse(filing.metadata) : {};
                
                await client.query(insertQuery, [
                    alertType,
                    filing.case_number,
                    filing.address,
                    filing.city,
                    filing.province,
                    filing.postal_code,
                    filing.filing_date,
                    filing.sale_date,
                    filing.upset_price,
                    filing.estimated_value,
                    filing.court,
                    filing.lawyer_firm,
                    filing.lawyer_contact,
                    filing.description,
                    filing.source_url,
                    filing.scrape_source || 'sqlite_migration',
                    filing.scrape_date || filing.created_at,
                    filing.is_processed || false,
                    metadata
                ]);
            } catch (error) {
                console.error(`    Error migrating filing ${filing.id}:`, error.message);
            }
        }
        
        console.log(`    Migrated ${sqliteFilings.length} court filings`);
    }

    async migratePropertyAnalytics(client) {
        console.log('  → Migrating property analytics...');
        
        const sqliteAnalytics = await this.sqliteDB.query(`
            SELECT * FROM property_analysis_cache ORDER BY created_at
        `);
        
        if (sqliteAnalytics.length === 0) {
            console.log('    No property analytics to migrate');
            return;
        }
        
        const insertQuery = `
            INSERT INTO property_analytics (
                address, city, province, analysis_date, market_value,
                estimated_rent, cap_rate, cash_flow, roi_percentage,
                comparable_sales, market_trends, risk_factors,
                opportunity_score, confidence_level, data_sources
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT DO NOTHING
        `;
        
        for (const analytics of sqliteAnalytics) {
            try {
                const analysis = analytics.analysis ? JSON.parse(analytics.analysis) : {};
                
                await client.query(insertQuery, [
                    analytics.address,
                    analytics.city,
                    analytics.province || 'ON',
                    analytics.created_at.split('T')[0], // Extract date
                    analysis.marketValue || analysis.market_value,
                    analysis.estimatedRent || analysis.estimated_rent,
                    analysis.capRate || analysis.cap_rate,
                    analysis.cashFlow || analysis.cash_flow,
                    analysis.roiPercentage || analysis.roi_percentage,
                    JSON.stringify(analysis.comparableSales || {}),
                    JSON.stringify(analysis.marketTrends || {}),
                    JSON.stringify(analysis.riskFactors || {}),
                    analysis.opportunityScore || analysis.opportunity_score || 50,
                    analysis.confidenceLevel || analysis.confidence_level || 'medium',
                    JSON.stringify(analysis.dataSources || ['sqlite_migration'])
                ]);
            } catch (error) {
                console.error(`    Error migrating analytics ${analytics.id}:`, error.message);
            }
        }
        
        console.log(`    Migrated ${sqliteAnalytics.length} property analytics records`);
    }

    async migrateEstateSales(client) {
        console.log('  → Migrating estate sales...');
        
        const sqliteEstates = await this.sqliteDB.query(`
            SELECT * FROM estate_sales ORDER BY created_at
        `);
        
        if (sqliteEstates.length === 0) {
            console.log('    No estate sales to migrate');
            return;
        }
        
        const insertQuery = `
            INSERT INTO estate_sales (
                address, city, province, postal_code, sale_date,
                property_type, estimated_value, estate_details,
                contact_info, source_url, scrape_source, scrape_date, is_processed
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT DO NOTHING
        `;
        
        for (const estate of sqliteEstates) {
            try {
                await client.query(insertQuery, [
                    estate.address,
                    estate.city,
                    estate.province || 'ON',
                    estate.postal_code,
                    estate.sale_date,
                    estate.property_type,
                    estate.estimated_value,
                    estate.estate_details ? JSON.parse(estate.estate_details) : {},
                    estate.contact_info ? JSON.parse(estate.contact_info) : {},
                    estate.source_url,
                    estate.scrape_source || 'sqlite_migration',
                    estate.scrape_date || estate.created_at,
                    estate.is_processed || false
                ]);
            } catch (error) {
                console.error(`    Error migrating estate sale ${estate.id}:`, error.message);
            }
        }
        
        console.log(`    Migrated ${sqliteEstates.length} estate sales`);
    }

    async migrateDevelopmentApplications(client) {
        console.log('  → Migrating development applications...');
        
        const sqliteApps = await this.sqliteDB.query(`
            SELECT * FROM development_applications ORDER BY created_at
        `);
        
        if (sqliteApps.length === 0) {
            console.log('    No development applications to migrate');
            return;
        }
        
        const insertQuery = `
            INSERT INTO development_applications (
                application_number, address, city, province, application_type,
                description, applicant, status, submission_date, decision_date,
                municipality, ward, zoning_info, documents, source_url,
                scrape_source, scrape_date, is_processed
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            ON CONFLICT DO NOTHING
        `;
        
        for (const app of sqliteApps) {
            try {
                await client.query(insertQuery, [
                    app.application_number,
                    app.address,
                    app.city,
                    app.province || 'ON',
                    app.application_type,
                    app.description,
                    app.applicant,
                    app.status,
                    app.submission_date,
                    app.decision_date,
                    app.municipality,
                    app.ward,
                    app.zoning_info ? JSON.parse(app.zoning_info) : {},
                    app.documents ? JSON.parse(app.documents) : [],
                    app.source_url,
                    app.scrape_source || 'sqlite_migration',
                    app.scrape_date || app.created_at,
                    app.is_processed || false
                ]);
            } catch (error) {
                console.error(`    Error migrating development application ${app.id}:`, error.message);
            }
        }
        
        console.log(`    Migrated ${sqliteApps.length} development applications`);
    }

    mapAlertType(sqliteType) {
        const typeMap = {
            'power_of_sale': 'POWER_OF_SALE',
            'foreclosure': 'FORECLOSURE',
            'estate_sale': 'ESTATE_SALE',
            'tax_sale': 'TAX_SALE'
        };
        return typeMap[sqliteType] || 'POWER_OF_SALE';
    }

    async validateMigration() {
        console.log('🔍 Validating migration...');
        
        const client = await this.pgPool.connect();
        
        try {
            // Count records in each table
            const tables = [
                'court_filings',
                'property_analytics', 
                'estate_sales',
                'development_applications'
            ];
            
            for (const table of tables) {
                const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`  ${table}: ${result.rows[0].count} records`);
            }
            
            // Test search functionality
            const searchTest = await client.query(`
                SELECT COUNT(*) FROM court_filings 
                WHERE search_vector @@ to_tsquery('english', 'toronto')
            `);
            console.log(`  Full-text search test: ${searchTest.rows[0].count} results for 'toronto'`);
            
            console.log('✓ Migration validation completed');
            
        } finally {
            client.release();
        }
    }

    async createMigrationSummary() {
        console.log('📊 Creating migration summary...');
        
        const client = await this.pgPool.connect();
        
        try {
            const summary = {
                timestamp: new Date().toISOString(),
                tables: {}
            };
            
            const tableQueries = {
                court_filings: 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_processed = false) as unprocessed FROM court_filings',
                property_analytics: 'SELECT COUNT(*) as total, AVG(opportunity_score) as avg_opportunity_score FROM property_analytics',
                estate_sales: 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_processed = false) as unprocessed FROM estate_sales',
                development_applications: 'SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_processed = false) as unprocessed FROM development_applications'
            };
            
            for (const [table, query] of Object.entries(tableQueries)) {
                const result = await client.query(query);
                summary.tables[table] = result.rows[0];
            }
            
            console.log('\n📈 Migration Summary:');
            console.log(JSON.stringify(summary, null, 2));
            
            // Insert summary into system_config
            await client.query(`
                INSERT INTO system_config (key, value, description)
                VALUES ('migration_summary', $1, 'SQLite to PostgreSQL migration summary')
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(summary)]);
            
        } finally {
            client.release();
        }
    }

    async close() {
        await this.sqliteDB.close();
        await this.pgPool.end();
        console.log('✓ Database connections closed');
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];
    const migrator = new DatabaseMigrator();
    
    try {
        await migrator.initialize();
        
        switch (command) {
            case 'schema':
                await migrator.createPostgresSchema();
                break;
                
            case 'migrate':
                await migrator.createPostgresSchema();
                await migrator.migrateData();
                await migrator.validateMigration();
                await migrator.createMigrationSummary();
                break;
                
            case 'validate':
                await migrator.validateMigration();
                break;
                
            case 'summary':
                await migrator.createMigrationSummary();
                break;
                
            default:
                console.log('Usage: node migrate.js [schema|migrate|validate|summary]');
                console.log('');
                console.log('Commands:');
                console.log('  schema   - Create PostgreSQL schema only');
                console.log('  migrate  - Full migration (schema + data + validation)');
                console.log('  validate - Validate existing migration');
                console.log('  summary  - Generate migration summary');
                process.exit(1);
        }
        
        console.log('🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
        process.exit(1);
    } finally {
        await migrator.close();
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { DatabaseMigrator };
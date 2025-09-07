-- AgentRadar Production Database Schema
-- PostgreSQL implementation with enhanced features

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(255),
    phone VARCHAR(50),
    is_verified BOOLEAN DEFAULT FALSE,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert types enum
CREATE TYPE alert_type AS ENUM ('POWER_OF_SALE', 'FORECLOSURE', 'ESTATE_SALE', 'TAX_SALE');
CREATE TYPE alert_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'PAUSED', 'RESOLVED');

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type alert_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    postal_code VARCHAR(10),
    location GEOGRAPHY(POINT, 4326), -- PostGIS for spatial queries
    price DECIMAL(12,2),
    estimated_value DECIMAL(12,2),
    priority alert_priority NOT NULL DEFAULT 'MEDIUM',
    status alert_status NOT NULL DEFAULT 'ACTIVE',
    source_url TEXT,
    case_number VARCHAR(100),
    sale_date DATE,
    description TEXT,
    metadata JSONB, -- Additional structured data
    search_vector TSVECTOR, -- Full-text search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Alert preferences table
CREATE TABLE alert_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cities TEXT[] DEFAULT '{}',
    property_types TEXT[] DEFAULT '{}',
    min_price DECIMAL(12,2),
    max_price DECIMAL(12,2),
    alert_types alert_type[] DEFAULT '{POWER_OF_SALE,FORECLOSURE,ESTATE_SALE,TAX_SALE}',
    priorities alert_priority[] DEFAULT '{MEDIUM,HIGH,URGENT}',
    max_distance_km INTEGER DEFAULT 25,
    notification_methods TEXT[] DEFAULT '{email}',
    email_frequency VARCHAR(20) DEFAULT 'daily',
    is_active BOOLEAN DEFAULT TRUE,
    location_preferences GEOGRAPHY(POINT, 4326)[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Saved properties table
CREATE TABLE saved_properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    postal_code VARCHAR(10),
    location GEOGRAPHY(POINT, 4326),
    property_type VARCHAR(50),
    price DECIMAL(12,2),
    estimated_value DECIMAL(12,2),
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    square_feet INTEGER,
    lot_size VARCHAR(50),
    year_built INTEGER,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    images TEXT[] DEFAULT '{}',
    source_url TEXT,
    mls_number VARCHAR(50),
    roi_calculation JSONB,
    market_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Property analytics table
CREATE TABLE property_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES saved_properties(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    analysis_date DATE NOT NULL,
    market_value DECIMAL(12,2),
    estimated_rent DECIMAL(10,2),
    cap_rate DECIMAL(5,2),
    cash_flow DECIMAL(10,2),
    roi_percentage DECIMAL(5,2),
    comparable_sales JSONB,
    market_trends JSONB,
    risk_factors JSONB,
    opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
    confidence_level VARCHAR(20) DEFAULT 'medium',
    data_sources TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_property_analysis UNIQUE (property_id, analysis_date),
    CONSTRAINT unique_alert_analysis UNIQUE (alert_id, analysis_date)
);

-- Court filings table (for scraped data)
CREATE TABLE court_filings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type alert_type NOT NULL,
    case_number VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    postal_code VARCHAR(10),
    location GEOGRAPHY(POINT, 4326),
    filing_date DATE,
    sale_date DATE,
    sale_time TIME,
    upset_price DECIMAL(12,2),
    estimated_value DECIMAL(12,2),
    court VARCHAR(100),
    lawyer_firm TEXT,
    lawyer_contact TEXT,
    description TEXT,
    source_url TEXT,
    document_urls TEXT[] DEFAULT '{}',
    scrape_source VARCHAR(100),
    scrape_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    duplicate_of UUID REFERENCES court_filings(id),
    metadata JSONB,
    search_vector TSVECTOR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Estate sales table
CREATE TABLE estate_sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    postal_code VARCHAR(10),
    location GEOGRAPHY(POINT, 4326),
    sale_date DATE,
    property_type VARCHAR(50),
    estimated_value DECIMAL(12,2),
    estate_details JSONB,
    contact_info JSONB,
    source_url TEXT,
    scrape_source VARCHAR(100),
    scrape_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Development applications table
CREATE TABLE development_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_number VARCHAR(100),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    province VARCHAR(10) NOT NULL,
    location GEOGRAPHY(POINT, 4326),
    application_type VARCHAR(100),
    description TEXT,
    applicant VARCHAR(255),
    status VARCHAR(50),
    submission_date DATE,
    decision_date DATE,
    municipality VARCHAR(100),
    ward VARCHAR(50),
    zoning_info JSONB,
    documents TEXT[] DEFAULT '{}',
    source_url TEXT,
    scrape_source VARCHAR(100),
    scrape_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User activity log
CREATE TABLE user_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    description TEXT,
    metadata JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notification queue
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'email', 'push', 'sms'
    priority INTEGER DEFAULT 5,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    template VARCHAR(100),
    template_data JSONB,
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    transaction_id BIGINT DEFAULT txid_current()
);

-- Create indexes for performance
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_type ON alerts(type);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_created_at ON alerts(created_at);
CREATE INDEX idx_alerts_location ON alerts USING GIST(location);
CREATE INDEX idx_alerts_search ON alerts USING GIN(search_vector);
CREATE INDEX idx_alerts_city_province ON alerts(city, province);

CREATE INDEX idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX idx_saved_properties_is_favorite ON saved_properties(is_favorite);
CREATE INDEX idx_saved_properties_location ON saved_properties USING GIST(location);
CREATE INDEX idx_saved_properties_city_province ON saved_properties(city, province);
CREATE INDEX idx_saved_properties_tags ON saved_properties USING GIN(tags);

CREATE INDEX idx_court_filings_type ON court_filings(type);
CREATE INDEX idx_court_filings_filing_date ON court_filings(filing_date);
CREATE INDEX idx_court_filings_location ON court_filings USING GIST(location);
CREATE INDEX idx_court_filings_search ON court_filings USING GIN(search_vector);
CREATE INDEX idx_court_filings_is_processed ON court_filings(is_processed);
CREATE INDEX idx_court_filings_city_province ON court_filings(city, province);

CREATE INDEX idx_property_analytics_analysis_date ON property_analytics(analysis_date);
CREATE INDEX idx_property_analytics_opportunity_score ON property_analytics(opportunity_score);
CREATE INDEX idx_property_analytics_roi_percentage ON property_analytics(roi_percentage);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);

CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);

CREATE INDEX idx_estate_sales_sale_date ON estate_sales(sale_date);
CREATE INDEX idx_estate_sales_location ON estate_sales USING GIST(location);
CREATE INDEX idx_estate_sales_is_processed ON estate_sales(is_processed);

CREATE INDEX idx_development_applications_submission_date ON development_applications(submission_date);
CREATE INDEX idx_development_applications_location ON development_applications USING GIST(location);
CREATE INDEX idx_development_applications_status ON development_applications(status);

-- Full-text search indexes
CREATE INDEX idx_alerts_gin_search ON alerts USING GIN(to_tsvector('english', title || ' ' || address || ' ' || description));
CREATE INDEX idx_court_filings_gin_search ON court_filings USING GIN(to_tsvector('english', address || ' ' || coalesce(description, '')));

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alert_preferences_updated_at BEFORE UPDATE ON alert_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_properties_updated_at BEFORE UPDATE ON saved_properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_property_analytics_updated_at BEFORE UPDATE ON property_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_court_filings_updated_at BEFORE UPDATE ON court_filings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estate_sales_updated_at BEFORE UPDATE ON estate_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_development_applications_updated_at BEFORE UPDATE ON development_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notification_queue_updated_at BEFORE UPDATE ON notification_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector update triggers
CREATE OR REPLACE FUNCTION update_alerts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.title, '') || ' ' ||
        coalesce(NEW.address, '') || ' ' ||
        coalesce(NEW.city, '') || ' ' ||
        coalesce(NEW.description, '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_court_filings_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        coalesce(NEW.address, '') || ' ' ||
        coalesce(NEW.city, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.case_number, '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER alerts_search_vector_update BEFORE INSERT OR UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_alerts_search_vector();
CREATE TRIGGER court_filings_search_vector_update BEFORE INSERT OR UPDATE ON court_filings FOR EACH ROW EXECUTE FUNCTION update_court_filings_search_vector();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, operation, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, operation, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to key tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_alerts AFTER INSERT OR UPDATE OR DELETE ON alerts FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_saved_properties AFTER INSERT OR UPDATE OR DELETE ON saved_properties FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Views for common queries
CREATE VIEW active_alerts AS
SELECT 
    a.*,
    u.email as user_email,
    u.first_name,
    u.last_name
FROM alerts a
JOIN users u ON a.user_id = u.id
WHERE a.status = 'ACTIVE';

CREATE VIEW high_opportunity_properties AS
SELECT 
    pa.*,
    sp.address,
    sp.city,
    sp.province,
    sp.is_favorite
FROM property_analytics pa
LEFT JOIN saved_properties sp ON pa.property_id = sp.id
WHERE pa.opportunity_score >= 80
ORDER BY pa.opportunity_score DESC, pa.created_at DESC;

CREATE VIEW recent_court_filings AS
SELECT *
FROM court_filings
WHERE filing_date >= CURRENT_DATE - INTERVAL '30 days'
AND is_processed = false
ORDER BY filing_date DESC, created_at DESC;

-- Insert default system configuration
INSERT INTO system_config (key, value, description) VALUES
('mail_settings', '{"smtp_host": "smtp.mailgun.org", "smtp_port": 587, "from_email": "noreply@agentradar.app"}', 'Email configuration'),
('scraper_settings', '{"max_concurrent": 5, "delay_ms": 1000, "retry_attempts": 3}', 'Web scraper configuration'),
('geocoding_settings', '{"provider": "google", "cache_duration": "7 days"}', 'Geocoding service configuration'),
('analytics_settings', '{"default_radius_km": 25, "comparable_sales_count": 10}', 'Property analytics configuration'),
('notification_settings', '{"batch_size": 100, "rate_limit_per_minute": 60}', 'Notification system configuration');

COMMIT;
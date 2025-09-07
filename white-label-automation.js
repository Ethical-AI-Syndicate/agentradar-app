#!/usr/bin/env node

/**
 * White-Label Deployment Automation for AgentRadar
 * Handles complete white-label instance creation and management
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;
const crypto = require('crypto');

// Configuration
const WHITE_LABEL_CONFIG = {
  baseDir: './white-label',
  instancesDir: './white-label/instances',
  templatesDir: './white-label/templates',
  configFile: './white-label/config.json',
  defaultPlan: 'enterprise'
};

/**
 * White-Label Instance Manager
 */
class WhiteLabelManager {
  constructor() {
    this.config = {};
    this.loadConfig();
  }

  async loadConfig() {
    try {
      const configData = await fs.readFile(WHITE_LABEL_CONFIG.configFile, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      this.config = { instances: {} };
    }
  }

  async saveConfig() {
    await fs.writeFile(
      WHITE_LABEL_CONFIG.configFile,
      JSON.stringify(this.config, null, 2)
    );
  }

  /**
   * Initialize new white-label instance
   */
  async initializeInstance(brokerageId, options = {}) {
    console.log(`🏢 Initializing white-label instance for ${brokerageId}...`);

    const instanceConfig = {
      id: brokerageId,
      name: options.name || brokerageId,
      created: new Date().toISOString(),
      status: 'initializing',
      plan: options.plan || WHITE_LABEL_CONFIG.defaultPlan,
      domain: options.domain || `${brokerageId}.agentradar.app`,
      database: {
        name: `agentradar_${brokerageId.replace(/-/g, '_')}`,
        host: process.env.DB_HOST || 'localhost',
        isolated: true
      },
      features: {
        maxAgents: options.maxAgents || 'unlimited',
        customBranding: true,
        apiAccess: true,
        whiteLabel: true,
        customDomain: true,
        sso: options.sso || false,
        advancedAnalytics: true
      },
      branding: {
        primaryColor: options.primaryColor || '#2563EB',
        secondaryColor: options.secondaryColor || '#10B981',
        logo: null,
        favicon: null,
        emailTemplate: 'default'
      },
      billing: {
        plan: options.plan || 'enterprise',
        price: options.price || 997,
        currency: 'CAD',
        billingCycle: 'monthly',
        stripeCustomerId: null,
        subscriptionId: null
      },
      deployment: {
        web: {
          url: null,
          status: 'pending'
        },
        mobile: {
          ios: { status: 'pending', appId: null },
          android: { status: 'pending', appId: null }
        },
        desktop: {
          windows: { status: 'pending' },
          mac: { status: 'pending' }
        }
      },
      stats: {
        agents: 0,
        activeAgents: 0,
        properties: 0,
        alerts: 0
      }
    };

    // Save instance configuration
    this.config.instances[brokerageId] = instanceConfig;
    await this.saveConfig();

    // Create instance directory structure
    await this.createInstanceStructure(brokerageId);

    // Setup database
    await this.setupDatabase(brokerageId);

    // Generate initial configuration files
    await this.generateConfigFiles(brokerageId, instanceConfig);

    console.log(`✅ White-label instance ${brokerageId} initialized successfully!`);
    return instanceConfig;
  }

  /**
   * Create directory structure for instance
   */
  async createInstanceStructure(brokerageId) {
    const dirs = [
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`,
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/config`,
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/assets`,
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/builds`,
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/backups`,
      `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/logs`
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Setup isolated database for instance
   */
  async setupDatabase(brokerageId) {
    const dbName = `agentradar_${brokerageId.replace(/-/g, '_')}`;
    
    console.log(`📊 Creating database ${dbName}...`);
    
    // Create database
    await exec(`psql -U postgres -c "CREATE DATABASE ${dbName};"`);
    
    // Run migrations
    await exec(`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${dbName} npx prisma migrate deploy`);
    
    // Seed with initial data
    await exec(`DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${dbName} npx prisma db seed`);
    
    console.log(`✅ Database ${dbName} created and configured`);
  }

  /**
   * Generate configuration files for instance
   */
  async generateConfigFiles(brokerageId, config) {
    const instanceDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`;

    // Environment variables
    const envContent = `
# White-Label Instance: ${brokerageId}
NODE_ENV=production
APP_NAME="${config.name}"
APP_URL=https://${config.domain}
API_URL=https://api.${config.domain}
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/${config.database.name}
REDIS_URL=redis://localhost:6379/${brokerageId}

# Branding
PRIMARY_COLOR=${config.branding.primaryColor}
SECONDARY_COLOR=${config.branding.secondaryColor}
LOGO_URL=${config.branding.logo || ''}

# Features
MAX_AGENTS=${config.features.maxAgents}
ENABLE_SSO=${config.features.sso}
ENABLE_API=${config.features.apiAccess}

# Billing
STRIPE_CUSTOMER_ID=${config.billing.stripeCustomerId || ''}
SUBSCRIPTION_ID=${config.billing.subscriptionId || ''}
PLAN=${config.billing.plan}
`;

    await fs.writeFile(`${instanceDir}/config/.env`, envContent);

    // Nginx configuration
    const nginxConfig = `
server {
    listen 80;
    listen [::]:80;
    server_name ${config.domain};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${config.domain};

    ssl_certificate /etc/letsencrypt/live/${config.domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${config.domain}/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

    await fs.writeFile(`${instanceDir}/config/nginx.conf`, nginxConfig);

    // Docker Compose for instance
    const dockerCompose = `
version: '3.8'

services:
  web-${brokerageId}:
    image: agentradar/web:latest
    environment:
      - INSTANCE_ID=${brokerageId}
    env_file:
      - ./config/.env
    ports:
      - "3${this.getPortSuffix(brokerageId)}:3000"
    restart: unless-stopped

  api-${brokerageId}:
    image: agentradar/api:latest
    environment:
      - INSTANCE_ID=${brokerageId}
    env_file:
      - ./config/.env
    ports:
      - "4${this.getPortSuffix(brokerageId)}:4000"
    restart: unless-stopped

  scrapers-${brokerageId}:
    image: agentradar/scrapers:latest
    environment:
      - INSTANCE_ID=${brokerageId}
    env_file:
      - ./config/.env
    restart: unless-stopped
`;

    await fs.writeFile(`${instanceDir}/docker-compose.yml`, dockerCompose);
  }

  /**
   * Deploy white-label instance
   */
  async deployInstance(brokerageId, environment = 'production') {
    console.log(`🚀 Deploying ${brokerageId} to ${environment}...`);

    const instance = this.config.instances[brokerageId];
    if (!instance) {
      throw new Error(`Instance ${brokerageId} not found`);
    }

    const instanceDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`;

    // Build custom images
    await this.buildCustomImages(brokerageId, instance);

    // Deploy with Docker Compose
    await exec(`cd ${instanceDir} && docker-compose up -d`);

    // Setup SSL
    await this.setupSSL(instance.domain);

    // Update deployment status
    instance.deployment.web.status = 'deployed';
    instance.deployment.web.url = `https://${instance.domain}`;
    instance.status = 'active';
    await this.saveConfig();

    console.log(`✅ Instance ${brokerageId} deployed successfully!`);
    console.log(`🌐 Access at: https://${instance.domain}`);
  }

  /**
   * Build customized Docker images for instance
   */
  async buildCustomImages(brokerageId, config) {
    console.log(`🔨 Building custom images for ${brokerageId}...`);

    // Build web app with custom branding
    const buildScript = `
#!/bin/bash
cd web-app
cp ${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/assets/logo.png public/logo.png
echo "NEXT_PUBLIC_INSTANCE_ID=${brokerageId}" >> .env.production
echo "NEXT_PUBLIC_PRIMARY_COLOR=${config.branding.primaryColor}" >> .env.production
echo "NEXT_PUBLIC_APP_NAME='${config.name}'" >> .env.production
npm run build
docker build -t agentradar/web:${brokerageId} .
`;

    await fs.writeFile('/tmp/build-web.sh', buildScript);
    await exec('chmod +x /tmp/build-web.sh && /tmp/build-web.sh');
  }

  /**
   * Setup SSL certificate for custom domain
   */
  async setupSSL(domain) {
    console.log(`🔒 Setting up SSL for ${domain}...`);
    
    // Use Certbot to get Let's Encrypt certificate
    await exec(`certbot certonly --standalone -d ${domain} -d api.${domain} --non-interactive --agree-tos --email admin@agentradar.app`);
    
    console.log(`✅ SSL certificate configured for ${domain}`);
  }

  /**
   * Configure custom branding
   */
  async configureBranding(brokerageId, brandingOptions) {
    console.log(`🎨 Configuring branding for ${brokerageId}...`);

    const instance = this.config.instances[brokerageId];
    if (!instance) {
      throw new Error(`Instance ${brokerageId} not found`);
    }

    // Update branding configuration
    instance.branding = {
      ...instance.branding,
      ...brandingOptions
    };

    // Process logo
    if (brandingOptions.logoFile) {
      await this.processLogo(brokerageId, brandingOptions.logoFile);
    }

    // Generate theme files
    await this.generateThemeFiles(brokerageId, instance.branding);

    await this.saveConfig();
    console.log(`✅ Branding configured for ${brokerageId}`);
  }

  /**
   * Process and optimize logo
   */
  async processLogo(brokerageId, logoFile) {
    const instanceDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`;
    
    // Copy and optimize logo
    await exec(`cp ${logoFile} ${instanceDir}/assets/logo-original.png`);
    
    // Generate different sizes
    await exec(`convert ${instanceDir}/assets/logo-original.png -resize 200x50 ${instanceDir}/assets/logo.png`);
    await exec(`convert ${instanceDir}/assets/logo-original.png -resize 32x32 ${instanceDir}/assets/favicon.png`);
    await exec(`convert ${instanceDir}/assets/logo-original.png -resize 512x512 ${instanceDir}/assets/logo-large.png`);
  }

  /**
   * Generate theme files with custom colors
   */
  async generateThemeFiles(brokerageId, branding) {
    const instanceDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`;
    
    const themeCSS = `
:root {
  --primary-color: ${branding.primaryColor};
  --secondary-color: ${branding.secondaryColor};
  --primary-rgb: ${this.hexToRgb(branding.primaryColor)};
  --secondary-rgb: ${this.hexToRgb(branding.secondaryColor)};
}

.btn-primary {
  background-color: var(--primary-color);
}

.text-primary {
  color: var(--primary-color);
}

.bg-primary {
  background-color: var(--primary-color);
}
`;

    await fs.writeFile(`${instanceDir}/assets/theme.css`, themeCSS);
  }

  /**
   * Helper: Convert hex to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 0, 0';
  }

  /**
   * Helper: Get port suffix from brokerage ID
   */
  getPortSuffix(brokerageId) {
    return crypto.createHash('md5').update(brokerageId).digest('hex').substr(0, 3);
  }

  /**
   * List all white-label instances
   */
  async listInstances() {
    return Object.values(this.config.instances);
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(brokerageId) {
    const instance = this.config.instances[brokerageId];
    if (!instance) {
      throw new Error(`Instance ${brokerageId} not found`);
    }

    // Check actual deployment status
    try {
      const result = await exec(`docker ps --filter "name=${brokerageId}" --format "{{.Status}}"`);
      instance.deployment.status = result.stdout.includes('Up') ? 'running' : 'stopped';
    } catch (error) {
      instance.deployment.status = 'error';
    }

    return instance;
  }

  /**
   * Update white-label instance
   */
  async updateInstance(brokerageId, updateOptions = {}) {
    console.log(`🔄 Updating instance ${brokerageId}...`);

    const instanceDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}`;

    // Backup current state
    await this.backupInstance(brokerageId);

    // Pull latest images
    await exec('docker pull agentradar/web:latest');
    await exec('docker pull agentradar/api:latest');

    // Rebuild with custom branding
    await this.buildCustomImages(brokerageId, this.config.instances[brokerageId]);

    // Restart services
    await exec(`cd ${instanceDir} && docker-compose down && docker-compose up -d`);

    console.log(`✅ Instance ${brokerageId} updated successfully`);
  }

  /**
   * Backup instance
   */
  async backupInstance(brokerageId) {
    console.log(`💾 Backing up instance ${brokerageId}...`);

    const instance = this.config.instances[brokerageId];
    const backupDir = `${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/backups`;
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const backupName = `backup-${timestamp}`;

    // Backup database
    await exec(`pg_dump -U postgres ${instance.database.name} > ${backupDir}/${backupName}.sql`);

    // Backup configuration
    await exec(`cp -r ${WHITE_LABEL_CONFIG.instancesDir}/${brokerageId}/config ${backupDir}/${backupName}-config`);

    console.log(`✅ Backup created: ${backupName}`);
    return backupName;
  }
}

/**
 * CLI Interface
 */
async function main() {
  const command = process.argv[2];
  const brokerageId = process.argv[3];
  const manager = new WhiteLabelManager();

  try {
    switch (command) {
      case 'init':
        await manager.initializeInstance(brokerageId, {
          name: process.argv[4],
          domain: process.argv[5]
        });
        break;

      case 'deploy':
        await manager.deployInstance(brokerageId);
        break;

      case 'configure-branding':
        await manager.configureBranding(brokerageId, {
          primaryColor: process.argv[4],
          secondaryColor: process.argv[5],
          logoFile: process.argv[6]
        });
        break;

      case 'status':
        const status = await manager.getInstanceStatus(brokerageId);
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'list':
        const instances = await manager.listInstances();
        console.table(instances.map(i => ({
          ID: i.id,
          Name: i.name,
          Domain: i.domain,
          Status: i.status,
          Plan: i.billing.plan
        })));
        break;

      case 'update':
        await manager.updateInstance(brokerageId);
        break;

      case 'backup':
        await manager.backupInstance(brokerageId);
        break;

      default:
        console.log(`
White-Label Manager - Usage:
  node white-label-automation.js init <brokerage-id> <n> <domain>
  node white-label-automation.js deploy <brokerage-id>
  node white-label-automation.js configure-branding <brokerage-id> <primary-color> <secondary-color> <logo-file>
  node white-label-automation.js status <brokerage-id>
  node white-label-automation.js list
  node white-label-automation.js update <brokerage-id>
  node white-label-automation.js backup <brokerage-id>
        `);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = WhiteLabelManager;

// Run if called directly
if (require.main === module) {
  main();
}

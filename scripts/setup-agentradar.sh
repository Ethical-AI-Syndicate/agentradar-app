#!/bin/bash

# ========================================
# AgentRadar Complete Project Setup Script
# ========================================
# Run this script to initialize the entire AgentRadar project structure
# Usage: ./setup-agentradar.sh [--platform all|web|mobile|desktop]

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="agentradar"
DEFAULT_PLATFORM="web"  # Start with web as immediate focus

# Parse command line arguments
PLATFORM=${1:-$DEFAULT_PLATFORM}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    AgentRadar Project Setup - v1.0.0          ${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print colored status messages
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${YELLOW}→${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_status "Node.js $(node -v)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm $(npm -v)"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi
    print_status "Git $(git --version)"
    
    echo ""
}

# Create project structure
create_project_structure() {
    echo -e "${BLUE}Creating project structure...${NC}"
    
    # Root directories
    mkdir -p {web-app,mobile,desktop,api,scrapers,shared,scripts,docs,tests,infrastructure}
    print_status "Created root directories"
    
    # Web app structure
    mkdir -p web-app/{src,public,components,pages,styles,hooks,utils,lib,types}
    print_status "Created web-app structure"
    
    # API structure
    mkdir -p api/{src,controllers,services,models,routes,middleware,utils,config}
    print_status "Created API structure"
    
    # Scrapers structure
    mkdir -p scrapers/{gta,vancouver,nyc,shared,schedulers,parsers}
    print_status "Created scrapers structure"
    
    # Scripts structure
    mkdir -p scripts/{automation,deployment,maintenance,testing,utilities}
    print_status "Created scripts structure"
    
    # Infrastructure structure
    mkdir -p infrastructure/{docker,kubernetes,terraform,nginx}
    print_status "Created infrastructure structure"
    
    echo ""
}

# Initialize Git repository
init_git() {
    echo -e "${BLUE}Initializing Git repository...${NC}"
    
    if [ ! -d .git ]; then
        git init
        print_status "Git repository initialized"
    else
        print_info "Git repository already exists"
    fi
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock
pnpm-lock.yaml

# Production builds
dist/
build/
.next/
out/
*.app
*.exe
*.dmg
*.pkg

# Environment variables
.env
.env.local
.env.production
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Database
*.sqlite
*.sqlite3
prisma/migrations/dev/

# Temporary files
tmp/
temp/
.cache/

# Mobile
*.apk
*.aab
*.ipa
ios/build/
android/build/
android/app/build/
.expo/

# Desktop
desktop/dist/
desktop/release/
EOF
    
    print_status "Created .gitignore"
    echo ""
}

# Setup Web Application
setup_web_app() {
    echo -e "${BLUE}Setting up Web Application...${NC}"
    
    cd web-app
    
    # Initialize Next.js with TypeScript
    print_info "Initializing Next.js application..."
    npx create-next-app@latest . --typescript --tailwind --app --no-git --yes
    
    # Install additional dependencies
    print_info "Installing web dependencies..."
    npm install @prisma/client prisma @supabase/supabase-js \
                @tanstack/react-query axios date-fns \
                react-hook-form zod @hookform/resolvers \
                framer-motion lucide-react \
                mapbox-gl @mapbox/mapbox-gl-geocoder \
                recharts react-hot-toast \
                @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
                @radix-ui/react-tabs @radix-ui/react-tooltip
    
    # Create example environment file
    cat > .env.example << 'EOF'
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/agentradar

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
EOF
    
    print_status "Web application setup complete"
    cd ..
    echo ""
}

# Setup API Server
setup_api() {
    echo -e "${BLUE}Setting up API Server...${NC}"
    
    cd api
    
    # Initialize package.json
    npm init -y
    
    # Install dependencies
    print_info "Installing API dependencies..."
    npm install express cors helmet morgan compression \
                @prisma/client bcryptjs jsonwebtoken \
                dotenv express-validator \
                redis bull socket.io \
                node-cron puppeteer cheerio \
                @sendgrid/mail twilio stripe \
                winston express-rate-limit
    
    # Install dev dependencies
    npm install --save-dev @types/node @types/express \
                typescript ts-node nodemon \
                @types/bcryptjs @types/jsonwebtoken \
                jest @types/jest supertest
    
    # Create TypeScript config
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "commonjs",
    "lib": ["ES2021"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
    
    print_status "API server setup complete"
    cd ..
    echo ""
}

# Setup Database
setup_database() {
    echo -e "${BLUE}Setting up Database...${NC}"
    
    # Initialize Prisma
    npx prisma init
    
    # Create Prisma schema
    cat > prisma/schema.prisma << 'EOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String?
  password          String
  company           String?
  phone             String?
  subscriptionTier  String   @default("free")
  stripeCustomerId  String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  alerts            UserAlert[]
  savedProperties   SavedProperty[]
  preferences       AlertPreference?
}

model Alert {
  id          String   @id @default(cuid())
  type        String
  severity    String
  title       String
  description String?
  address     String
  city        String
  postalCode  String?
  latitude    Float?
  longitude   Float?
  price       Float?
  sourceUrl   String?
  metadata    Json?
  createdAt   DateTime @default(now())
  
  userAlerts  UserAlert[]
  savedProperties SavedProperty[]
}

model UserAlert {
  userId    String
  alertId   String
  viewedAt  DateTime?
  saved     Boolean  @default(false)
  notes     String?
  
  user      User     @relation(fields: [userId], references: [id])
  alert     Alert    @relation(fields: [alertId], references: [id])
  
  @@id([userId, alertId])
}

model SavedProperty {
  id        String   @id @default(cuid())
  userId    String
  alertId   String
  notes     String?
  tags      String[]
  savedAt   DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id])
  alert     Alert    @relation(fields: [alertId], references: [id])
}

model AlertPreference {
  userId        String   @id
  alertTypes    String[]
  regions       String[]
  minPrice      Float?
  maxPrice      Float?
  propertyTypes String[]
  emailFrequency String  @default("daily")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  user          User     @relation(fields: [userId], references: [id])
}
EOF
    
    print_status "Database schema created"
    echo ""
}

# Setup Scrapers
setup_scrapers() {
    echo -e "${BLUE}Setting up Scrapers...${NC}"
    
    cd scrapers
    npm init -y
    
    # Install scraper dependencies
    npm install puppeteer cheerio axios node-cron \
                @prisma/client dotenv winston \
                p-queue p-retry
    
    # Create example scraper
    mkdir -p gta
    cat > gta/power-of-sale.js << 'EOF'
const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

class PowerOfSaleScraper {
  async scrape() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
      // Navigate to court bulletins
      await page.goto('https://www.ontariocourts.ca/scj/');
      
      // Scraping logic here
      console.log('Scraping power of sale notices...');
      
      // Save to database
      // await prisma.alert.create({ ... });
      
    } catch (error) {
      console.error('Scraping error:', error);
    } finally {
      await browser.close();
    }
  }
}

module.exports = PowerOfSaleScraper;
EOF
    
    print_status "Scrapers setup complete"
    cd ..
    echo ""
}

# Create automation scripts
create_automation_scripts() {
    echo -e "${BLUE}Creating automation scripts...${NC}"
    
    # Create feature creation script
    cat > scripts/create-feature.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const featureName = process.argv[2];

if (!featureName) {
  console.error('Please provide a feature name');
  process.exit(1);
}

console.log(`Creating feature: ${featureName}`);

// Create database migration
console.log('1. Creating database migration...');
// exec('npx prisma migrate dev --name add_' + featureName);

// Generate API endpoint
console.log('2. Generating API endpoint...');
// Create controller, service, route files

// Create web components
console.log('3. Creating web components...');
// Create React components

// Generate tests
console.log('4. Generating tests...');
// Create test files

console.log(`Feature ${featureName} created successfully!`);
EOF
    
    chmod +x scripts/create-feature.js
    print_status "Automation scripts created"
    echo ""
}

# Create Docker configuration
create_docker_config() {
    echo -e "${BLUE}Creating Docker configuration...${NC}"
    
    # Create docker-compose.yml
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: agentradar
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  web:
    build: ./web-app
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agentradar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./web-app:/app
      - /app/node_modules

  api:
    build: ./api
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/agentradar
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./api:/app
      - /app/node_modules

volumes:
  postgres_data:
  redis_data:
EOF
    
    print_status "Docker configuration created"
    echo ""
}

# Install root dependencies
install_root_dependencies() {
    echo -e "${BLUE}Installing root dependencies...${NC}"
    
    npm init -y
    
    # Copy the package.scripts.json content to package.json
    npm install --save-dev concurrently cross-env dotenv-cli \
                husky npm-check-updates plop pm2 rimraf wait-on
    
    print_status "Root dependencies installed"
    echo ""
}

# Setup complete message
setup_complete() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}    AgentRadar Setup Complete! 🎉      ${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo ""
    echo "  1. Set up your environment variables:"
    echo "     cp web-app/.env.example web-app/.env.local"
    echo "     cp api/.env.example api/.env"
    echo ""
    echo "  2. Start the database:"
    echo "     docker-compose up -d postgres redis"
    echo ""
    echo "  3. Run database migrations:"
    echo "     npx prisma migrate dev"
    echo ""
    echo "  4. Start development servers:"
    echo "     npm run dev:all"
    echo ""
    echo "  5. Open the application:"
    echo "     Web: http://localhost:3000"
    echo "     API: http://localhost:4000"
    echo ""
    echo -e "${GREEN}Happy coding! 🚀${NC}"
}

# Main execution
main() {
    check_prerequisites
    create_project_structure
    init_git
    install_root_dependencies
    
    case $PLATFORM in
        "all")
            setup_web_app
            setup_api
            setup_database
            setup_scrapers
            ;;
        "web")
            setup_web_app
            setup_api
            setup_database
            ;;
        "mobile")
            print_info "Mobile setup will be implemented in Phase 2"
            ;;
        "desktop")
            print_info "Desktop setup will be implemented in Phase 3"
            ;;
        *)
            print_error "Unknown platform: $PLATFORM"
            exit 1
            ;;
    esac
    
    create_automation_scripts
    create_docker_config
    setup_complete
}

# Run main function
main

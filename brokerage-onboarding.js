#!/usr/bin/env node

/**
 * Brokerage Onboarding Automation for AgentRadar
 * Handles complete brokerage onboarding from signup to go-live
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;
const crypto = require('crypto');
const csv = require('csv-parse/sync');
const nodemailer = require('nodemailer');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Configuration
const ONBOARDING_CONFIG = {
  baseDir: './onboarding',
  brokeragesDir: './onboarding/brokerages',
  templatesDir: './onboarding/templates',
  checklistFile: './onboarding/checklist.json',
  stages: [
    'registration',
    'verification',
    'configuration',
    'agent_import',
    'training',
    'testing',
    'go_live'
  ]
};

/**
 * Brokerage Onboarding Manager
 */
class BrokerageOnboardingManager {
  constructor() {
    this.brokerages = {};
    this.checklist = {};
    this.emailTransporter = this.setupEmailTransporter();
    this.loadData();
  }

  setupEmailTransporter() {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS || process.env.SENDGRID_API_KEY
      }
    });
  }

  async loadData() {
    try {
      const data = await fs.readFile(`${ONBOARDING_CONFIG.baseDir}/brokerages.json`, 'utf8');
      this.brokerages = JSON.parse(data);
    } catch {
      this.brokerages = {};
    }

    try {
      const checklistData = await fs.readFile(ONBOARDING_CONFIG.checklistFile, 'utf8');
      this.checklist = JSON.parse(checklistData);
    } catch {
      this.checklist = this.getDefaultChecklist();
    }
  }

  async saveData() {
    await fs.writeFile(
      `${ONBOARDING_CONFIG.baseDir}/brokerages.json`,
      JSON.stringify(this.brokerages, null, 2)
    );
  }

  /**
   * Get default onboarding checklist
   */
  getDefaultChecklist() {
    return {
      registration: [
        { id: 'account_created', label: 'Account created', required: true },
        { id: 'contact_info', label: 'Contact information collected', required: true },
        { id: 'billing_info', label: 'Billing information provided', required: true },
        { id: 'agreement_signed', label: 'Service agreement signed', required: true }
      ],
      verification: [
        { id: 'identity_verified', label: 'Business identity verified', required: true },
        { id: 'license_verified', label: 'Brokerage license verified', required: true },
        { id: 'insurance_verified', label: 'Insurance coverage verified', required: false },
        { id: 'references_checked', label: 'References checked', required: false }
      ],
      configuration: [
        { id: 'regions_selected', label: 'Service regions selected', required: true },
        { id: 'alert_preferences', label: 'Alert preferences configured', required: true },
        { id: 'branding_uploaded', label: 'Branding assets uploaded', required: true },
        { id: 'domain_configured', label: 'Custom domain configured', required: false }
      ],
      agent_import: [
        { id: 'agent_list_received', label: 'Agent list received', required: true },
        { id: 'agents_imported', label: 'Agents imported to system', required: true },
        { id: 'invitations_sent', label: 'Invitations sent to agents', required: true },
        { id: 'permissions_configured', label: 'Agent permissions configured', required: true }
      ],
      training: [
        { id: 'admin_training', label: 'Admin training completed', required: true },
        { id: 'agent_training', label: 'Agent training scheduled', required: true },
        { id: 'documentation_provided', label: 'Documentation provided', required: true },
        { id: 'support_contact_assigned', label: 'Support contact assigned', required: true }
      ],
      testing: [
        { id: 'test_alerts_sent', label: 'Test alerts verified', required: true },
        { id: 'integrations_tested', label: 'Integrations tested', required: false },
        { id: 'performance_verified', label: 'Performance verified', required: true },
        { id: 'feedback_collected', label: 'Initial feedback collected', required: true }
      ],
      go_live: [
        { id: 'production_deployed', label: 'Production environment deployed', required: true },
        { id: 'billing_activated', label: 'Billing activated', required: true },
        { id: 'launch_announcement', label: 'Launch announcement sent', required: true },
        { id: 'first_week_followup', label: 'First week follow-up scheduled', required: true }
      ]
    };
  }

  /**
   * Start brokerage onboarding
   */
  async onboardBrokerage(brokerageName, contactEmail, options = {}) {
    console.log(`🚀 Starting onboarding for ${brokerageName}...`);

    const brokerageId = this.generateBrokerageId(brokerageName);
    
    const brokerage = {
      id: brokerageId,
      name: brokerageName,
      contactEmail: contactEmail,
      phone: options.phone || '',
      website: options.website || '',
      address: options.address || {},
      created: new Date().toISOString(),
      status: 'onboarding',
      stage: 'registration',
      stageProgress: {},
      checklistProgress: {},
      configuration: {
        regions: options.regions || ['gta'],
        maxAgents: options.maxAgents || 50,
        plan: options.plan || 'professional',
        customDomain: options.customDomain || null,
        integrations: {
          crm: null,
          mls: null,
          email: null,
          calendar: null
        }
      },
      agents: [],
      billing: {
        stripeCustomerId: null,
        subscriptionId: null,
        plan: options.plan || 'professional',
        price: this.getPlanPrice(options.plan || 'professional'),
        status: 'pending'
      },
      training: {
        adminTraining: null,
        agentTraining: null,
        materials: []
      },
      support: {
        ticketIds: [],
        primaryContact: null,
        slackChannel: null
      },
      metrics: {
        agentsInvited: 0,
        agentsActivated: 0,
        alertsConfigured: 0,
        lastActivity: new Date().toISOString()
      }
    };

    // Initialize checklist progress
    for (const stage of ONBOARDING_CONFIG.stages) {
      brokerage.checklistProgress[stage] = {};
      for (const item of this.checklist[stage]) {
        brokerage.checklistProgress[stage][item.id] = false;
      }
    }

    // Save brokerage data
    this.brokerages[brokerageId] = brokerage;
    await this.saveData();

    // Create brokerage directory
    await this.createBrokerageDirectory(brokerageId);

    // Send welcome email
    await this.sendWelcomeEmail(brokerage);

    // Create Stripe customer
    await this.createStripeCustomer(brokerage);

    // Generate onboarding documents
    await this.generateOnboardingDocuments(brokerage);

    console.log(`✅ Onboarding started for ${brokerageName}`);
    console.log(`📧 Welcome email sent to ${contactEmail}`);
    console.log(`🔗 Onboarding link: https://agentradar.app/onboarding/${brokerageId}`);

    return brokerage;
  }

  /**
   * Generate unique brokerage ID
   */
  generateBrokerageId(brokerageName) {
    const slug = brokerageName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const hash = crypto.createHash('md5').update(brokerageName).digest('hex').substr(0, 6);
    return `${slug}-${hash}`;
  }

  /**
   * Get plan pricing
   */
  getPlanPrice(plan) {
    const prices = {
      starter: 297,
      professional: 997,
      enterprise: 2997
    };
    return prices[plan] || 997;
  }

  /**
   * Create brokerage directory structure
   */
  async createBrokerageDirectory(brokerageId) {
    const dirs = [
      `${ONBOARDING_CONFIG.brokeragesDir}/${brokerageId}`,
      `${ONBOARDING_CONFIG.brokeragesDir}/${brokerageId}/documents`,
      `${ONBOARDING_CONFIG.brokeragesDir}/${brokerageId}/agents`,
      `${ONBOARDING_CONFIG.brokeragesDir}/${brokerageId}/training`,
      `${ONBOARDING_CONFIG.brokeragesDir}/${brokerageId}/config`
    ];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(brokerage) {
    const emailHtml = `
    <h1>Welcome to AgentRadar, ${brokerage.name}!</h1>
    
    <p>We're excited to help you and your agents get ahead of the market with our real estate intelligence platform.</p>
    
    <h2>Your Onboarding Journey</h2>
    <ol>
      <li><strong>Account Setup</strong> - Complete your profile and billing information</li>
      <li><strong>Configuration</strong> - Choose your service regions and preferences</li>
      <li><strong>Agent Import</strong> - Add your agents to the platform</li>
      <li><strong>Training</strong> - Schedule training sessions for your team</li>
      <li><strong>Testing</strong> - Verify everything is working perfectly</li>
      <li><strong>Go Live</strong> - Launch AgentRadar for your brokerage!</li>
    </ol>
    
    <p><a href="https://agentradar.app/onboarding/${brokerage.id}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Start Onboarding</a></p>
    
    <p>Your dedicated onboarding specialist will contact you within 24 hours to guide you through the process.</p>
    
    <p>If you have any questions, please don't hesitate to reach out to us at support@agentradar.app</p>
    
    <p>Best regards,<br>The AgentRadar Team</p>
    `;

    await this.emailTransporter.sendMail({
      from: 'onboarding@agentradar.app',
      to: brokerage.contactEmail,
      subject: `Welcome to AgentRadar - ${brokerage.name}`,
      html: emailHtml
    });
  }

  /**
   * Create Stripe customer
   */
  async createStripeCustomer(brokerage) {
    try {
      const customer = await stripe.customers.create({
        email: brokerage.contactEmail,
        name: brokerage.name,
        metadata: {
          brokerageId: brokerage.id,
          plan: brokerage.billing.plan
        }
      });

      brokerage.billing.stripeCustomerId = customer.id;
      await this.saveData();

      console.log(`💳 Stripe customer created: ${customer.id}`);
    } catch (error) {
      console.error(`Failed to create Stripe customer: ${error.message}`);
    }
  }

  /**
   * Generate onboarding documents
   */
  async generateOnboardingDocuments(brokerage) {
    const docsDir = `${ONBOARDING_CONFIG.brokeragesDir}/${brokerage.id}/documents`;

    // Service Agreement
    const agreement = `
SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()} 
between AgentRadar Inc. ("Provider") and ${brokerage.name} ("Client").

1. SERVICES
Provider agrees to provide real estate intelligence and alert services as described in the 
${brokerage.billing.plan} plan.

2. TERM
This Agreement shall commence on the Go-Live date and continue on a month-to-month basis.

3. FEES
Client agrees to pay ${brokerage.billing.price} CAD per month for the services.

4. AGENTS
The ${brokerage.billing.plan} plan includes up to ${brokerage.configuration.maxAgents} agents.

5. REGIONS
Services will be provided for the following regions: ${brokerage.configuration.regions.join(', ')}

[Full agreement terms continue...]
    `;

    await fs.writeFile(`${docsDir}/service-agreement.txt`, agreement);

    // Onboarding checklist
    const checklistMd = this.generateChecklistMarkdown(brokerage);
    await fs.writeFile(`${docsDir}/onboarding-checklist.md`, checklistMd);
  }

  /**
   * Generate checklist markdown
   */
  generateChecklistMarkdown(brokerage) {
    let markdown = `# Onboarding Checklist for ${brokerage.name}\n\n`;
    
    for (const stage of ONBOARDING_CONFIG.stages) {
      markdown += `## ${stage.replace(/_/g, ' ').toUpperCase()}\n\n`;
      
      for (const item of this.checklist[stage]) {
        const completed = brokerage.checklistProgress[stage][item.id];
        const checkbox = completed ? '[x]' : '[ ]';
        const required = item.required ? ' *(required)*' : '';
        markdown += `- ${checkbox} ${item.label}${required}\n`;
      }
      
      markdown += '\n';
    }
    
    return markdown;
  }

  /**
   * Import agents from CSV
   */
  async importAgents(brokerageId, csvFile) {
    console.log(`👥 Importing agents for ${brokerageId}...`);

    const brokerage = this.brokerages[brokerageId];
    if (!brokerage) {
      throw new Error(`Brokerage ${brokerageId} not found`);
    }

    // Read and parse CSV
    const csvContent = await fs.readFile(csvFile, 'utf8');
    const agents = csv.parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Process each agent
    const importedAgents = [];
    for (const agent of agents) {
      const agentData = {
        id: crypto.randomBytes(8).toString('hex'),
        name: agent.name || `${agent.firstName} ${agent.lastName}`,
        email: agent.email,
        phone: agent.phone || '',
        license: agent.license || '',
        role: agent.role || 'agent',
        team: agent.team || 'default',
        status: 'pending',
        invitedAt: new Date().toISOString(),
        activatedAt: null
      };

      importedAgents.push(agentData);

      // Send invitation email
      await this.sendAgentInvitation(brokerage, agentData);
    }

    // Update brokerage data
    brokerage.agents = [...brokerage.agents, ...importedAgents];
    brokerage.metrics.agentsInvited = brokerage.agents.length;
    brokerage.checklistProgress.agent_import.agents_imported = true;
    brokerage.checklistProgress.agent_import.invitations_sent = true;

    await this.saveData();

    console.log(`✅ Imported ${importedAgents.length} agents`);
    console.log(`📧 Invitations sent to all agents`);

    return importedAgents;
  }

  /**
   * Send agent invitation
   */
  async sendAgentInvitation(brokerage, agent) {
    const inviteLink = `https://agentradar.app/invite/${brokerage.id}/${agent.id}`;
    
    const emailHtml = `
    <h1>You're invited to join AgentRadar!</h1>
    
    <p>Hi ${agent.name},</p>
    
    <p>${brokerage.name} has invited you to join AgentRadar, the real estate intelligence platform that helps you see properties before they hit MLS.</p>
    
    <h2>What you'll get:</h2>
    <ul>
      <li>⚡ Power of sale alerts 30-60 days early</li>
      <li>🏠 Estate sale notifications</li>
      <li>🏗️ Development application updates</li>
      <li>📍 Location-based alerts for your farm areas</li>
      <li>📱 Mobile app for alerts on the go</li>
    </ul>
    
    <p><a href="${inviteLink}" style="background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
    
    <p>This invitation link is unique to you and will expire in 7 days.</p>
    
    <p>Questions? Contact your brokerage administrator or email support@agentradar.app</p>
    
    <p>Best regards,<br>The AgentRadar Team</p>
    `;

    await this.emailTransporter.sendMail({
      from: 'invites@agentradar.app',
      to: agent.email,
      subject: `${brokerage.name} invited you to AgentRadar`,
      html: emailHtml
    });
  }

  /**
   * Configure brokerage regions
   */
  async configureRegions(brokerageId, regions) {
    console.log(`🗺️ Configuring regions for ${brokerageId}...`);

    const brokerage = this.brokerages[brokerageId];
    if (!brokerage) {
      throw new Error(`Brokerage ${brokerageId} not found`);
    }

    brokerage.configuration.regions = regions;
    brokerage.checklistProgress.configuration.regions_selected = true;

    await this.saveData();

    console.log(`✅ Regions configured: ${regions.join(', ')}`);
  }

  /**
   * Schedule training
   */
  async scheduleTraining(brokerageId, trainingType, dateTime, options = {}) {
    console.log(`📚 Scheduling ${trainingType} training for ${brokerageId}...`);

    const brokerage = this.brokerages[brokerageId];
    if (!brokerage) {
      throw new Error(`Brokerage ${brokerageId} not found`);
    }

    const training = {
      type: trainingType,
      dateTime: dateTime,
      duration: options.duration || '60 minutes',
      format: options.format || 'webinar',
      attendees: options.attendees || [],
      materials: options.materials || [],
      zoomLink: null,
      recordingUrl: null,
      completed: false
    };

    if (trainingType === 'admin') {
      brokerage.training.adminTraining = training;
      brokerage.checklistProgress.training.admin_training = true;
    } else if (trainingType === 'agent') {
      brokerage.training.agentTraining = training;
      brokerage.checklistProgress.training.agent_training = true;
    }

    await this.saveData();

    // Send calendar invites
    await this.sendTrainingInvites(brokerage, training);

    console.log(`✅ ${trainingType} training scheduled for ${dateTime}`);
  }

  /**
   * Send training calendar invites
   */
  async sendTrainingInvites(brokerage, training) {
    // Generate calendar event
    const event = {
      summary: `AgentRadar ${training.type} Training - ${brokerage.name}`,
      description: `Training session for ${brokerage.name} on the AgentRadar platform`,
      start: training.dateTime,
      duration: training.duration,
      location: training.zoomLink || 'Online'
    };

    // Send invite emails
    const recipients = training.type === 'admin' ? 
      [brokerage.contactEmail] : 
      brokerage.agents.map(a => a.email);

    for (const email of recipients) {
      await this.emailTransporter.sendMail({
        from: 'training@agentradar.app',
        to: email,
        subject: `Training Scheduled: AgentRadar ${training.type} Training`,
        html: `
          <h2>Training Session Scheduled</h2>
          <p>Your AgentRadar training has been scheduled:</p>
          <ul>
            <li><strong>Date/Time:</strong> ${training.dateTime}</li>
            <li><strong>Duration:</strong> ${training.duration}</li>
            <li><strong>Format:</strong> ${training.format}</li>
          </ul>
          <p>You'll receive a Zoom link 24 hours before the session.</p>
        `,
        icalEvent: {
          method: 'REQUEST',
          content: this.generateICalEvent(event)
        }
      });
    }
  }

  /**
   * Generate iCal event
   */
  generateICalEvent(event) {
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.summary}
DESCRIPTION:${event.description}
DTSTART:${event.start}
DURATION:${event.duration}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Complete stage
   */
  async completeStage(brokerageId, stage) {
    console.log(`✅ Completing ${stage} stage for ${brokerageId}...`);

    const brokerage = this.brokerages[brokerageId];
    if (!brokerage) {
      throw new Error(`Brokerage ${brokerageId} not found`);
    }

    // Check if all required items are complete
    const stageChecklist = this.checklist[stage];
    const incomplete = stageChecklist
      .filter(item => item.required)
      .filter(item => !brokerage.checklistProgress[stage][item.id]);

    if (incomplete.length > 0) {
      console.log(`⚠️ Cannot complete ${stage}. Incomplete items:`);
      incomplete.forEach(item => console.log(`  - ${item.label}`));
      return false;
    }

    // Mark stage as complete
    brokerage.stageProgress[stage] = {
      completed: true,
      completedAt: new Date().toISOString()
    };

    // Move to next stage
    const currentIndex = ONBOARDING_CONFIG.stages.indexOf(stage);
    if (currentIndex < ONBOARDING_CONFIG.stages.length - 1) {
      brokerage.stage = ONBOARDING_CONFIG.stages[currentIndex + 1];
      console.log(`➡️ Moving to ${brokerage.stage} stage`);
    } else {
      brokerage.status = 'active';
      console.log(`🎉 Onboarding complete! Brokerage is now active.`);
      await this.sendGoLiveNotification(brokerage);
    }

    await this.saveData();
    return true;
  }

  /**
   * Send go-live notification
   */
  async sendGoLiveNotification(brokerage) {
    const emailHtml = `
    <h1>🎉 Congratulations! You're Live on AgentRadar!</h1>
    
    <p>Dear ${brokerage.name},</p>
    
    <p>We're thrilled to announce that your AgentRadar platform is now fully operational!</p>
    
    <h2>What's Active:</h2>
    <ul>
      <li>✅ All ${brokerage.agents.length} agents have access</li>
      <li>✅ Alerts are being monitored for ${brokerage.configuration.regions.join(', ')}</li>
      <li>✅ Your custom domain is configured</li>
      <li>✅ Billing is active on the ${brokerage.billing.plan} plan</li>
    </ul>
    
    <h2>Next Steps:</h2>
    <ol>
      <li>Log in at <a href="https://${brokerage.id}.agentradar.app">your custom portal</a></li>
      <li>Review your first week of alerts</li>
      <li>Gather feedback from your agents</li>
      <li>Schedule a check-in call with your success manager</li>
    </ol>
    
    <p>Your dedicated support contact is available at support@agentradar.app</p>
    
    <p>Welcome to the AgentRadar family!</p>
    
    <p>Best regards,<br>The AgentRadar Team</p>
    `;

    await this.emailTransporter.sendMail({
      from: 'success@agentradar.app',
      to: brokerage.contactEmail,
      cc: 'management@agentradar.app',
      subject: `🎉 You're Live! - ${brokerage.name} on AgentRadar`,
      html: emailHtml
    });
  }

  /**
   * Get onboarding status
   */
  getOnboardingStatus(brokerageId) {
    const brokerage = this.brokerages[brokerageId];
    if (!brokerage) {
      throw new Error(`Brokerage ${brokerageId} not found`);
    }

    const totalItems = Object.values(this.checklist).flat().length;
    const completedItems = Object.values(brokerage.checklistProgress)
      .flatMap(stage => Object.values(stage))
      .filter(item => item === true).length;

    const progress = Math.round((completedItems / totalItems) * 100);

    return {
      brokerageId: brokerage.id,
      name: brokerage.name,
      status: brokerage.status,
      currentStage: brokerage.stage,
      progress: `${progress}%`,
      completedItems: completedItems,
      totalItems: totalItems,
      agents: {
        invited: brokerage.metrics.agentsInvited,
        activated: brokerage.metrics.agentsActivated
      },
      timeline: brokerage.stageProgress,
      nextSteps: this.getNextSteps(brokerage)
    };
  }

  /**
   * Get next steps for brokerage
   */
  getNextSteps(brokerage) {
    const currentStage = brokerage.stage;
    const stageChecklist = this.checklist[currentStage] || [];
    
    return stageChecklist
      .filter(item => !brokerage.checklistProgress[currentStage][item.id])
      .map(item => item.label);
  }
}

/**
 * CLI Interface
 */
async function main() {
  const command = process.argv[2];
  const manager = new BrokerageOnboardingManager();

  try {
    switch (command) {
      case 'onboard':
        const brokerageName = process.argv[3];
        const contactEmail = process.argv[4];
        await manager.onboardBrokerage(brokerageName, contactEmail);
        break;

      case 'import-agents':
        const brokerageId = process.argv[3];
        const csvFile = process.argv[4];
        await manager.importAgents(brokerageId, csvFile);
        break;

      case 'configure-regions':
        const brokId = process.argv[3];
        const regions = process.argv.slice(4);
        await manager.configureRegions(brokId, regions);
        break;

      case 'schedule-training':
        const brokIdTraining = process.argv[3];
        const trainingType = process.argv[4];
        const dateTime = process.argv[5];
        await manager.scheduleTraining(brokIdTraining, trainingType, dateTime);
        break;

      case 'complete-stage':
        const brokIdStage = process.argv[3];
        const stage = process.argv[4];
        await manager.completeStage(brokIdStage, stage);
        break;

      case 'status':
        const brokIdStatus = process.argv[3];
        const status = manager.getOnboardingStatus(brokIdStatus);
        console.log(JSON.stringify(status, null, 2));
        break;

      default:
        console.log(`
Brokerage Onboarding - Usage:
  node brokerage-onboarding.js onboard <brokerage-name> <contact-email>
  node brokerage-onboarding.js import-agents <brokerage-id> <csv-file>
  node brokerage-onboarding.js configure-regions <brokerage-id> <region1> <region2> ...
  node brokerage-onboarding.js schedule-training <brokerage-id> <admin|agent> <datetime>
  node brokerage-onboarding.js complete-stage <brokerage-id> <stage>
  node brokerage-onboarding.js status <brokerage-id>

Stages: ${ONBOARDING_CONFIG.stages.join(', ')}
        `);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = BrokerageOnboardingManager;

// Run if called directly
if (require.main === module) {
  main();
}

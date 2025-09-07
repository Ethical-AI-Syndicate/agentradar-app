#!/usr/bin/env node

/**
 * Claude Team Manager - Workflow Automation for AgentRadar
 * Implements team coordination for Claude Code usage across branches
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;
const crypto = require('crypto');
const yaml = require('js-yaml');

// Configuration
const TEAM_CONFIG = {
  claudeDir: '.claude',
  sessionsDir: '.claude/sessions',
  contextsDir: '.claude/contexts',
  insightsDir: '.claude/insights',
  reportsDir: '.claude/reports',
  configFile: '.github/claude-team-config.yml'
};

/**
 * Claude Team Manager Class
 */
class ClaudeTeamManager {
  constructor() {
    this.config = null;
    this.currentSession = null;
    this.teamInsights = [];
    this.loadConfiguration();
  }

  async loadConfiguration() {
    try {
      const configContent = await fs.readFile(TEAM_CONFIG.configFile, 'utf8');
      this.config = yaml.load(configContent);
    } catch (error) {
      console.error('Failed to load team configuration:', error);
      this.config = this.getDefaultConfig();
    }
  }

  /**
   * Start a new Claude session with proper context
   */
  async startSession(developer, branch, ticket) {
    console.log(`
╔══════════════════════════════════════════════════════╗
║           Claude Code Session Manager                 ║
╚══════════════════════════════════════════════════════╝
`);

    // Validate developer permissions
    const role = await this.getDeveloperRole(developer);
    const branchType = branch.split('/')[0];
    
    if (!this.hasPermission(role, branchType)) {
      throw new Error(`❌ ${developer} lacks permission for ${branchType} branches`);
    }

    // Generate session ID
    const sessionId = this.generateSessionId(developer, branch);
    
    // Create session object
    this.currentSession = {
      id: sessionId,
      developer,
      branch,
      ticket,
      role,
      branchType,
      startTime: new Date().toISOString(),
      context: await this.loadBranchContext(branchType, role),
      commands: [],
      files: [],
      insights: [],
      checkpoints: []
    };

    // Setup branch-specific Claude context
    await this.setupBranchContext(branchType, developer);
    
    // Initialize session recording
    await this.initializeSessionRecording();
    
    // Set resource limits based on role
    await this.applyResourceLimits(role);

    console.log(`
✅ Session Started Successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Session ID: ${sessionId}
👤 Developer: ${developer} (${role})
🌿 Branch: ${branch}
🎫 Ticket: ${ticket || 'N/A'}
🛡️ Safety Level: ${this.getSafetyLevel(branchType)}
⏱️ Max Duration: ${this.getMaxDuration(branchType, role)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Start auto-checkpoint timer
    this.startAutoCheckpoint();

    return sessionId;
  }

  /**
   * Get developer role from configuration
   */
  async getDeveloperRole(developer) {
    const email = `${developer}@agentradar.app`;
    
    for (const [role, config] of Object.entries(this.config.team_roles)) {
      if (config.members.includes(email)) {
        return role;
      }
    }
    
    return 'junior_developers'; // Default role
  }

  /**
   * Check if role has permission for branch type
   */
  hasPermission(role, branchType) {
    const permissions = this.config.team_roles[role]?.permissions || [];
    
    const branchPermissions = {
      'main': 'main_branch_access',
      'develop': 'develop_branch_access',
      'feature': 'feature_branch_access',
      'hotfix': 'feature_branch_access',
      'experiment': 'experiment_branch_access'
    };
    
    return permissions.includes(branchPermissions[branchType] || 'feature_branch_access');
  }

  /**
   * Load appropriate Claude context for branch
   */
  async loadBranchContext(branchType, role) {
    const contextRequirements = this.config.claude_context_requirements[branchType] || 
                                this.config.claude_context_requirements['feature/*'];
    
    const context = {
      files: [],
      commands: [],
      restrictions: [],
      safety: this.getSafetyLevel(branchType)
    };

    // Load required files
    for (const file of contextRequirements.required_files || []) {
      try {
        const content = await fs.readFile(path.join(TEAM_CONFIG.claudeDir, 'contexts', file), 'utf8');
        context.files.push({ name: file, content });
      } catch (error) {
        console.warn(`Warning: Required file ${file} not found`);
      }
    }

    // Add role-specific capabilities
    const capabilities = this.config.team_roles[role]?.claude_capabilities || [];
    context.capabilities = capabilities;

    // Add branch-specific restrictions
    if (contextRequirements.forbidden_commands) {
      context.restrictions = contextRequirements.forbidden_commands;
    }

    return context;
  }

  /**
   * Setup branch-specific Claude context
   */
  async setupBranchContext(branchType, developer) {
    const templatePath = this.config.claude_context_requirements[branchType]?.template;
    
    if (templatePath) {
      // Copy template to working directory
      try {
        const template = await fs.readFile(templatePath, 'utf8');
        const customized = this.customizeTemplate(template, {
          developer,
          branch: this.currentSession.branch,
          ticket: this.currentSession.ticket,
          sessionId: this.currentSession.id,
          date: new Date().toISOString()
        });
        
        await fs.writeFile('CLAUDE.md', customized);
        console.log('✅ Branch context loaded: CLAUDE.md');
      } catch (error) {
        console.error('Failed to load context template:', error);
      }
    }
  }

  /**
   * Customize template with session variables
   */
  customizeTemplate(template, vars) {
    let customized = template;
    
    for (const [key, value] of Object.entries(vars)) {
      const placeholder = new RegExp(`\\[${key.toUpperCase()}\\]`, 'g');
      customized = customized.replace(placeholder, value || 'N/A');
    }
    
    return customized;
  }

  /**
   * Get safety level for branch type
   */
  getSafetyLevel(branchType) {
    const safetyLevels = {
      'main': 'maximum',
      'develop': 'high',
      'feature': 'medium',
      'hotfix': 'high',
      'experiment': 'low'
    };
    
    return safetyLevels[branchType] || 'medium';
  }

  /**
   * Get maximum session duration
   */
  getMaxDuration(branchType, role) {
    const durations = this.config.claude_sessions?.by_branch_type[branchType]?.max_duration ||
                     this.config.claude_sessions?.defaults.max_duration ||
                     '8_hours';
    
    return durations.replace('_', ' ');
  }

  /**
   * Apply resource limits based on role
   */
  async applyResourceLimits(role) {
    const limits = this.config.resource_limits?.by_role[role] || {
      daily_sessions: 5,
      concurrent_sessions: 1,
      context_size: '25KB'
    };
    
    // Check current usage
    const usage = await this.getDeveloperUsage(this.currentSession.developer);
    
    if (usage.dailySessions >= limits.daily_sessions) {
      console.warn(`⚠️ Warning: Approaching daily session limit (${usage.dailySessions}/${limits.daily_sessions})`);
    }
    
    if (usage.concurrentSessions >= limits.concurrent_sessions) {
      throw new Error(`❌ Concurrent session limit reached (${limits.concurrent_sessions})`);
    }
    
    this.currentSession.limits = limits;
  }

  /**
   * Get developer usage statistics
   */
  async getDeveloperUsage(developer) {
    const today = new Date().toISOString().split('T')[0];
    const sessionsDir = path.join(TEAM_CONFIG.sessionsDir, today);
    
    try {
      const files = await fs.readdir(sessionsDir);
      const developerSessions = files.filter(f => f.includes(developer));
      
      return {
        dailySessions: developerSessions.length,
        concurrentSessions: 0 // Implement active session tracking
      };
    } catch {
      return { dailySessions: 0, concurrentSessions: 0 };
    }
  }

  /**
   * Initialize session recording
   */
  async initializeSessionRecording() {
    const sessionDir = path.join(
      TEAM_CONFIG.sessionsDir,
      new Date().toISOString().split('T')[0],
      this.currentSession.id
    );
    
    await fs.mkdir(sessionDir, { recursive: true });
    
    // Write initial session metadata
    await fs.writeFile(
      path.join(sessionDir, 'metadata.json'),
      JSON.stringify(this.currentSession, null, 2)
    );
    
    // Start command logging
    this.logFile = path.join(sessionDir, 'commands.log');
    await fs.writeFile(this.logFile, `# Session: ${this.currentSession.id}\n\n`);
  }

  /**
   * Generate unique session ID
   */
  generateSessionId(developer, branch) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const branchSlug = branch.replace(/\//g, '-');
    const hash = crypto.createHash('md5').update(`${developer}${branch}${timestamp}`).digest('hex').substr(0, 6);
    
    return `${timestamp}-${developer}-${branchSlug}-${hash}`;
  }

  /**
   * Start auto-checkpoint timer
   */
  startAutoCheckpoint() {
    const interval = this.config.claude_sessions?.defaults.auto_checkpoint || '30_minutes';
    const minutes = parseInt(interval.split('_')[0]);
    
    this.checkpointTimer = setInterval(() => {
      this.createCheckpoint();
    }, minutes * 60 * 1000);
  }

  /**
   * Create session checkpoint
   */
  async createCheckpoint() {
    if (!this.currentSession) return;
    
    const checkpoint = {
      timestamp: new Date().toISOString(),
      commands: this.currentSession.commands.length,
      files: this.currentSession.files.length,
      insights: this.currentSession.insights.length
    };
    
    this.currentSession.checkpoints.push(checkpoint);
    
    // Save checkpoint to disk
    const checkpointFile = path.join(
      TEAM_CONFIG.sessionsDir,
      new Date().toISOString().split('T')[0],
      this.currentSession.id,
      `checkpoint-${Date.now()}.json`
    );
    
    await fs.writeFile(checkpointFile, JSON.stringify({
      session: this.currentSession,
      checkpoint
    }, null, 2));
    
    console.log(`💾 Checkpoint created: ${checkpoint.timestamp}`);
  }

  /**
   * Log executed command
   */
  async logCommand(command, output) {
    if (!this.currentSession) return;
    
    const entry = {
      command,
      timestamp: new Date().toISOString(),
      output: output ? output.substring(0, 500) : null,
      success: !!output
    };
    
    this.currentSession.commands.push(entry);
    
    // Append to log file
    await fs.appendFile(
      this.logFile,
      `\n[${entry.timestamp}] $ ${command}\n${output ? '> ' + output + '\n' : ''}`
    );
  }

  /**
   * Capture insight from Claude interaction
   */
  async captureInsight(insight) {
    if (!this.currentSession) return;
    
    const insightEntry = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      developer: this.currentSession.developer,
      branch: this.currentSession.branch,
      type: insight.type || 'general',
      title: insight.title,
      description: insight.description,
      code: insight.code || null,
      tags: insight.tags || [],
      reusable: insight.reusable || false
    };
    
    this.currentSession.insights.push(insightEntry);
    this.teamInsights.push(insightEntry);
    
    // Save to insights directory
    const insightFile = path.join(
      TEAM_CONFIG.insightsDir,
      new Date().toISOString().split('T')[0],
      `${insightEntry.id}.json`
    );
    
    await fs.mkdir(path.dirname(insightFile), { recursive: true });
    await fs.writeFile(insightFile, JSON.stringify(insightEntry, null, 2));
    
    console.log(`💡 Insight captured: ${insight.title}`);
    
    // Share with team if reusable
    if (insight.reusable) {
      await this.shareInsight(insightEntry);
    }
  }

  /**
   * Share insight with team
   */
  async shareInsight(insight) {
    // Add to shared insights pool
    const sharedFile = path.join(TEAM_CONFIG.insightsDir, 'shared', 'insights.json');
    
    try {
      const existing = JSON.parse(await fs.readFile(sharedFile, 'utf8'));
      existing.push(insight);
      await fs.writeFile(sharedFile, JSON.stringify(existing, null, 2));
    } catch {
      await fs.mkdir(path.dirname(sharedFile), { recursive: true });
      await fs.writeFile(sharedFile, JSON.stringify([insight], null, 2));
    }
    
    // Notify team via Slack (if configured)
    if (this.config.integrations?.slack?.enabled) {
      await this.notifySlack('insight', insight);
    }
  }

  /**
   * End Claude session
   */
  async endSession() {
    if (!this.currentSession) {
      console.log('No active session to end');
      return;
    }
    
    console.log(`
╔══════════════════════════════════════════════════════╗
║           Claude Session Summary                      ║
╚══════════════════════════════════════════════════════╝
`);
    
    // Stop auto-checkpoint
    if (this.checkpointTimer) {
      clearInterval(this.checkpointTimer);
    }
    
    // Calculate session metrics
    const duration = Date.now() - new Date(this.currentSession.startTime).getTime();
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    
    const summary = {
      sessionId: this.currentSession.id,
      developer: this.currentSession.developer,
      branch: this.currentSession.branch,
      duration: `${hours}h ${minutes}m`,
      commandsExecuted: this.currentSession.commands.length,
      insightsCaptured: this.currentSession.insights.length,
      filesModified: this.currentSession.files.length,
      checkpoints: this.currentSession.checkpoints.length,
      endTime: new Date().toISOString()
    };
    
    console.log(`
📊 Session Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Duration: ${summary.duration}
📝  Commands: ${summary.commandsExecuted}
💡  Insights: ${summary.insightsCaptured}
📁  Files: ${summary.filesModified}
💾  Checkpoints: ${summary.checkpoints}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
    
    // Save final session data
    const sessionDir = path.join(
      TEAM_CONFIG.sessionsDir,
      new Date(this.currentSession.startTime).toISOString().split('T')[0],
      this.currentSession.id
    );
    
    await fs.writeFile(
      path.join(sessionDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
    
    // Generate session report
    await this.generateSessionReport(summary);
    
    // Clean up context files if experiment branch
    if (this.currentSession.branchType === 'experiment') {
      await this.cleanupExperimentContext();
    }
    
    this.currentSession = null;
    console.log('\n✅ Session ended successfully');
  }

  /**
   * Generate session report
   */
  async generateSessionReport(summary) {
    const report = {
      ...summary,
      insights: this.currentSession.insights.filter(i => i.reusable),
      patterns: this.identifyPatterns(),
      recommendations: this.generateRecommendations(),
      efficiencyMetrics: await this.calculateEfficiency()
    };
    
    const reportFile = path.join(
      TEAM_CONFIG.reportsDir,
      `session-${summary.sessionId}.json`
    );
    
    await fs.mkdir(path.dirname(reportFile), { recursive: true });
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  }

  /**
   * Identify patterns from session
   */
  identifyPatterns() {
    const patterns = [];
    
    // Analyze command frequency
    const commandFreq = {};
    for (const cmd of this.currentSession.commands) {
      const baseCmd = cmd.command.split(' ')[0];
      commandFreq[baseCmd] = (commandFreq[baseCmd] || 0) + 1;
    }
    
    // Find most used commands
    const topCommands = Object.entries(commandFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count]) => ({ command: cmd, count }));
    
    if (topCommands.length > 0) {
      patterns.push({
        type: 'command_usage',
        description: 'Most frequently used commands',
        data: topCommands
      });
    }
    
    return patterns;
  }

  /**
   * Generate recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Check session duration
    const duration = Date.now() - new Date(this.currentSession.startTime).getTime();
    const hours = duration / 3600000;
    
    if (hours > 4) {
      recommendations.push({
        type: 'session_length',
        message: 'Consider breaking long sessions into smaller, focused sessions',
        priority: 'medium'
      });
    }
    
    // Check insight capture rate
    const insightRate = this.currentSession.insights.length / Math.max(1, hours);
    if (insightRate < 1) {
      recommendations.push({
        type: 'insight_capture',
        message: 'Try to capture more insights during your Claude sessions',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate efficiency metrics
   */
  async calculateEfficiency() {
    // Estimate time saved
    const estimatedManualTime = this.currentSession.commands.length * 5; // 5 min per command average
    const actualTime = (Date.now() - new Date(this.currentSession.startTime).getTime()) / 60000;
    const timeSaved = Math.max(0, estimatedManualTime - actualTime);
    
    return {
      estimatedTimeSaved: `${Math.round(timeSaved)} minutes`,
      commandsPerHour: Math.round(this.currentSession.commands.length / (actualTime / 60)),
      efficiencyRatio: (estimatedManualTime / Math.max(1, actualTime)).toFixed(2)
    };
  }

  /**
   * Clean up experiment context
   */
  async cleanupExperimentContext() {
    console.log('🧹 Cleaning up experiment branch context...');
    
    // Remove custom CLAUDE.md
    try {
      await fs.unlink('CLAUDE.md');
    } catch (error) {
      // File might not exist
    }
    
    // Archive session data
    const archiveDir = path.join(TEAM_CONFIG.sessionsDir, 'archived', 'experiments');
    await fs.mkdir(archiveDir, { recursive: true });
    
    // Move session files to archive
    const sessionDir = path.join(
      TEAM_CONFIG.sessionsDir,
      new Date(this.currentSession.startTime).toISOString().split('T')[0],
      this.currentSession.id
    );
    
    const archivePath = path.join(archiveDir, this.currentSession.id);
    await fs.rename(sessionDir, archivePath).catch(() => {});
  }

  /**
   * Team sync - consolidate insights
   */
  async teamSync() {
    console.log(`
╔══════════════════════════════════════════════════════╗
║           Daily Team Claude Sync                      ║
╚══════════════════════════════════════════════════════╝
`);
    
    const today = new Date().toISOString().split('T')[0];
    
    // Collect all insights from today
    const insightsDir = path.join(TEAM_CONFIG.insightsDir, today);
    let insights = [];
    
    try {
      const files = await fs.readdir(insightsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(insightsDir, file), 'utf8');
          insights.push(JSON.parse(content));
        }
      }
    } catch (error) {
      console.log('No insights to sync today');
      return;
    }
    
    // Group insights by type
    const grouped = {};
    for (const insight of insights) {
      const type = insight.type || 'general';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(insight);
    }
    
    console.log(`
📊 Today's Insights Summary:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    
    for (const [type, items] of Object.entries(grouped)) {
      console.log(`
${type.toUpperCase()} (${items.length}):
${items.map(i => `  • ${i.title} - by ${i.developer}`).join('\n')}`);
    }
    
    // Update shared command library
    await this.updateCommandLibrary(insights);
    
    // Generate team report
    await this.generateTeamReport(insights);
    
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Team sync complete! 
📚 Command library updated
📊 Team report generated
    `);
  }

  /**
   * Update command library with new discoveries
   */
  async updateCommandLibrary(insights) {
    const commandsFile = path.join(TEAM_CONFIG.claudeDir, 'commands', 'COMMANDS.md');
    const newCommands = [];
    
    for (const insight of insights) {
      if (insight.type === 'command' && insight.reusable) {
        newCommands.push({
          command: insight.title,
          description: insight.description,
          code: insight.code,
          addedBy: insight.developer,
          date: insight.timestamp
        });
      }
    }
    
    if (newCommands.length > 0) {
      // Append to COMMANDS.md
      const additions = newCommands.map(cmd => `
## ${cmd.command}
**Added by:** ${cmd.addedBy}  
**Date:** ${cmd.date}

${cmd.description}

\`\`\`bash
${cmd.code}
\`\`\`
`).join('\n');
      
      await fs.appendFile(commandsFile, `\n## Newly Discovered Commands\n${additions}`);
      
      console.log(`📝 Added ${newCommands.length} new commands to library`);
    }
  }

  /**
   * Generate team report
   */
  async generateTeamReport(insights) {
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalInsights: insights.length,
        developers: [...new Set(insights.map(i => i.developer))].length,
        reusablePatterns: insights.filter(i => i.reusable).length
      },
      topContributors: this.getTopContributors(insights),
      mostValuableInsights: insights
        .filter(i => i.reusable)
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      recommendations: this.generateTeamRecommendations(insights)
    };
    
    const reportFile = path.join(
      TEAM_CONFIG.reportsDir,
      'team',
      `daily-${report.date}.json`
    );
    
    await fs.mkdir(path.dirname(reportFile), { recursive: true });
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  }

  /**
   * Get top contributors
   */
  getTopContributors(insights) {
    const contributors = {};
    
    for (const insight of insights) {
      contributors[insight.developer] = (contributors[insight.developer] || 0) + 1;
    }
    
    return Object.entries(contributors)
      .sort((a, b) => b[1] - a[1])
      .map(([developer, count]) => ({ developer, insights: count }));
  }

  /**
   * Generate team recommendations
   */
  generateTeamRecommendations(insights) {
    const recommendations = [];
    
    // Check knowledge sharing
    const uniqueDevelopers = [...new Set(insights.map(i => i.developer))];
    if (uniqueDevelopers.length < 3) {
      recommendations.push({
        type: 'participation',
        message: 'Encourage more team members to share Claude insights',
        priority: 'medium'
      });
    }
    
    // Check reusability rate
    const reusableRate = insights.filter(i => i.reusable).length / insights.length;
    if (reusableRate < 0.3) {
      recommendations.push({
        type: 'quality',
        message: 'Focus on capturing more reusable patterns and commands',
        priority: 'high'
      });
    }
    
    return recommendations;
  }

  /**
   * Notify Slack channel
   */
  async notifySlack(type, data) {
    // Implement Slack webhook notification
    console.log(`📢 Slack notification: ${type}`);
  }
}

/**
 * CLI Commands
 */
async function main() {
  const command = process.argv[2];
  const manager = new ClaudeTeamManager();
  
  try {
    switch (command) {
      case 'start':
        const developer = process.argv[3];
        const branch = process.argv[4];
        const ticket = process.argv[5];
        await manager.startSession(developer, branch, ticket);
        break;
      
      case 'checkpoint':
        await manager.createCheckpoint();
        break;
      
      case 'insight':
        await manager.captureInsight({
          title: process.argv[3],
          description: process.argv[4],
          reusable: process.argv[5] === 'true'
        });
        break;
      
      case 'end':
        await manager.endSession();
        break;
      
      case 'sync':
        await manager.teamSync();
        break;
      
      default:
        console.log(`
Claude Team Manager - Usage:
  node claude-team-manager.js start <developer> <branch> [ticket]
  node claude-team-manager.js checkpoint
  node claude-team-manager.js insight "<title>" "<description>" [reusable]
  node claude-team-manager.js end
  node claude-team-manager.js sync

Examples:
  node claude-team-manager.js start alice feature/white-label AR-123
  node claude-team-manager.js insight "New scraper pattern" "Discovered efficient way to handle pagination" true
  node claude-team-manager.js sync
        `);
    }
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = ClaudeTeamManager;

// Run if called directly
if (require.main === module) {
  main();
}

# Implementation Guide - Claude Team Workflows for AgentRadar

## 🚀 Complete Setup Guide (30 Minutes)

This guide will walk you through setting up the complete Claude Code team workflow system for your AgentRadar repository.

---

## Prerequisites

- Node.js 18+ installed
- Git repository initialized
- Team member GitHub/GitLab accounts
- Basic npm scripts knowledge

---

## Step 1: Initial Repository Setup (5 minutes)

```bash
# Navigate to your AgentRadar repository
cd agentradar

# Create the Claude directory structure
mkdir -p .claude/{contexts,templates,sessions,insights,reports,commands}
mkdir -p .claude/contexts/{production,development,shared}
mkdir -p .claude/sessions/{active,archived,branches}
mkdir -p .claude/insights/{daily,shared}
mkdir -p .claude/reports/{sessions,team}
mkdir -p scripts

# Copy the provided files to their locations
cp TEAM_WORKFLOWS.md docs/
cp claude-team-manager.js scripts/
cp claude-validation-scripts.js scripts/
cp white-label-automation.js scripts/
cp brokerage-onboarding.js scripts/
```

---

## Step 2: Install Dependencies (2 minutes)

```bash
# Install Husky (modern version)
npm install --save-dev husky

# Install other required dependencies
npm install --save-dev concurrently jest typescript eslint prettier
npm install js-yaml chalk inquirer commander dotenv winston

# Initialize Husky
npx husky init
```

---

## Step 3: Set Up Git Hooks (5 minutes)

```bash
# Run the setup script
chmod +x setup-git-hooks.sh
./setup-git-hooks.sh

# Or manually create hooks:
# The script has already created:
# - .husky/pre-commit (validates Claude context)
# - .husky/commit-msg (adds session IDs)
# - .husky/post-checkout (switches contexts)
# - .husky/pre-push (quality gates)
```

---

## Step 4: Create Context Templates (5 minutes)

### Production Context (.claude/contexts/production/CLAUDE.md)
```markdown
# Production Context - Maximum Safety

## Safety Level: MAXIMUM
- No experimental features
- No schema changes
- Mandatory pair review
- Full test coverage required

## Available Commands
- hotfix:create
- test:production
- deploy:production

## Restrictions
- No direct database modifications
- No API breaking changes
- No dependency updates without approval
```

### Feature Template (.claude/templates/feature-CLAUDE.md)
```markdown
# Feature Development Context

Developer: [DEVELOPER]
Branch: [BRANCH]
Ticket: [TICKET]
Session: [SESSION_ID]
Date: [DATE]

## Objectives
- [ ] Implement feature as specified in ticket
- [ ] Write comprehensive tests (>80% coverage)
- [ ] Update documentation
- [ ] Capture reusable insights

## Available Commands
[Include relevant commands from COMMANDS.md]

## Technical Constraints
- Follow existing architectural patterns
- No breaking changes to APIs
- Performance budget: <3s page load

## Session Notes
[Document discoveries and decisions here]
```

### Hotfix Template (.claude/templates/hotfix-CLAUDE.md)
```markdown
# Hotfix Context - Emergency Fix

## ⚠️ HOTFIX MODE - LIMITED SCOPE
Issue: [ISSUE_DESCRIPTION]
Severity: [CRITICAL/HIGH]
Time Limit: 1 hour

## Scope
- Fix the specific issue ONLY
- No refactoring
- No feature additions
- Minimal changes

## Required Checks
- [ ] Reproduces issue
- [ ] Fix resolves issue
- [ ] No side effects
- [ ] Tests pass
```

---

## Step 5: Configure Team Roles (3 minutes)

Create `.github/CODEOWNERS`:
```
# Senior Developers - Production Access
/main/ @alice @bob
/.claude/contexts/production/ @alice @bob

# Team Leads - Development Context
/develop/ @carol
/.claude/contexts/development/ @carol

# All Developers - Feature Branches
/feature/ @agentradar/developers
/.claude/templates/ @agentradar/developers

# QA Team - Testing Contexts
/test/ @agentradar/qa
/__tests__/ @agentradar/qa
```

---

## Step 6: Update package.json (2 minutes)

Merge the provided `package.json` configuration into your existing file. Key sections to add:

```json
{
  "scripts": {
    "prepare": "husky",
    "claude:start": "node scripts/claude-team-manager.js start",
    "claude:end": "node scripts/claude-team-manager.js end",
    "team:daily": "npm run claude:sync && npm run team:standup"
  },
  "claude": {
    "teamSize": 10,
    "sessionLimits": {
      "maxDuration": 28800
    }
  }
}
```

---

## Step 7: Initialize Team Training (5 minutes)

### Create Team Onboarding Document

Create `docs/CLAUDE_ONBOARDING.md`:
```markdown
# Claude Code Team Onboarding

## For All Developers

### Starting Your First Session
```bash
# 1. Check out your feature branch
git checkout -b feature/AR-123-your-feature

# 2. Start Claude session
npm run claude:start yourname feature/AR-123-your-feature AR-123

# 3. Work with Claude
# ... development ...

# 4. Capture insights when you discover patterns
npm run claude:insight "Pattern name" "Description" true

# 5. End session properly
npm run claude:end
```

### Daily Workflow
1. Morning: Check team insights from yesterday
2. Start session with clear objectives
3. Checkpoint every 30 minutes (automatic)
4. Capture 2-3 insights per day minimum
5. End session with summary

### Branch Guidelines
- **feature/**: Full creative freedom
- **hotfix/**: Emergency fixes only (1 hour limit)
- **experiment/**: Testing ideas (auto-cleaned after 7 days)
```

---

## Step 8: Run Initial Tests (3 minutes)

```bash
# Test the setup
npm run claude:validate

# Test git hooks
git add .
git commit -m "test: Claude team workflow setup"

# You should see:
# - Pre-commit hook validating Claude context
# - Commit message getting session ID added
# - All validation checks running

# Test session management
npm run claude:start yourname test-branch TEST-1
npm run claude:checkpoint
npm run claude:insight "Test insight" "Testing the system" true
npm run claude:end

# Check team sync
npm run team:daily
```

---

## Step 9: Configure CI/CD Integration (5 minutes)

Create `.github/workflows/claude-validation.yml`:
```yaml
name: Claude Code Validation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  validate-claude:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate Claude Context
        run: npm run claude:validate
      
      - name: Check Anti-patterns
        run: npm run claude:anti-patterns
      
      - name: Complexity Analysis
        run: npm run complexity:check
      
      - name: Security Scan
        run: npm run claude:security-check
```

---

## Step 10: Team Launch (Ongoing)

### Week 1: Soft Launch
- Train 2-3 senior developers
- Run in parallel with existing workflow
- Gather feedback daily

### Week 2: Team Rollout
- Train all developers in small groups
- Start daily sync meetings
- Begin insight collection

### Week 3: Full Implementation
- All feature branches use Claude workflow
- Weekly insight consolidation
- Metrics tracking begins

### Month 2: Optimization
- Analyze efficiency metrics
- Refine contexts based on usage
- Expand command library

---

## 🎯 Quick Start Commands for Team

Print this and share with your team:

```bash
# DAILY COMMANDS
npm run claude:start <name> <branch> <ticket>  # Start session
npm run claude:checkpoint                       # Save progress
npm run claude:insight "<title>" "<desc>" true # Capture insight
npm run claude:end                             # End session

# TEAM COLLABORATION
npm run team:daily                             # Morning sync
npm run insights:view --today                  # See team insights
npm run commands:update                        # Update shared commands

# TROUBLESHOOTING
npm run claude:context:reset                   # Fix context issues
npm run claude:validate                        # Check setup
npm run claude:status                          # Session status
```

---

## 📊 Success Metrics to Track

### Week 1
- [ ] All developers completed first session
- [ ] 10+ insights captured
- [ ] Zero security violations

### Week 2
- [ ] 50+ commands executed via Claude
- [ ] 5+ reusable patterns identified
- [ ] 20% time savings measured

### Month 1
- [ ] 100+ insights in knowledge base
- [ ] 30% velocity increase
- [ ] 90% team adoption

---

## 🚨 Common Issues & Solutions

| Issue | Solution | Command |
|-------|----------|---------|
| Husky not working | Reinstall with init | `npx husky init` |
| Context not loading | Reset and reload | `npm run claude:context:reset` |
| Session won't start | Check permissions | Verify branch access in config |
| Insights not saving | Check directory perms | `chmod -R 755 .claude/` |

---

## 📚 Additional Resources

- **Team Workflows Guide**: `docs/TEAM_WORKFLOWS.md`
- **Command Library**: `.claude/commands/COMMANDS.md`
- **Context Templates**: `.claude/templates/`
- **Session Logs**: `.claude/sessions/`
- **Team Insights**: `.claude/insights/shared/`

---

## ✅ Checklist for Go-Live

- [ ] All scripts copied to correct locations
- [ ] Husky hooks installed and tested
- [ ] Context templates created
- [ ] Team roles configured in CODEOWNERS
- [ ] package.json updated
- [ ] Initial test session successful
- [ ] CI/CD pipeline configured
- [ ] Team onboarding document created
- [ ] First team member trained
- [ ] Metrics tracking enabled

---

## 🎉 You're Ready!

Your Claude Code team workflow system is now fully configured. Start with:

```bash
npm run claude:start yourname feature/first-claude-feature AR-001
```

Remember: The goal is to amplify your team's capabilities while maintaining code quality and knowledge sharing. Every insight captured makes the whole team stronger.

---

*Need help? Check `docs/TEAM_WORKFLOWS.md` or run `npm run claude:help`*

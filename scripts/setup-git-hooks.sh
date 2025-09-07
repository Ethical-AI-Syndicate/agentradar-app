#!/bin/bash

# ========================================
# Modern Husky Setup for Claude Team Workflow
# Using Husky v9+ (non-deprecated approach)
# ========================================

set -e

echo "🚀 Setting up Git hooks for Claude Team Workflow..."

# Step 1: Install Husky
echo "📦 Installing Husky..."
npm install --save-dev husky

# Step 2: Initialize Husky (modern approach)
echo "🔧 Initializing Husky..."
npx husky init

# This creates .husky directory and adds the prepare script to package.json
# If prepare script not added automatically, add it manually:
npm pkg set scripts.prepare="husky"

# Step 3: Create pre-commit hook for Claude validation
echo "📝 Creating pre-commit hook..."
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Claude Context Validation Pre-commit Hook
echo "🔍 Validating Claude context..."

# Check if CLAUDE.md exists for feature branches
BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANCH_TYPE=$(echo $BRANCH | cut -d'/' -f1)

if [ "$BRANCH_TYPE" = "feature" ] || [ "$BRANCH_TYPE" = "hotfix" ]; then
  if [ ! -f "CLAUDE.md" ]; then
    echo "❌ Error: CLAUDE.md is required for $BRANCH_TYPE branches"
    echo "💡 Run: npm run claude:start <developer> <branch> <ticket>"
    exit 1
  fi
fi

# Validate Claude session is active
if [ -f ".claude/current-session.json" ]; then
  SESSION_AGE=$(($(date +%s) - $(stat -f %m .claude/current-session.json 2>/dev/null || stat -c %Y .claude/current-session.json 2>/dev/null)))
  MAX_AGE=28800  # 8 hours in seconds
  
  if [ $SESSION_AGE -gt $MAX_AGE ]; then
    echo "⚠️  Warning: Claude session is older than 8 hours"
    echo "💡 Consider starting a new session: npm run claude:start"
  fi
fi

# Run Claude-specific linting
npm run claude:lint

# Check for sensitive information in Claude contexts
npm run claude:security-check

echo "✅ Claude validation passed"
EOF

chmod +x .husky/pre-commit

# Step 4: Create commit-msg hook for session tracking
echo "📝 Creating commit-msg hook..."
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Claude Session ID Injection
COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat $COMMIT_MSG_FILE)

# Check if we have an active Claude session
if [ -f ".claude/current-session.json" ]; then
  SESSION_ID=$(grep '"id"' .claude/current-session.json | cut -d'"' -f4)
  
  # Check if session ID is already in commit message
  if ! echo "$COMMIT_MSG" | grep -q "Claude:"; then
    # Append Claude session ID to commit message
    echo "$COMMIT_MSG" > $COMMIT_MSG_FILE
    echo "" >> $COMMIT_MSG_FILE
    echo "Claude: $SESSION_ID" >> $COMMIT_MSG_FILE
    echo "✅ Added Claude session ID to commit message"
  fi
fi

# Validate commit message format for Claude-generated code
if echo "$COMMIT_MSG" | grep -q "\[Claude\]"; then
  # Ensure proper format for Claude commits
  if ! echo "$COMMIT_MSG" | grep -q "\[Claude\].*\[.*\]"; then
    echo "❌ Error: Claude commits must include ticket reference"
    echo "Format: [Claude] Description [TICKET-123]"
    exit 1
  fi
fi
EOF

chmod +x .husky/commit-msg

# Step 5: Create post-checkout hook for context switching
echo "📝 Creating post-checkout hook..."
cat > .husky/post-checkout << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Claude Context Auto-switching
PREV_BRANCH=$1
NEW_BRANCH=$2
BRANCH_CHECKOUT=$3

if [ "$BRANCH_CHECKOUT" = "1" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  BRANCH_TYPE=$(echo $BRANCH | cut -d'/' -f1)
  
  echo "🔄 Switched to branch: $BRANCH"
  
  # Load appropriate Claude context
  case $BRANCH_TYPE in
    main)
      echo "📋 Loading production Claude context..."
      cp .claude/contexts/production/CLAUDE.md ./CLAUDE.md 2>/dev/null || true
      echo "⚠️  Production branch - Maximum safety enabled"
      ;;
    develop)
      echo "📋 Loading development Claude context..."
      cp .claude/contexts/development/CLAUDE.md ./CLAUDE.md 2>/dev/null || true
      ;;
    feature)
      echo "📋 Loading feature Claude template..."
      cp .claude/templates/feature-CLAUDE.md ./CLAUDE.md 2>/dev/null || true
      echo "💡 Remember to start a Claude session: npm run claude:start"
      ;;
    hotfix)
      echo "🚨 Loading hotfix Claude context..."
      cp .claude/templates/hotfix-CLAUDE.md ./CLAUDE.md 2>/dev/null || true
      echo "⏱️  Hotfix branch - Limited time context"
      ;;
    experiment)
      echo "🧪 Loading experimental Claude context..."
      cp .claude/templates/experiment-CLAUDE.md ./CLAUDE.md 2>/dev/null || true
      echo "⚠️  Experimental branch - Remember to clean up after"
      ;;
  esac
  
  # Check for existing session file from this branch
  SESSION_FILE=".claude/sessions/branches/${BRANCH//\//-}.json"
  if [ -f "$SESSION_FILE" ]; then
    echo "📂 Found existing Claude session for this branch"
    echo "💡 Resume with: npm run claude:resume"
  fi
fi
EOF

chmod +x .husky/post-checkout

# Step 6: Create pre-push hook for quality gates
echo "📝 Creating pre-push hook..."
cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Claude Quality Gates Before Push
echo "🔍 Running Claude quality checks before push..."

BRANCH=$(git rev-parse --abbrev-ref HEAD)
BRANCH_TYPE=$(echo $BRANCH | cut -d'/' -f1)

# Run tests for Claude-generated code
echo "🧪 Testing Claude-generated code..."
npm run test:claude-generated

# Check Claude insights were captured
if [ "$BRANCH_TYPE" = "feature" ]; then
  INSIGHTS_COUNT=$(find .claude/insights -name "*.json" -mtime -1 2>/dev/null | wc -l)
  if [ "$INSIGHTS_COUNT" -eq "0" ]; then
    echo "⚠️  Warning: No Claude insights captured in the last 24 hours"
    echo "💡 Capture insights with: npm run claude:insight"
  fi
fi

# Validate complexity didn't increase dramatically
npm run complexity:check

# Check for Claude-specific anti-patterns
npm run claude:anti-patterns

echo "✅ All Claude quality checks passed"
EOF

chmod +x .husky/pre-push

# Step 7: Update package.json with the necessary scripts
echo "📦 Updating package.json scripts..."
cat > claude-husky-scripts.json << 'EOF'
{
  "scripts": {
    "prepare": "husky",
    "claude:lint": "node scripts/claude-linter.js",
    "claude:security-check": "node scripts/claude-security-check.js",
    "test:claude-generated": "jest --testPathPattern=claude-generated",
    "complexity:check": "node scripts/complexity-analyzer.js",
    "claude:anti-patterns": "node scripts/anti-pattern-detector.js",
    "claude:start": "node scripts/claude-team-manager.js start",
    "claude:resume": "node scripts/claude-team-manager.js resume",
    "claude:insight": "node scripts/claude-team-manager.js insight",
    "claude:end": "node scripts/claude-team-manager.js end"
  }
}
EOF

echo "
✅ Husky setup complete!

📋 Created hooks:
  - pre-commit: Validates Claude context and runs security checks
  - commit-msg: Adds Claude session ID to commits
  - post-checkout: Auto-switches Claude context based on branch
  - pre-push: Runs quality gates for Claude-generated code

🚀 To finalize setup:
  1. Merge claude-husky-scripts.json into your package.json
  2. Run: npm install
  3. Test with: git commit --allow-empty -m 'test: Husky setup'

📚 Usage:
  - Start Claude session: npm run claude:start <dev> <branch> <ticket>
  - Commits will auto-include session IDs
  - Context switches automatically on branch change
  - Quality checks run before push
"

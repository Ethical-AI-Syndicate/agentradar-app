#!/usr/bin/env node

/**
 * Claude Validation Scripts for Git Hooks
 * Supporting scripts for the modern Husky setup
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process').promises;

// ============================================
// claude-linter.js - Lint Claude contexts
// ============================================
async function claudeLinter() {
  console.log('🔍 Linting Claude context files...');
  
  try {
    // Check if CLAUDE.md exists
    const claudeMd = await fs.readFile('CLAUDE.md', 'utf8').catch(() => null);
    
    if (!claudeMd) {
      console.log('⚠️  No CLAUDE.md file found (may be intentional for this branch)');
      return;
    }
    
    const issues = [];
    
    // Check for required sections
    const requiredSections = ['## Objectives', '## Available Commands', '## Constraints'];
    for (const section of requiredSections) {
      if (!claudeMd.includes(section)) {
        issues.push(`Missing required section: ${section}`);
      }
    }
    
    // Check for placeholders that weren't replaced
    const placeholders = claudeMd.match(/\[([A-Z_]+)\]/g);
    if (placeholders && placeholders.length > 0) {
      issues.push(`Unreplaced placeholders found: ${placeholders.join(', ')}`);
    }
    
    // Check file size (context shouldn't be too large)
    const stats = await fs.stat('CLAUDE.md');
    const sizeKB = stats.size / 1024;
    if (sizeKB > 100) {
      issues.push(`CLAUDE.md is too large (${sizeKB.toFixed(2)} KB > 100 KB limit)`);
    }
    
    // Report issues
    if (issues.length > 0) {
      console.error('❌ Claude context issues found:');
      issues.forEach(issue => console.error(`   - ${issue}`));
      process.exit(1);
    }
    
    console.log('✅ Claude context validation passed');
    
  } catch (error) {
    console.error('❌ Error during Claude linting:', error.message);
    process.exit(1);
  }
}

// ============================================
// claude-security-check.js - Security scanner
// ============================================
async function claudeSecurityCheck() {
  console.log('🔐 Checking for sensitive information in Claude contexts...');
  
  const sensitivePatterns = [
    { pattern: /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, type: 'API Key' },
    { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Password' },
    { pattern: /token\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Token' },
    { pattern: /secret\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Secret' },
    { pattern: /private[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi, type: 'Private Key' },
    { pattern: /sk_live_[a-zA-Z0-9]+/g, type: 'Stripe Live Key' },
    { pattern: /postgres:\/\/[^@]+@/g, type: 'Database URL with credentials' }
  ];
  
  const filesToCheck = [
    'CLAUDE.md',
    'COMMANDS.md',
    '.claude/current-session.json'
  ];
  
  let issuesFound = false;
  
  for (const file of filesToCheck) {
    try {
      const content = await fs.readFile(file, 'utf8');
      
      for (const { pattern, type } of sensitivePatterns) {
        const matches = content.match(pattern);
        if (matches && matches.length > 0) {
          console.error(`❌ ${type} found in ${file}`);
          console.error(`   Example: ${matches[0].substring(0, 30)}...`);
          issuesFound = true;
        }
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
  
  if (issuesFound) {
    console.error('\n⚠️  Remove sensitive information before committing!');
    console.error('💡 Use environment variables or .env files instead');
    process.exit(1);
  }
  
  console.log('✅ No sensitive information detected');
}

// ============================================
// complexity-analyzer.js - Complexity checker
// ============================================
async function complexityAnalyzer() {
  console.log('📊 Analyzing code complexity...');
  
  try {
    // Get list of changed files
    const { stdout } = await exec('git diff --cached --name-only --diff-filter=AMR');
    const files = stdout.trim().split('\n').filter(f => f.endsWith('.js') || f.endsWith('.ts'));
    
    if (files.length === 0) {
      console.log('No JavaScript/TypeScript files to analyze');
      return;
    }
    
    let totalComplexity = 0;
    let fileCount = 0;
    
    for (const file of files) {
      if (!file) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        
        // Simple complexity metrics
        const lines = content.split('\n').length;
        const functions = (content.match(/function\s+\w+|=>\s*{|async\s+\w+/g) || []).length;
        const conditions = (content.match(/if\s*\(|switch\s*\(|\?\s*:/g) || []).length;
        const loops = (content.match(/for\s*\(|while\s*\(|\.map\(|\.forEach\(|\.filter\(/g) || []).length;
        
        const complexity = functions + (conditions * 2) + (loops * 3);
        const complexityPerLine = lines > 0 ? (complexity / lines) : 0;
        
        if (complexityPerLine > 0.5) {
          console.warn(`⚠️  High complexity in ${file}: ${complexity} (${complexityPerLine.toFixed(2)} per line)`);
        }
        
        totalComplexity += complexity;
        fileCount++;
        
      } catch (error) {
        console.error(`Error analyzing ${file}:`, error.message);
      }
    }
    
    const avgComplexity = fileCount > 0 ? (totalComplexity / fileCount) : 0;
    console.log(`📈 Average complexity: ${avgComplexity.toFixed(2)}`);
    
    if (avgComplexity > 50) {
      console.error('❌ Average complexity too high. Consider breaking down complex functions.');
      process.exit(1);
    }
    
    console.log('✅ Complexity check passed');
    
  } catch (error) {
    console.error('Error during complexity analysis:', error.message);
    process.exit(1);
  }
}

// ============================================
// anti-pattern-detector.js - Anti-pattern checker
// ============================================
async function antiPatternDetector() {
  console.log('🔍 Checking for Claude anti-patterns...');
  
  const antiPatterns = [
    {
      pattern: /import\s+{\s*\w+\s*}\s+from\s+['"]@company\/non-existent['"]/g,
      message: 'Importing from non-existent package (Claude hallucination)',
      severity: 'error'
    },
    {
      pattern: /TODO:\s*\[Claude\]/gi,
      message: 'Unresolved Claude TODO found',
      severity: 'warning'
    },
    {
      pattern: /console\.log\(['"]Claude:/gi,
      message: 'Debug Claude logging left in code',
      severity: 'warning'
    },
    {
      pattern: /await\s+fetch\(['"]https?:\/\/localhost/gi,
      message: 'Localhost URL in production code',
      severity: 'error'
    },
    {
      pattern: /process\.env\.\w+\s*\|\|\s*['"][^'"]+['"]/g,
      message: 'Hardcoded fallback for environment variable',
      severity: 'warning'
    },
    {
      pattern: /\.catch\(\s*\)/g,
      message: 'Empty catch block (error swallowing)',
      severity: 'error'
    },
    {
      pattern: /new\s+Date\(\)\.getTime\(\)\s*[+\-]\s*\d{10,}/g,
      message: 'Hardcoded timestamp offset',
      severity: 'warning'
    },
    {
      pattern: /if\s*\(\s*true\s*\)|if\s*\(\s*false\s*\)/g,
      message: 'Hardcoded boolean condition',
      severity: 'error'
    }
  ];
  
  try {
    // Get list of changed files
    const { stdout } = await exec('git diff --cached --name-only --diff-filter=AMR');
    const files = stdout.trim().split('\n').filter(f => 
      f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx')
    );
    
    if (files.length === 0) {
      console.log('No code files to check');
      return;
    }
    
    const issues = {
      error: [],
      warning: []
    };
    
    for (const file of files) {
      if (!file) continue;
      
      try {
        const content = await fs.readFile(file, 'utf8');
        
        for (const { pattern, message, severity } of antiPatterns) {
          const matches = content.match(pattern);
          if (matches && matches.length > 0) {
            issues[severity].push({
              file,
              message,
              example: matches[0]
            });
          }
        }
      } catch (error) {
        // File doesn't exist or can't be read, skip
      }
    }
    
    // Report warnings
    if (issues.warning.length > 0) {
      console.warn('\n⚠️  Warnings found:');
      issues.warning.forEach(({ file, message, example }) => {
        console.warn(`   ${file}: ${message}`);
        console.warn(`     Example: ${example.substring(0, 50)}...`);
      });
    }
    
    // Report errors
    if (issues.error.length > 0) {
      console.error('\n❌ Anti-patterns detected:');
      issues.error.forEach(({ file, message, example }) => {
        console.error(`   ${file}: ${message}`);
        console.error(`     Example: ${example.substring(0, 50)}...`);
      });
      console.error('\n💡 Fix these issues before committing');
      process.exit(1);
    }
    
    console.log('✅ No critical anti-patterns found');
    
  } catch (error) {
    console.error('Error during anti-pattern detection:', error.message);
    process.exit(1);
  }
}

// ============================================
// Main execution based on script name
// ============================================
async function main() {
  const scriptName = path.basename(process.argv[1]);
  
  try {
    switch (scriptName) {
      case 'claude-linter.js':
        await claudeLinter();
        break;
      case 'claude-security-check.js':
        await claudeSecurityCheck();
        break;
      case 'complexity-analyzer.js':
        await complexityAnalyzer();
        break;
      case 'anti-pattern-detector.js':
        await antiPatternDetector();
        break;
      default:
        // If called directly, run all checks
        console.log('Running all Claude validation checks...\n');
        await claudeLinter();
        await claudeSecurityCheck();
        await complexityAnalyzer();
        await antiPatternDetector();
        console.log('\n✅ All validation checks passed!');
    }
  } catch (error) {
    console.error('Validation failed:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  claudeLinter,
  claudeSecurityCheck,
  complexityAnalyzer,
  antiPatternDetector
};

// Run if called directly
if (require.main === module) {
  main();
}

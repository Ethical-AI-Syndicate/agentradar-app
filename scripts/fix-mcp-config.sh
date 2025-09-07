#!/bin/bash
# Quick fix for the ES module issue

# Navigate to the MCP directory
cd ~/claude-projects/active/RealEstateAgent-IntelligenceFeed/mcp-integrations

# Create the corrected update script with .mjs extension
cat > update-config.mjs << 'EOF'
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration paths
const claudeCodeConfigDir = path.join(process.env.HOME, '.config', 'claude-code');
const claudeCodeMcpFile = path.join(claudeCodeConfigDir, 'mcp-servers.json');
const mcpDir = process.cwd();

console.log('Updating Claude Code MCP configuration...');

try {
  // Ensure config directory exists
  if (!fs.existsSync(claudeCodeConfigDir)) {
    fs.mkdirSync(claudeCodeConfigDir, { recursive: true });
    console.log('Created config directory:', claudeCodeConfigDir);
  }
  
  let config = {};
  
  // Read existing config if it exists
  if (fs.existsSync(claudeCodeMcpFile)) {
    const content = fs.readFileSync(claudeCodeMcpFile, 'utf8');
    try {
      config = JSON.parse(content);
      console.log('Found existing configuration');
    } catch (e) {
      console.log('Creating new configuration file...');
      config = {};
    }
  }
  
  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }
  
  // Add AgentRadar MCP server configuration
  config.mcpServers.agentradar = {
    command: 'node',
    args: [path.join(mcpDir, 'core', 'server.js')],
    cwd: mcpDir,
    env: {
      NODE_ENV: 'development'
    }
  };
  
  // Write updated configuration
  fs.writeFileSync(claudeCodeMcpFile, JSON.stringify(config, null, 2));
  console.log('✅ Claude Code MCP configuration updated successfully');
  console.log('📁 Config location:', claudeCodeMcpFile);
  console.log('\nConfiguration added:');
  console.log(JSON.stringify(config.mcpServers.agentradar, null, 2));
  
} catch (error) {
  console.error('❌ Error updating configuration:', error.message);
  process.exit(1);
}
EOF

# Run the corrected update script
echo "Running corrected configuration update..."
node update-config.mjs

# Clean up
rm -f update-config.js update-config.mjs

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "Test with:"
echo "  claude code mcp list"
echo "  cd ~/claude-projects/active/RealEstateAgent-IntelligenceFeed/mcp-integrations && npm test"

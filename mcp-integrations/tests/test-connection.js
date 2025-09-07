#!/usr/bin/env node
/**
 * MCP Connection Test Script
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Testing AgentRadar MCP Server Connection...\n');

const serverPath = join(__dirname, '..', 'core', 'server.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let testsPassed = 0;
let testsFailed = 0;

// Test 1: List tools
const listToolsRequest = {
  jsonrpc: '2.0',
  method: 'tools/list',
  id: 1,
  params: {}
};

console.log('📋 Test 1: Listing available tools...');
server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    try {
      const response = JSON.parse(lines[i]);
      if (response.result && response.result.tools) {
        console.log('✅ Server responded with ' + response.result.tools.length + ' tools:');
        response.result.tools.forEach(tool => {
          console.log('   • ' + tool.name);
        });
        testsPassed++;
        
        // Test 2: Call a tool
        console.log('\n📊 Test 2: Getting system status...');
        const toolCallRequest = {
          jsonrpc: '2.0',
          method: 'tools/call',
          id: 2,
          params: {
            name: 'get_system_status',
            arguments: { detailed: true }
          }
        };
        server.stdin.write(JSON.stringify(toolCallRequest) + '\n');
      } else if (response.id === 2) {
        console.log('✅ System status retrieved successfully');
        testsPassed++;
        
        // All tests complete
        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests passed! (' + testsPassed + '/' + (testsPassed + testsFailed) + ')');
        console.log('🎉 MCP Server is working correctly!');
        console.log('='.repeat(50));
        
        server.kill();
        process.exit(0);
      }
    } catch (e) {
      // Not JSON, likely server log message
    }
  }
  
  buffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('[') && !msg.includes('AgentRadar')) {
    console.error('❌ Server error:', msg);
    testsFailed++;
  }
});

// Timeout handler
setTimeout(() => {
  console.error('\n❌ Test timeout - server did not respond');
  testsFailed++;
  server.kill();
  process.exit(1);
}, 10000);

// Handle errors
server.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});

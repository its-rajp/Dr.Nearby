#!/usr/bin/env node
import { createStdioServer } from '@modelcontextprotocol/sdk/server';
import { Tool } from '@modelcontextprotocol/sdk/types';

// Simple tool to demonstrate MCP functionality
const tools = [
  {
    name: 'get_patient_count',
    description: 'Get total number of patients in DrNearby system',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
];

// Create MCP server
const server = createStdioServer({
  name: 'drnearby-backend-mcp',
  version: '1.0.0'
});

// Register tools
server.setRequestHandler('tools/list', async () => ({
  tools: tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }))
}));

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  const { name } = request.params;
  
  if (name === 'get_patient_count') {
    // In real implementation, query your MongoDB here
    return { content: [{ type: 'text', text: 'Total patients: 1,247' }] };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});

// Start server
server.connect();
console.log('✅ DrNearby MCP server running (stdio transport)');
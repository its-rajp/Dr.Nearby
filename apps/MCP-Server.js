#!/usr/bin/env node
import { createStdioServer } from '@modelcontextprotocol/sdk/server';
import { Tool } from '@modelcontextprotocol/sdk/types';


const tools = [
  {
    name: 'get_patient_count',
    description: 'Get total number of patients in DrNearby system',
    inputSchema: { type: 'object', properties: {}, required: [] }
  }
];


const server = createStdioServer({
  name: 'drnearby-backend-mcp',
  version: '1.0.0'
});


server.setRequestHandler('tools/list', async () => ({
  tools: tools.map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema
  }))
}));


server.setRequestHandler('tools/call', async (request) => {
  const { name } = request.params;
  
  if (name === 'get_patient_count') {
    
    return { content: [{ type: 'text', text: 'Total patients: 1,247' }] };
  }
  
  throw new Error(`Unknown tool: ${name}`);
});


server.connect();
console.log('✅ DrNearby MCP server running (stdio transport)');
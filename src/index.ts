import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import { registerTools } from './tools/tools';
import { config } from "dotenv";
config();

const app = express();

const server = new McpServer({
  name: 'Wyvate-MCP-Server',
  version: '1.0.0',
});

// Register all tools
registerTools(server);

// ✅ SSE and Message handling
const transports = {};

app.get("/", (req, res) => {
    res.json("Server is running");
})

app.get('/sse', async (req, res) => {
  console.log("Client connected to SSE.");
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;

  res.on('close', () => {
    console.log("Client disconnected.");
    delete transports[transport.sessionId];
  });

  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId?.toString();
  const transport = transports[sessionId];

  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

app.listen(3000, () => console.log("🟢 MCP Server is running on port 3000"));

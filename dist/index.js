"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/server/sse.js");
const express_1 = __importDefault(require("express"));
const tools_1 = require("./tools/tools");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
const server = new mcp_js_1.McpServer({
    name: 'Wyvate-MCP-Server',
    version: '1.0.0',
});
// Register all tools
(0, tools_1.registerTools)(server);
// ✅ SSE and Message handling
const transports = {};
app.get("/", (req, res) => {
    res.json("Server is running");
});
app.get('/sse', async (req, res) => {
    console.log("Client connected to SSE.");
    const transport = new sse_js_1.SSEServerTransport('/messages', res);
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
    }
    else {
        res.status(400).send('No transport found for sessionId');
    }
});
app.listen(3000, () => console.log("🟢 MCP Server is running on port 3000"));

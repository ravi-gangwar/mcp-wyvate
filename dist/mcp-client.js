"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const genai_1 = require("@google/genai");
const index_js_1 = require("@modelcontextprotocol/sdk/client/index.js");
const sse_js_1 = require("@modelcontextprotocol/sdk/client/sse.js");
// AI & MCP Initialization
const ai = new genai_1.GoogleGenAI({ apiKey: 'AIzaSyC-nDzJv0rPmckUnKTvplKMsC_mjNAD39w' });
const mcpClient = new index_js_1.Client({
    name: 'Wyvate-MCP-Client',
    version: '1.0.0',
});
let tools = [];
let connected = false;
// Connect MCP and fetch tools
const connectToMCP = async () => {
    if (connected)
        return;
    try {
        await mcpClient.connect(new sse_js_1.SSEClientTransport(new URL('http://localhost:3000/sse')));
        console.log('✅ Connected to MCP server');
        const result = await mcpClient.listTools();
        tools = result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: {
                type: tool.inputSchema.type,
                properties: tool.inputSchema.properties,
                required: tool.inputSchema.required,
            },
        }));
        connected = true;
    }
    catch (err) {
        console.error('❌ MCP connection error:', err);
    }
};
// Setup Express
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// POST /chat
app.post('/chat', async (req, res) => {
    const { userInput, chatHistory = [] } = req.body;
    if (!userInput) {
        return res.status(400).json({ error: 'Missing userInput' });
    }
    await connectToMCP();
    chatHistory.push({
        role: 'user',
        parts: [{ text: userInput, type: 'text' }],
    });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: chatHistory,
            config: {
                tools: [{ functionDeclarations: tools }],
            },
        });
        const candidate = response?.candidates?.[0]?.content?.parts?.[0];
        if (candidate?.functionCall) {
            const toolCall = candidate.functionCall;
            console.log(`🔧 Calling tool: ${toolCall.name}`);
            const toolResult = await mcpClient.callTool({
                name: toolCall.name,
                arguments: toolCall.args,
            });
            const toolText = toolResult?.content?.[0]?.text || 'No response from tool.';
            const updatedHistory = [
                ...chatHistory,
                {
                    role: 'model',
                    parts: [{ text: `Calling tool ${toolCall.name}`, type: 'text' }],
                },
                {
                    role: 'user',
                    parts: [{ text: 'Tool result: ' + toolText, type: 'text' }],
                },
            ];
            return res.json({ response: toolText, updatedChatHistory: updatedHistory });
        }
        else {
            const text = candidate?.text || '⚠️ No response generated.';
            const fallbackHistory = [
                ...chatHistory,
                {
                    role: 'model',
                    parts: [{ text, type: 'text' }],
                },
            ];
            return res.json({ response: text, updatedChatHistory: fallbackHistory });
        }
    }
    catch (err) {
        console.error('Error during chat:', err);
        return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
});
// Start the server
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Client is listening on http://localhost:${PORT}`);
});

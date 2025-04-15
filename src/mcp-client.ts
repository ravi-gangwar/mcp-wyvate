import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { GoogleGenAI, GenerateContentResponse } from '@google/genai';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

// AI & MCP Initialization
const ai = new GoogleGenAI({ apiKey: 'AIzaSyC-nDzJv0rPmckUnKTvplKMsC_mjNAD39w' });

const mcpClient = new Client({
  name: 'Wyvate-MCP-Client',
  version: '1.0.0',
});

interface ChatPart {
  text: string;
  type: 'text';
}

interface ChatEntry {
  role: 'user' | 'model';
  parts: ChatPart[];
}

let tools: any[] = [];
let connected = false;

// Connect MCP and fetch tools
const connectToMCP = async () => {
  if (connected) return;
  try {
    await mcpClient.connect(new SSEClientTransport(new URL('http://localhost:8080/sse')));
    console.log('✅ Connected to MCP server');

    const result = await mcpClient.listTools();
    tools = result.tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: tool.inputSchema.type,
        properties: tool.inputSchema.properties,
        required: tool.inputSchema.required,
      },
    }));
    connected = true;
  } catch (err) {
    console.error('❌ MCP connection error:', err);
  }
};

// Setup Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// POST /chat
app.post('/chat', async (req: Request, res: Response): Promise<any> => {
  const {
    userInput,
    chatHistory = [],
    userContext,
  }: {
    userInput: string;
    chatHistory: ChatEntry[];
    userContext?: string | Record<string, any>;
  } = req.body;

  console.log(userInput)
  console.log(chatHistory)
  console.log(userContext)

  if (!userInput) {
    return res.status(400).json({ error: "Missing userInput" });
  }

  await connectToMCP();

  // 🧠 Convert userContext to a Gemini-readable message
  let contextMessage: ChatEntry | null = null;

  if (userContext) {
    const contextString =
      typeof userContext === "string"
        ? userContext
        : JSON.stringify(userContext);

    contextMessage = {
      role: "user",
      parts: [{ text: `#context ${contextString}`, type: "text" }],
    };
  }

  const updatedChatHistory: ChatEntry[] = [
    ...chatHistory,
    {
      role: "user",
      parts: [{ text: userInput, type: "text" }, 
      {
        type: "text",
        text: JSON.stringify(contextMessage)
      }],
    },
  ];

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: updatedChatHistory,
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

      const toolText = toolResult?.content?.[0]?.text || "No response from tool.";
      return res.json({ response: toolText });
    } else {
      const text = candidate?.text || "⚠️ No response generated.";
      return res.json({ response: text });
    }
  } catch (err: any) {
    console.error("Error during chat:", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});


// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Client is listening on http://localhost:${PORT}`);
});

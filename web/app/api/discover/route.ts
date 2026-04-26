import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are the MCP Marketplace assistant — a registry of Model Context Protocol tools that give AI agents pluggable capabilities. Do not mention what AI model you are or who made you.

When a user describes what they need, use the search_tools function to find relevant tools in the registry. Then recommend the best match with a brief explanation and the install command. Keep responses concise.

If no tools match, say so honestly. Do not invent tools that don't exist.`;

const API_URL = process.env.API_URL || "http://localhost:8000";

const tools: Anthropic.Tool[] = [
  {
    name: "search_tools",
    description: "Search the MCP Marketplace registry for tools.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string", description: "Search terms" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_tool_detail",
    description: "Get full details about a specific tool.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Tool slug identifier" },
      },
      required: ["slug"],
    },
  },
];

async function executeTool(name: string, input: Record<string, string>): Promise<string> {
  if (name === "search_tools") {
    try {
      const params = new URLSearchParams({ q: input.query, limit: "5", sort: "installs" });
      const res = await fetch(`${API_URL}/tools?${params}`);
      if (!res.ok) return "Registry search failed.";
      const data = await res.json();
      if (!data.tools?.length) return "No tools found.";
      return `Found ${data.total} tool(s):\n` + data.tools.map((t: {
        slug: string; description: string; install_count: number; avg_rating: number | null;
      }) =>
        `- ${t.slug}: ${t.description} (${t.install_count} installs${t.avg_rating ? `, ★${t.avg_rating}` : ""})`
      ).join("\n");
    } catch {
      return "Registry API unreachable.";
    }
  }

  if (name === "get_tool_detail") {
    try {
      const res = await fetch(`${API_URL}/tools/${input.slug}`);
      if (!res.ok) return `Tool "${input.slug}" not found.`;
      const tool = await res.json();
      return JSON.stringify({
        slug: tool.slug, name: tool.name, description: tool.description,
        latest_version: tool.latest_version, install_count: tool.install_count,
      });
    } catch {
      return "Registry API unreachable.";
    }
  }

  return "Unknown tool.";
}

async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || !(await verifyToken(token))) {
    return new Response(JSON.stringify({ error: "Login required to use AI discovery." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { message } = await req.json();

  const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "AI_API_KEY not set" }), { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: message }];

  let finalText = "";
  const maxIterations = 5;

  for (let i = 0; i < maxIterations; i++) {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    if (response.stop_reason === "end_turn") {
      for (const block of response.content) {
        if (block.type === "text") finalText += block.text;
      }
      break;
    }

    if (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, string>);
        toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    break;
  }

  return new Response(JSON.stringify({ response: finalText }), {
    headers: { "Content-Type": "application/json" },
  });
}

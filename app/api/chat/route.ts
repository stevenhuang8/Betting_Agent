import { SYSTEM_INSTRUCTIONS } from "@/components/agent/prompt";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextRequest } from "next/server";
import { bettingAnalysisTool } from "@/lib/betting-tools";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    console.log("Received messages:", JSON.stringify(messages, null, 2));

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert frontend message format to AI SDK format
    const aiMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    console.log("AI Messages:", JSON.stringify(aiMessages, null, 2));

    const result = streamText({
      model: openai("gpt-5"),
      system: SYSTEM_INSTRUCTIONS,
      messages: aiMessages,
      tools: {
        web_search: openai.tools.webSearch({
          searchContextSize: "low",
        }),
        betting_analysis: bettingAnalysisTool,
      },
    });

    console.log("StreamText result created");
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

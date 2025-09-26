"use client";

import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";

import { BetDisplay } from "@/components/betting/bet-display";

// Function to extract betting analysis data from text response
const extractBettingData = (content: string) => {
  try {
    // Look for JSON objects in the response that match our betting structure
    const jsonRegex = /\{[\s\S]*?"bets":\s*\[[\s\S]*?\]/g;
    const matches = content.match(jsonRegex);

    if (matches) {
      for (const match of matches) {
        try {
          const parsed = JSON.parse(match);
          if (parsed.bets && Array.isArray(parsed.bets)) {
            return parsed;
          }
        } catch (e) {
          continue;
        }
      }
    }
  } catch (error) {
    // If parsing fails, return null
  }
  return null;
};


type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);


  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      <Conversation className="flex-1 h-0 overflow-hidden">
        <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything about sports betting and I'll help you out!"
            />
          ) : (
            messages.map((message) => {
              return (
                <div key={message.id} className="w-full">
                  <Message from={message.role}>
                    <MessageContent>
                      {message.role === 'user' ? (
                        <div className="whitespace-pre-line">
                          {message.content}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            const bettingData = extractBettingData(message.content);

                            if (bettingData) {
                              // Extract text content without the JSON
                              const cleanContent = message.content
                                .replace(/\{[\s\S]*?"bets":\s*\[[\s\S]*?\]/g, '')
                                .trim();

                              return (
                                <div className="space-y-4">
                                  {/* Display regular content if any */}
                                  {cleanContent && (
                                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                      {cleanContent}
                                    </div>
                                  )}

                                  {/* Display betting analysis results */}
                                  <BetDisplay
                                    bets={bettingData.bets}
                                    sources={bettingData.sources || []}
                                  />
                                </div>
                              );
                            } else {
                              // Regular content display when no betting data
                              return (
                                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                                  {message.content}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                </div>
              );
            })
          )}
          {isLoading && (
            <Message from="assistant">
              <MessageContent>Analyzing betting opportunities...</MessageContent>
            </Message>
          )}
        </ConversationContent>
      </Conversation>

      <div className="p-4 flex-shrink-0">
        <PromptInput onSubmit={async (message: any, event: any) => {
          event.preventDefault();
          if (message.text?.trim() && !isLoading) {
            const userMessage: ChatMessage = {
              id: Date.now().toString(),
              role: "user",
              content: message.text,
            };

            const updatedMessages = [...messages, userMessage];
            setMessages(updatedMessages);
            setInput("");
            setIsLoading(true);

            try {
              const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: updatedMessages }),
              });

              console.log("Response status:", response.status);
              console.log("Response headers:", Object.fromEntries(response.headers.entries()));

              if (!response.ok) {
                throw new Error("Failed to get response");
              }

              if (!response.body) {
                console.error("No response body");
                throw new Error("No response body");
              }

              let assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "",
              };

              setMessages((prev) => [...prev, assistantMessage]);

              const stream = response.body
                .pipeThrough(new TextDecoderStream())
                .getReader();

              console.log("Starting to read stream...");

              while (true) {
                const { done, value } = await stream.read();
                console.log("Stream chunk:", { done, chunk: value });

                if (done) {
                  console.log("Stream finished");
                  break;
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessage.id
                      ? { ...msg, content: msg.content + value }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error("Chat error:", error);
              const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error. Please try again.",
              };
              setMessages((prev) => [...prev, errorMessage]);
            } finally {
              setIsLoading(false);
            }
          }
        }}>
          <PromptInputBody>
            <PromptInputTextarea
              placeholder="Ask about sports betting opportunities..."
              value={input}
              onChange={(e: any) => setInput(e.target.value)}
            />
            <PromptInputToolbar>
              <div />
              <PromptInputSubmit status={isLoading ? "submitted" : undefined} />
            </PromptInputToolbar>
          </PromptInputBody>
        </PromptInput>
      </div>
    </div>
  );
}

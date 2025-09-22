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
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { removeUrls } from "@/lib/utils";
import { BettingTable, type BetRecommendation } from "@/components/betting_table";
import { Eye, EyeOff } from "lucide-react";

const formatBetContent = (content: string) => {
  // Split content by common bet leg indicators and create structured segments
  let formattedContent = content;

  // Add markers before numbered items, legs, and games
  formattedContent = formattedContent.replace(/(\d+\.\s)/g, '\n\nNUMBERED_ITEM::$1');
  formattedContent = formattedContent.replace(/(Leg \d+:)/gi, '\n\nLEG_MARKER::$1');
  formattedContent = formattedContent.replace(/(Game \d+:)/gi, '\n\nGAME_MARKER::$1');

  // Split into segments and filter out empty ones
  const segments = formattedContent
    .split('\n\n')
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return segments.map(segment => {
    if (segment.startsWith('NUMBERED_ITEM::')) {
      return {
        type: 'numbered',
        content: segment.replace('NUMBERED_ITEM::', '')
      };
    } else if (segment.startsWith('LEG_MARKER::')) {
      return {
        type: 'leg',
        content: segment.replace('LEG_MARKER::', '')
      };
    } else if (segment.startsWith('GAME_MARKER::')) {
      return {
        type: 'game',
        content: segment.replace('GAME_MARKER::', '')
      };
    } else {
      return {
        type: 'regular',
        content: segment
      };
    }
  });
};

const parseBettingRecommendations = (content: string): BetRecommendation[] => {
  const bets: BetRecommendation[] = [];

  // More flexible patterns for betting recommendations
  const patterns = [
    // Pattern: "Bet $50 on Lakers -5.5 for potential winnings of $95"
    /bet\s+\$?(\d+(?:\.\d{2})?)\s+on\s+([^,\n]+?)\s+(?:at\s+)?([+\-]?\d+(?:\.\d+)?|over\s+\d+(?:\.\d+)?|under\s+\d+(?:\.\d+)?|[^,\n]+?)\s+for\s+(?:potential\s+)?winnings?\s+of\s+\$?(\d+(?:\.\d{2})?)/gi,

    // Pattern: "Lakers -5.5: $50 bet → $95 potential"
    /([^:\n]+?):\s+\$?(\d+(?:\.\d{2})?)\s+bet\s+[→\->]\s+\$?(\d+(?:\.\d{2})?)\s+potential/gi,

    // Pattern: "Player/Team | Bet | Line | Winnings" (table-like format)
    /([^|\n]+?)\s*\|\s*\$?(\d+(?:\.\d{2})?)\s*\|\s*([^|\n]+?)\s*\|\s*\$?(\d+(?:\.\d{2})?)/gi,

    // Simple pattern: "$50 Lakers -5.5"
    /\$(\d+(?:\.\d{2})?)\s+([^,\n]+?)\s+([+\-]?\d+(?:\.\d+)?)/gi,

    // Pattern: "Lakers vs Warriors -5.5 ($50)"
    /([^,\n]+?)\s+([+\-]?\d+(?:\.\d+)?|over\s+\d+(?:\.\d+)?|under\s+\d+(?:\.\d+)?)\s+\(\$(\d+(?:\.\d{2})?)\)/gi
  ];

  patterns.forEach((pattern, patternIndex) => {
    let match;
    while ((match = pattern.exec(content)) !== null) {

      if (patternIndex === 0) {
        // First pattern: amount, player/team, line, winnings
        bets.push({
          playerTeam: match[2].trim(),
          lineProp: match[3].trim(),
          amountBet: parseFloat(match[1]),
          possibleWinnings: parseFloat(match[4]),
          id: `bet-${bets.length}`
        });
      } else if (patternIndex === 1) {
        // Second pattern: player/team, amount, winnings
        bets.push({
          playerTeam: match[1].trim(),
          lineProp: "See description",
          amountBet: parseFloat(match[2]),
          possibleWinnings: parseFloat(match[3]),
          id: `bet-${bets.length}`
        });
      } else if (patternIndex === 2) {
        // Third pattern: player/team, amount, line, winnings
        bets.push({
          playerTeam: match[1].trim(),
          lineProp: match[3].trim(),
          amountBet: parseFloat(match[2]),
          possibleWinnings: parseFloat(match[4]),
          id: `bet-${bets.length}`
        });
      } else if (patternIndex === 3) {
        // Fourth pattern: amount, team, line (estimate winnings)
        const amount = parseFloat(match[1]);
        bets.push({
          playerTeam: match[2].trim(),
          lineProp: match[3].trim(),
          amountBet: amount,
          possibleWinnings: amount * 1.9, // Estimate ~1.9x return
          id: `bet-${bets.length}`
        });
      } else if (patternIndex === 4) {
        // Fifth pattern: team, line, amount (estimate winnings)
        const amount = parseFloat(match[3]);
        bets.push({
          playerTeam: match[1].trim(),
          lineProp: match[2].trim(),
          amountBet: amount,
          possibleWinnings: amount * 1.9, // Estimate ~1.9x return
          id: `bet-${bets.length}`
        });
      }
    }
  });

  return bets;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{
    url: string;
    title?: string;
  }>;
  toolCalls?: Array<{
    type: `tool-${string}`;
    state: "input-streaming" | "input-available" | "output-available" | "output-error";
    input?: any;
    output?: any;
    errorText?: string;
  }>;
};

export default function ChatAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showBettingTable, setShowBettingTable] = useState(true);

  console.log(messages);

  const handleSubmit = async (
    message: { text?: string; files?: any[] },
    event: React.FormEvent
  ) => {
    if (!message.text?.trim() || isLoading) return;

    // Clear the form immediately after extracting the message
    const form = (event.target as Element)?.closest("form") as HTMLFormElement;
    if (form) {
      form.reset();
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.text,
    };

    // Create the updated messages array including the new user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          sources: data.sources || [],
          toolCalls: data.toolCalls || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* Betting Table Toggle */}
      <div className="flex justify-end p-2 border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setShowBettingTable(!showBettingTable)}
          className="flex items-center space-x-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title={showBettingTable ? "Hide betting tables" : "Show betting tables"}
        >
          {showBettingTable ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
          <span>{showBettingTable ? "Hide" : "Show"} Betting Tables</span>
        </button>
      </div>

      <Conversation className="flex-1 h-0 overflow-hidden">
        <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything and I'll help you out!"
            />
          ) : (
            messages.map((message) => {
              const bettingRecommendations = message.role === 'assistant'
                ? parseBettingRecommendations(message.content)
                : [];


              return (
                <div key={message.id} className="w-full">
                  <Message from={message.role}>
                    <MessageContent>
                    {message.role === 'assistant' ? (
                      <div className="space-y-4">
                        {formatBetContent(removeUrls(message.content)).map((segment, index) => {
                          const baseClasses = "leading-relaxed";

                          switch (segment.type) {
                            case 'leg':
                              return (
                                <div key={index} className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-r-md">
                                  <p className={`${baseClasses} font-semibold text-blue-800`}>
                                    {segment.content}
                                  </p>
                                </div>
                              );
                            case 'game':
                              return (
                                <div key={index} className="bg-green-50 border-l-4 border-green-500 p-3 rounded-r-md">
                                  <p className={`${baseClasses} font-semibold text-green-800`}>
                                    {segment.content}
                                  </p>
                                </div>
                              );
                            case 'numbered':
                              return (
                                <div key={index} className="bg-gray-50 border-l-4 border-gray-500 p-3 rounded-r-md">
                                  <p className={`${baseClasses} font-medium text-gray-800`}>
                                    {segment.content}
                                  </p>
                                </div>
                              );
                            default:
                              return (
                                <p key={index} className={`${baseClasses} text-gray-700`}>
                                  {segment.content}
                                </p>
                              );
                          }
                        })}
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">
                        {removeUrls(message.content)}
                      </div>
                    )}
                  </MessageContent>
                </Message>

                {/* Display betting table if recommendations found */}
                {bettingRecommendations.length > 0 && showBettingTable && (
                  <div className="mt-4">
                    <BettingTable
                      bets={bettingRecommendations}
                      title="Recommended Bets"
                      className="max-w-full"
                    />
                  </div>
                )}


                {/* Display sources if available */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4">
                    <Sources>
                      <SourcesTrigger count={message.sources.length} />
                      <SourcesContent>
                        {message.sources.map((source, index) => (
                          <Source
                            key={index}
                            href={source.url}
                            title={source.title || source.url}
                          />
                        ))}
                      </SourcesContent>
                    </Sources>
                  </div>
                )}

                {/* Display tool calls if available (excluding web search) */}
                {message.toolCalls && Array.isArray(message.toolCalls) && message.toolCalls.length > 0 && (
                  <div className="mt-4">
                    {message.toolCalls
                      .filter((toolCall) => toolCall.type !== "tool-web_search")
                      .map((toolCall, index) => (
                        <Tool
                          key={index}
                          defaultOpen={toolCall.state === "output-available"}
                        >
                          <ToolHeader
                            type={toolCall.type}
                            state={toolCall.state}
                          />
                          <ToolContent>
                            {toolCall.input && (
                              <ToolInput input={toolCall.input} />
                            )}
                            {(toolCall.output || toolCall.errorText) && (
                              <ToolOutput
                                output={toolCall.output}
                                errorText={toolCall.errorText}
                              />
                            )}
                          </ToolContent>
                        </Tool>
                      ))}
                  </div>
                )}
                </div>
              );
            })
          )}
          {isLoading && (
            <Message from="assistant">
              <MessageContent>Thinking...</MessageContent>
            </Message>
          )}
        </ConversationContent>
      </Conversation>

      <div className="p-4 flex-shrink-0">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputBody>
            <PromptInputTextarea placeholder="What would you like to know?" />
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

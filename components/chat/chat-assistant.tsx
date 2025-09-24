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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      // Create assistant message with empty content initially
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        sources: [],
        toolCalls: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Read the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg
          )
        );
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

      <Conversation className="flex-1 h-0 overflow-hidden">
        <ConversationContent className="space-y-4">
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Ask me anything and I'll help you out!"
            />
          ) : (
            messages.map((message) => {
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

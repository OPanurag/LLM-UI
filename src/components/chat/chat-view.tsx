"use client";

import type { FC } from 'react';
import { useRef, useEffect } from 'react';
import ChatMessage, { type Message } from './chat-message';
import ChatInputArea from './chat-input-area';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, MessageSquareText } from 'lucide-react';

type ChatViewProps = {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (messageText: string) => void;
  initialBotGreeting?: string;
};

const ChatView: FC<ChatViewProps> = ({ messages, isLoading, onSendMessage, initialBotGreeting }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);


  const displayMessages = initialBotGreeting && messages.length === 0 
    ? [{ id: 'initial-greeting', content: initialBotGreeting, sender: 'bot' as const, timestamp: new Date() }] 
    : messages;

  return (
    <div className="flex h-full flex-col bg-card shadow-xl rounded-lg overflow-hidden">
      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {displayMessages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
            <div className="flex items-start gap-3 my-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-muted">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
              <div className="max-w-[70%] rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground shadow-md">
                Green Recipe Genie is typing...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
         {messages.length === 0 && !initialBotGreeting && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground pt-16">
            <MessageSquareText className="h-16 w-16 mb-4 text-primary/30" />
            <p className="text-lg font-medium">Welcome to Green Recipe Genie!</p>
            <p className="text-sm text-center">Type your recipe request below to get started.</p>
          </div>
        )}
      </ScrollArea>
      <ChatInputArea isLoading={isLoading} onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatView;
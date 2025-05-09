"use client";

import type { FC } from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizonal, Loader2 } from 'lucide-react';

type ChatInputAreaProps = {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
};

const ChatInputArea: FC<ChatInputAreaProps> = ({ isLoading, onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="sticky bottom-0 left-0 right-0 flex items-center gap-2 border-t bg-background p-4 md:p-6 shadow-t-lg"
      aria-label="Chat input form"
    >
      <Textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Ask for a recipe, e.g., 'Chicken and broccoli stir-fry under 600 calories'"
        className="flex-grow resize-none rounded-xl border-input bg-card p-3 pr-16 text-base shadow-sm focus:ring-2 focus:ring-primary/50"
        rows={1}
        disabled={isLoading}
        aria-label="Type your recipe request here"
        aria-multiline="true"
      />
      <Button
        type="submit"
        size="icon"
        className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        disabled={isLoading || !inputValue.trim()}
        aria-label={isLoading ? "Sending message" : "Send message"}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizonal className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
};

export default ChatInputArea;
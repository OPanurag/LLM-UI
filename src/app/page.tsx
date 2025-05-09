"use client";

import { useState, useEffect } from 'react';
import Header from '@/components/layout/header';
import ChatView from '@/components/chat/chat-view';
import type { Message } from '@/components/chat/chat-message';
import { suggestRecipe, type SuggestRecipeInput, type SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { useToast } from "@/hooks/use-toast";

export default function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const initialBotGreeting = "Hello! I'm Green Recipe Genie. What kind of recipe are you looking for today?";

 useEffect(() => {
    // Add initial bot greeting if no messages exist
    if (messages.length === 0 && !isLoading) {
      setMessages([
        {
          id: 'initial-greeting-' + Date.now(),
          content: initialBotGreeting,
          sender: 'bot',
          timestamp: new Date(),
        }
      ]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount


  const handleSendMessage = async (messageText: string) => {
    const newUserMessage: Message = {
      id: 'user-' + Date.now(),
      content: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      const input: SuggestRecipeInput = { userQuery: messageText };
      const result = await suggestRecipe(input);
      
      const newBotMessage: Message = {
        id: 'bot-' + Date.now(),
        content: result, // The entire SuggestRecipeOutput object or a string if botMessage is set
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, newBotMessage]);

      if (result.botMessage && !result.recipeName) { // If it's just a bot message (e.g. clarification, error from AI)
        // Potentially use toast for non-recipe messages if desired, or just rely on chat
      } else if (result.recipeName !== "Error" && result.recipeName !== "No Recipe Found" ) {
         toast({
          title: "Recipe Generated!",
          description: `I've found a recipe for "${result.recipeName}".`,
          variant: "default",
        });
      }

    } catch (e: any) {
      const errorMessage = e.message || "An unexpected error occurred. Please try again.";
      const errorBotMessage: Message = {
        id: 'bot-error-' + Date.now(),
        content: `Sorry, I encountered an error: ${errorMessage}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, errorBotMessage]);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      <main className="container mx-auto flex-grow flex flex-col max-w-3xl w-full px-0 md:px-4 py-4 md:py-8">
        <ChatView
          messages={messages}
          isLoading={isLoading}
          onSendMessage={handleSendMessage}
          // initialBotGreeting={initialBotGreeting} // Pass it if you prefer ChatView to handle it
        />
      </main>
      <footer className="py-4 text-center text-muted-foreground text-xs border-t border-border/50">
        <p>&copy; {new Date().getFullYear()} Green Recipe Genie. Chat with AI for recipes.</p>
      </footer>
    </div>
  );
}
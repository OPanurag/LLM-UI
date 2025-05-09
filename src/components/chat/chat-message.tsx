"use client";

import type { FC } from 'react';
import type { SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, ShoppingBasket, ListOrdered, Flame, Sparkles, ChefHat } from 'lucide-react';
import Image from 'next/image';

export interface Message {
  id: string;
  content: string | SuggestRecipeOutput;
  sender: 'user' | 'bot';
  timestamp: Date;
}

type ChatMessageProps = {
  message: Message;
};

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const Icon = isUser ? User : ChefHat; // Using ChefHat for bot icon

  const formatMultiLineText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index} className="block">
        {line}
      </span>
    ));
  };

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''} my-4`}>
      {!isUser && (
        <Avatar className="h-10 w-10 border border-primary/20">
           {/* Placeholder for bot image - can be customized */}
          <AvatarImage src="/placeholder-bot.jpg" alt="Recipe Bot" data-ai-hint="robot chef" />
          <AvatarFallback>
            <ChefHat className="text-primary" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-xl px-4 py-3 shadow-md ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card text-card-foreground'
        }`}
      >
        {typeof message.content === 'string' ? (
          <p className="text-sm whitespace-pre-line">{message.content}</p>
        ) : (
          // It's a SuggestRecipeOutput object
          <>
            {message.content.botMessage ? (
               <p className="text-sm whitespace-pre-line">{message.content.botMessage}</p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-accent" />
                  {message.content.recipeName}
                </h3>
                
                <div>
                  <h4 className="flex items-center text-md font-medium mb-1">
                    <ShoppingBasket className="h-5 w-5 mr-2 text-accent/80" />
                    Ingredients:
                  </h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line pl-1">
                    {formatMultiLineText(message.content.ingredients)}
                  </div>
                </div>

                <div>
                  <h4 className="flex items-center text-md font-medium mb-1">
                    <ListOrdered className="h-5 w-5 mr-2 text-accent/80" />
                    Instructions:
                  </h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-line pl-1">
                     {formatMultiLineText(message.content.instructions)}
                  </div>
                </div>
                
                <div className="flex items-center text-sm font-medium pt-2">
                  <Flame className="h-5 w-5 mr-2 text-destructive" />
                  Total Calories: <span className="ml-1 font-bold text-primary">{message.content.totalCalories}</span>
                </div>
              </div>
            )}
          </>
        )}
         <p className={`text-xs mt-2 ${isUser ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground/70'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isUser && (
        <Avatar className="h-10 w-10 border border-secondary">
           {/* Placeholder for user image - can be customized */}
          <AvatarImage src="/placeholder-user.jpg" alt="User" data-ai-hint="person cooking" />
          <AvatarFallback>
            <User />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

export default ChatMessage;
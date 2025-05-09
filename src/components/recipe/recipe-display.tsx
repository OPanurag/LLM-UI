"use client";

import type { FC } from 'react';
import type { SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBasket, ListOrdered, Flame, AlertTriangle, Info } from 'lucide-react';

type RecipeDisplayProps = {
  recipe: SuggestRecipeOutput | null;
  isLoading: boolean;
  error: string | null;
};

const RecipeDisplay: FC<RecipeDisplayProps> = ({ recipe, isLoading, error }) => {
  if (isLoading) {
    return (
      <Card className="w-full mt-8 shadow-lg rounded-xl">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div>
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-full mb-1" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-6 w-1/3" />
        </CardFooter>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-8">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle>Error Generating Recipe</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!recipe) {
    return (
      <Card className="w-full mt-8 shadow-md rounded-xl bg-secondary/50 border-dashed">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-8">
            <Info className="h-12 w-12 mb-4 text-primary/70" />
            <p className="text-lg font-medium">Your recipe will appear here!</p>
            <p className="text-sm">Fill out the form above to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-8 shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-primary">{recipe.recipeName}</CardTitle>
        <CardDescription className="text-base">Here's a delicious recipe tailored for you!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="flex items-center text-xl font-semibold mb-2 text-foreground">
            <ShoppingBasket className="h-6 w-6 mr-2 text-accent" />
            Ingredients
          </h3>
          <ul className="list-disc list-inside pl-2 space-y-1 text-muted-foreground whitespace-pre-line">
            {recipe.ingredients.split('\n').map((item, index) => item.trim() && <li key={index}>{item.replace(/^- /, '')}</li>)}
          </ul>
        </div>
        <div>
          <h3 className="flex items-center text-xl font-semibold mb-2 text-foreground">
            <ListOrdered className="h-6 w-6 mr-2 text-accent" />
            Instructions
          </h3>
          <div className="space-y-2 text-muted-foreground whitespace-pre-line">
            {recipe.instructions.split('\n').map((step, index) => step.trim() && <p key={index}>{step}</p>)}
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 py-4 px-6 rounded-b-xl">
        <div className="flex items-center text-lg font-semibold text-foreground">
          <Flame className="h-6 w-6 mr-2 text-destructive" />
          Total Calories: <span className="ml-1 text-primary font-bold">{recipe.totalCalories}</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default RecipeDisplay;

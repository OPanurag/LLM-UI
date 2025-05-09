"use client";

import { useState } from 'react';
import Header from '@/components/layout/header';
import IngredientForm from '@/components/recipe/ingredient-form';
import RecipeDisplay from '@/components/recipe/recipe-display';
import { suggestRecipe, type SuggestRecipeInput, type SuggestRecipeOutput } from '@/ai/flows/suggest-recipe';
import { useToast } from "@/hooks/use-toast";


export default function HomePage() {
  const [recipeData, setRecipeData] = useState<SuggestRecipeOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSuggestRecipe = async (data: SuggestRecipeInput) => {
    setIsLoading(true);
    setError(null);
    setRecipeData(null);

    try {
      const result = await suggestRecipe(data);
      setRecipeData(result);
      toast({
        title: "Recipe Generated!",
        description: `Successfully found a recipe for "${result.recipeName}".`,
        variant: "default", // Use default for success, as there's no explicit success variant in shadcn default
      });
    } catch (e: any) {
      const errorMessage = e.message || "An unexpected error occurred. Please try again.";
      setError(errorMessage);
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
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-2xl flex-grow px-4 py-8 md:py-12">
        <div className="space-y-8">
          <IngredientForm onSubmit={handleSuggestRecipe} isLoading={isLoading} />
          <RecipeDisplay recipe={recipeData} isLoading={isLoading} error={error} />
        </div>
      </main>
      <footer className="py-6 text-center text-muted-foreground text-sm border-t border-border/50">
        <p>&copy; {new Date().getFullYear()} Green Recipe Genie. Powered by AI.</p>
      </footer>
    </div>
  );
}

"use client";

import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SuggestRecipeInput } from '@/ai/flows/suggest-recipe';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  ingredients: z.string().min(3, { message: "Please list at least one ingredient." }),
  maxCalories: z.coerce.number().min(1, { message: "Max calories must be a positive number." }).max(5000, { message: "Max calories seem too high." }),
  dietaryRestrictions: z.string().optional(),
});

type IngredientFormProps = {
  onSubmit: (data: SuggestRecipeInput) => Promise<void>;
  isLoading: boolean;
};

const IngredientForm: FC<IngredientFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: "",
      maxCalories: 500,
      dietaryRestrictions: "",
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    await onSubmit(values as SuggestRecipeInput); // Cast to SuggestRecipeInput to include dietaryRestrictions
  };

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Create Your Recipe</CardTitle>
        <CardDescription>Tell us what ingredients you have and your calorie goal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="ingredients-input" className="text-base">Available Ingredients</FormLabel>
                  <FormControl>
                    <Textarea
                      id="ingredients-input"
                      placeholder="e.g., chicken breast, broccoli, olive oil, garlic"
                      className="min-h-[100px] resize-y text-base"
                      {...field}
                      aria-describedby="ingredients-message"
                    />
                  </FormControl>
                  <FormMessage id="ingredients-message" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxCalories"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="maxCalories-input" className="text-base">Maximum Calories</FormLabel>
                  <FormControl>
                    <Input
                      id="maxCalories-input"
                      type="number"
                      placeholder="e.g., 500"
                      className="text-base"
                      {...field}
                      aria-describedby="maxCalories-message"
                    />
                  </FormControl>
                  <FormMessage id="maxCalories-message" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dietaryRestrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="dietaryRestrictions-input" className="text-base">Dietary Restrictions (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="dietaryRestrictions-input"
                      placeholder="e.g., vegan, gluten-free, low-carb"
                      className="text-base"
                      {...field}
                      aria-describedby="dietaryRestrictions-message"
                    />
                  </FormControl>
                  <FormMessage id="dietaryRestrictions-message" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full text-lg py-6 rounded-lg bg-primary hover:bg-primary/90">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Recipe...
                </>
              ) : (
                "Find Recipe"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default IngredientForm;

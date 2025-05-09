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
  ingredients: z.string().optional(),
  maxCalories: z.coerce.number().positive({ message: "Calories must be a positive number if provided." }).max(5000, { message: "Max calories seem too high." }).optional().or(z.literal('')),
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
      maxCalories: undefined, // Set to undefined so placeholder shows
      dietaryRestrictions: "",
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    const submitValues: SuggestRecipeInput = {};
    if (values.ingredients && values.ingredients.trim() !== "") {
      submitValues.ingredients = values.ingredients.trim();
    }
    if (values.maxCalories && values.maxCalories !== '') {
      submitValues.maxCalories = Number(values.maxCalories);
    }
    if (values.dietaryRestrictions && values.dietaryRestrictions.trim() !== "") {
      submitValues.dietaryRestrictions = values.dietaryRestrictions.trim();
    }
    await onSubmit(submitValues);
  };

  return (
    <Card className="w-full shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Discover Your Next Meal</CardTitle>
        <CardDescription>Provide any details below, or leave them blank for a surprise recipe!</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="ingredients-input" className="text-base">Available Ingredients (Optional)</FormLabel>
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
                  <FormLabel htmlFor="maxCalories-input" className="text-base">Maximum Calories (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      id="maxCalories-input"
                      type="number"
                      placeholder="e.g., 500"
                      className="text-base"
                      {...field}
                      onChange={(e) => {
                        if (e.target.value === "") {
                          field.onChange(""); // Allow empty string for optional field
                        } else {
                          const numValue = parseInt(e.target.value, 10);
                          field.onChange(isNaN(numValue) ? "" : numValue);
                        }
                      }}
                      value={field.value === undefined || field.value === null ? "" : field.value}
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

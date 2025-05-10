import { genkit, type GenkitErrorCode, type GenkitError } from 'genkit';

// If no other Genkit models/plugins are used, this can be simplified.
// The `ai` object is primarily for defining flows, prompts, tools with Genkit plugins.
// If `suggest-recipe.ts` no longer uses `ai.defineFlow` or `ai.definePrompt`,
// then `ai` object from `genkit` might not be directly used by that flow.
// However, other parts of the app or future flows might still use it.

export const ai = genkit({
  // plugins: [], // No googleAI plugin needed if all inference is external
  // model: '', // No default model needed if all inference is external
  // For this setup, Genkit might primarily be used for schema definition (zod)
  // and potentially flow orchestration if you had multiple steps or tools.
});

// Export error types for potential use in structured error handling.
export type { GenkitErrorCode, GenkitError };

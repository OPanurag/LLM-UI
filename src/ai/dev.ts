import { config } from 'dotenv';
config();

// The suggest-recipe flow is now primarily an HTTP client calling an external Python service.
// It doesn't need to be explicitly registered with Genkit dev server in the same way
// a native Genkit flow would. Genkit initialization still happens via `src/ai/genkit.ts`.
// import '@/ai/flows/suggest-recipe.ts'; 

// If you add other Genkit native flows or tools, import them here.
// For example:
// import '@/ai/flows/another-genkit-flow.ts';
// import '@/ai/tools/my-genkit-tool.ts';

console.log("Genkit development server starting. Note: 'suggest-recipe' now calls an external Python API.");

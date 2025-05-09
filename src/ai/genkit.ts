import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'meta/llama-3.2-3b-custom', // Updated to use the custom Llama model
});

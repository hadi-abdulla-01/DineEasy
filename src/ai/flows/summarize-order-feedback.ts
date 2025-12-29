'use server';
/**
 * @fileOverview Summarizes customer feedback for a specific order.
 *
 * - summarizeOrderFeedback - A function that summarizes the customer feedback.
 * - SummarizeOrderFeedbackInput - The input type for the summarizeOrderFeedback function.
 * - SummarizeOrderFeedbackOutput - The return type for the summarizeOrderFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeOrderFeedbackInputSchema = z.object({
  orderId: z.string().describe('The ID of the order to summarize feedback for.'),
  customerFeedback: z.string().describe('The customer feedback for the order.'),
});
export type SummarizeOrderFeedbackInput = z.infer<typeof SummarizeOrderFeedbackInputSchema>;

const SummarizeOrderFeedbackOutputSchema = z.object({
  summary: z.string().describe('A summary of the customer feedback.'),
});
export type SummarizeOrderFeedbackOutput = z.infer<typeof SummarizeOrderFeedbackOutputSchema>;

export async function summarizeOrderFeedback(input: SummarizeOrderFeedbackInput): Promise<SummarizeOrderFeedbackOutput> {
  return summarizeOrderFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeOrderFeedbackPrompt',
  input: {schema: SummarizeOrderFeedbackInputSchema},
  output: {schema: SummarizeOrderFeedbackOutputSchema},
  prompt: `Summarize the following customer feedback for order ID {{{orderId}}}.\n\nFeedback: {{{customerFeedback}}}`,
});

const summarizeOrderFeedbackFlow = ai.defineFlow(
  {
    name: 'summarizeOrderFeedbackFlow',
    inputSchema: SummarizeOrderFeedbackInputSchema,
    outputSchema: SummarizeOrderFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

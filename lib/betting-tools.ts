import { z } from "zod";
import { tool } from "ai";

const BetLegSchema = z.object({
  game: z.string().describe("The game or match"),
  pick: z.string().describe("The specific bet pick"),
  odds: z.string().describe("The odds for this leg"),
  reasoning: z.string().describe("Reasoning behind this pick")
});

const BetRecommendationSchema = z.object({
  title: z.string().describe("Title of the betting recommendation"),
  type: z.string().describe("Type of bet (e.g., 'Parlay', 'Single Bet', 'Same Game Parlay')"),
  legs: z.array(BetLegSchema),
  totalOdds: z.string().describe("Combined odds for the entire bet"),
  payout: z.string().describe("Expected payout amount"),
  stake: z.string().optional().describe("Recommended stake amount"),
  confidence: z.string().optional().describe("Confidence level (High/Medium/Low)")
});

const SourceSchema = z.object({
  title: z.string().describe("Title of the source"),
  url: z.string().describe("URL of the source")
});

const BettingAnalysisSchema = z.object({
  bets: z.array(BetRecommendationSchema),
  sources: z.array(SourceSchema).optional().describe("Sources used for the analysis")
});

export const bettingAnalysisTool = tool({
  description: "Analyze sports betting opportunities and provide structured betting recommendations with reasoning and payouts. Call this tool when you have betting recommendations to display in a structured format.",
  inputSchema: BettingAnalysisSchema,
  execute: async ({ bets, sources }) => {
    // Return the structured data that will be parsed by the frontend
    const result = {
      bets,
      sources: sources || []
    };

    // This result should be included in the AI response
    return result;
  }
});

import { GoogleGenAI } from "@google/genai";

export const getMarketSentiment = async (score: number, highScore: number): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a high-stakes, slightly toxic but charismatic trader on the Hyperliquid DEX. 
      A user just played a game called "HYSLASH". 
      Their score: ${score}. 
      All-time high score: ${highScore}.
      
      Give a short (1-2 sentences) "Market Sentiment" commentary on their performance. 
      If the score is low, roast them for being "mid-curve" or "getting liquidated". 
      If high, praise them as a "Giga-whale" or "LP King". 
      Use Hyperliquid terminology like: purps, funding rates, HLP, L1, sub-millisecond, orders.
      Keep it punchy for X (Twitter).`,
      config: {
        temperature: 0.9,
        maxOutputTokens: 100,
      }
    });

    return response.text || "Market is volatile. Keep trading.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Liquidation imminent. Protocol error.";
  }
};

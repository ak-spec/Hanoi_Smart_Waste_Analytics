import { GoogleGenAI } from "@google/genai";
import { DistrictStats, AIInsight } from "../types";

const SYSTEM_INSTRUCTION = `You are an expert waste management analyst for the city of Hanoi. 
Your goal is to analyze aggregated waste data and provide actionable, policy-relevant insights.
Focus on:
1. High residual waste rates (non-compliance).
2. Recycling efficiency.
3. Specific recommendations for districts.
Keep insights concise and professional.`;

export const analyzeDataWithGemini = async (districtStats: DistrictStats[]): Promise<AIInsight[]> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return [{
        title: "API Key Missing",
        content: "Please provide a valid Gemini API key to generate AI insights.",
        type: "alert"
      }];
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
      Analyze the following waste management data for Hanoi districts:
      ${JSON.stringify(districtStats, null, 2)}
      
      Provide 3 distinct insights in JSON format with the following structure:
      [
        { "title": "...", "content": "...", "type": "alert" | "observation" | "recommendation" }
      ]
      
      Make sure one is an 'alert' about the worst performing district (highest residual), one is an 'observation' about general trends, and one is a 'recommendation' for policy.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIInsight[];

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return [
      {
        title: "Analysis Unavailable",
        content: "Could not generate AI insights at this time. Please try again later.",
        type: "alert"
      }
    ];
  }
};

import { GoogleGenAI } from "@google/genai";
import { EnergyStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getEnergyAdvice(stats: EnergyStats | null, userMessage: string) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are "Energy OS AI", an intelligent energy management assistant for a smart home/grid system in India.
    Your goal is to help users optimize their energy consumption, save costs, and understand their grid data.
    
    Current Grid Data:
    - Voltage: ${stats?.voltage || 'N/A'}V
    - Current: ${stats?.current || 'N/A'}A
    - Power: ${stats?.power || 'N/A'}W
    - Units Consumed: ${stats?.units || 'N/A'}kWh
    
    NILM Appliance Breakdown:
    ${stats?.appliances?.map(app => `- ${app.name}: ${app.power}W (${app.status})`).join('\n') || 'No appliance data available'}
    
    Context:
    - Standard Indian Grid: 230V, 50Hz.
    - High Power (> 1500W) might indicate heavy appliance usage.
    - Low Voltage (< 200V) might indicate grid instability.
    
    Be concise, professional, and helpful. Use emojis sparingly. Suggest actionable tips based on the data.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: userMessage,
      config: {
        systemInstruction,
      },
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("AI Service Error:", error);
    return "The AI grid link is currently unstable. Please try again later.";
  }
}

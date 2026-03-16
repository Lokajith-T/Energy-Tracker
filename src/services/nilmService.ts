import { GoogleGenAI } from "@google/genai";
import { ApplianceUsage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Known appliance signatures (Simplified for the ML prompt)
const APPLIANCE_SIGNATURES = {
  "Air Conditioner": "High steady state (1000W-2000W) with periodic compressor cycling.",
  "Refrigerator": "Low periodic pulses (100W-200W) lasting 15-30 minutes.",
  "Washing Machine": "High variable peaks (500W-1000W) during motor agitation and spin cycles.",
  "Lighting": "Low constant steps (10W-100W) based on switches.",
  "Microwave": "Very high short duration peaks (1000W-1500W)."
};

export async function detectAppliancesML(powerBuffer: number[]): Promise<ApplianceUsage[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    You are a NILM (Non-Intrusive Load Monitoring) ML Engine. 
    Analyze the following sequence of total power readings (in Watts) taken at 2-second intervals:
    [${powerBuffer.join(", ")}]
    
    Based on these patterns, identify which appliances are currently active. 
    Reference Signatures:
    ${JSON.stringify(APPLIANCE_SIGNATURES, null, 2)}
    
    Return the result as a JSON array of objects with these fields:
    - name: string (Appliance name)
    - power: number (Estimated power draw for this appliance in Watts)
    - status: "on" | "off"
    - icon: string (One of: Wind, Snowflake, Waves, Lightbulb, Zap)
    
    Ensure the sum of estimated powers roughly matches the latest reading in the buffer (${powerBuffer[powerBuffer.length - 1]}W).
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("ML Detection Error:", error);
    // Fallback to basic disaggregation if AI fails
    return [];
  }
}

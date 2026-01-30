import { GoogleGenAI } from "@google/genai";
import { Manga } from "../types";

const API_KEY = process.env.API_KEY;
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

const MODEL_CHAT = "gemini-3-flash-preview";
const MODEL_REASONING = "gemini-3-flash-preview"; // Using flash for speed in this context

export const generateMangaRecommendation = async (
  userQuery: string,
  availableManga: Manga[]
): Promise<string> => {
  if (!ai) return "AI recommendations not available - API key not configured.";
  try {
    const mangaContext = availableManga
      .map((m) => `- ${m.title} (${m.genres.join(", ")}): ${m.description}`)
      .join("\n");

    const prompt = `
      You are an expert Manga Sommelier for a manga reading app.
      
      Here is the list of available manga in our library:
      ${mangaContext}

      User Query: "${userQuery}"

      Based on the user's query and the available library, recommend 1-2 titles from the list above. 
      Explain why you chose them enthusiastically. 
      If the user asks for something not in the list, politely suggest the closest match from the list.
      Keep it brief and engaging.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_CHAT,
      contents: prompt,
    });

    return response.text || "I couldn't find a perfect match, but take a look at our popular section!";
  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    return "My manga sensors are currently offline. Please try again later.";
  }
};

export const summarizeManga = async (manga: Manga): Promise<string> => {
  if (!ai) return "AI summary not available - API key not configured.";
  try {
    const prompt = `
      Provide a catchy, 2-sentence hook/summary for the following manga to get a new reader interested.
      Title: ${manga.title}
      Genres: ${manga.genres.join(", ")}
      Description: ${manga.description}
    `;

    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
    });

    return response.text || manga.description;
  } catch (error) {
    console.error("Gemini Summary Error:", error);
    return manga.description;
  }
};

export const explainChapter = async (chapterTitle: string, mangaTitle: string): Promise<string> => {
  if (!ai) return "AI explanation not available - API key not configured.";
  try {
      // Simulation of context since we don't have real chapter text
    const prompt = `
      The user is about to read "${chapterTitle}" of the manga "${mangaTitle}".
      Generate a vague, mysterious "Next Time on..." style teaser text (max 30 words) that hypes them up without spoiling specific plot points.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_CHAT,
      contents: prompt,
    });
    return response.text || "Prepare for an exciting chapter!";
  } catch (error) {
      return "Ready to read?";
  }
}

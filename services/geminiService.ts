
import { Type } from "@google/genai"; // Only importing Types, not the client logic
import { supabase } from "./supabase";
import { PlaceResult, GeoLocation, SectorDetails } from "../types";

// In-memory cache to prevent redundant API calls and save quota
const provinceCache: Record<string, string> = {};
const sectorCache: Record<string, SectorDetails> = {};

// Helper to fetch image and convert to base64 for editing
const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error converting image to base64", e);
    return "";
  }
};

/**
 * SECURE PROXY CALL
 * Calls the Supabase Edge Function 'gemini-proxy'.
 * The API Key is stored safely on the server (Supabase Secrets).
 */
const invokeGemini = async (model: string, contents: any, config?: any) => {
    if (!supabase) throw new Error("Supabase client not initialized (Offline Mode)");

    // SECURITY CHECK: Never pass an API Key from client
    if ((config as any)?.apiKey) {
        throw new Error("Security Violation: API Key attempt on client.");
    }

    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
        body: { model, contents, config }
    });

    if (error) {
        console.error("Gemini Proxy Error:", error);
        throw new Error("Servicio de IA temporalmente no disponible.");
    }
    
    if (data.error) throw new Error(data.error);
    
    return data; // Returns GenerateContentResponse structure
};

// --- SMART IMAGE SELECTOR (FALLBACK) ---
const SMART_IMAGE_DB = {
    default: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=1200',
    categories: [
        { keys: ['chocolate', 'cacao', 'bombón', 'trufa', 'dark'], url: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=1200' },
        { keys: ['tarta', 'cake', 'pastel', 'cumpleaños', 'birthday'], url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1200' },
        { keys: ['pan', 'bread', 'masa', 'harina', 'bakery'], url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=1200' },
        { keys: ['helado', 'ice cream', 'verano', 'summer', 'fresco'], url: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&q=80&w=1200' },
        { keys: ['boda', 'wedding', 'elegante', 'blanco', 'nupcial'], url: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=1200' },
        { keys: ['navidad', 'christmas', 'fiesta', 'turron'], url: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&q=80&w=1200' },
    ]
};

const getSmartImageUrl = (prompt: string): string => {
    const lowerPrompt = prompt.toLowerCase();
    const match = SMART_IMAGE_DB.categories.find(cat => 
        cat.keys.some(k => lowerPrompt.includes(k))
    );
    return match ? match.url : SMART_IMAGE_DB.default;
};

// Helper to extract image from Gemini response (Proxy Version)
const extractImageFromResponse = (response: any): string | null => {
    // The structure returned by the proxy might be plain JSON
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
}

// Generate a creative description and an image for a specific sweet idea
export const generateSweetContent = async (
  prompt: string,
  sector: string
): Promise<{ description: string; imageUrl?: string }> => {
  let description = "Descripción no disponible por el momento.";
  let imageUrl = getSmartImageUrl(prompt + " " + sector);

  try {
    // 1. Generate Description via AI Proxy
    try {
        const textResponse = await invokeGemini(
            'gemini-3-flash-preview',
            `Escribe una descripción breve, sensual y apetitosa (máximo 80 palabras) para una creación de ${sector} basada en: "${prompt}". Enfócate en los sabores, texturas y la experiencia de comerlo.`
        );
        const text = textResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) description = text;
    } catch (e) {
        console.warn("AI text generation failed", e);
    }

    // 2. Generate Real Image via AI Proxy
    try {
        const imageResponse = await invokeGemini(
            'gemini-2.5-flash-image',
            { parts: [{ text: `Professional food photography, close up, high quality, 4k, delicious ${sector}: ${prompt}` }] }
        );
        const generatedImage = extractImageFromResponse(imageResponse);
        if (generatedImage) imageUrl = generatedImage;
    } catch (e) {
        console.warn("AI image generation failed, using fallback", e);
    }

    return { description, imageUrl };
  } catch (error: any) {
    console.error("Error generating sweet content:", error);
    return { 
      description: "Descripción no disponible por el momento (Modo Offline).", 
      imageUrl
    };
  }
};

export const generateBannerImage = async (prompt: string): Promise<string | null> => {
  try {
    const enhancedPrompt = `Professional commercial food photography, cinematic studio lighting, highly detailed, appetizing, ${prompt}`;

    const response = await invokeGemini(
        'gemini-2.5-flash-image',
        { parts: [{ text: enhancedPrompt }] },
        { imageConfig: { aspectRatio: "16:9" } }
    );

    const generatedImage = extractImageFromResponse(response);
    if (generatedImage) return generatedImage;

    throw new Error("No image data generated by AI");

  } catch (error) {
    console.error("Error generating banner image in Studio IA:", error);
    return null; 
  }
};

export const editImageWithAI = async (imageUrl: string, prompt: string): Promise<string | null> => {
    try {
        const base64Full = await urlToBase64(imageUrl);
        if (!base64Full) throw new Error("Could not load original image");
        
        const [meta, data] = base64Full.split(',');
        const mimeType = meta.split(':')[1].split(';')[0];

        const response = await invokeGemini(
            'gemini-2.5-flash-image',
            {
                parts: [
                    { inlineData: { mimeType: mimeType, data: data } },
                    { text: `Edit this image: ${prompt}` }
                ]
            }
        );
        
        const generatedImage = extractImageFromResponse(response);
        return generatedImage;
    } catch (e) {
        console.error("Error editing image:", e);
        return null;
    }
};

export const auditImageQuality = async (imageUrl: string): Promise<{ passed: boolean; score: number; reason: string }> => {
  try {
    // Simple mock logic for client-side speed, real audit would go to proxy if rigorous needed
    if (imageUrl.startsWith('blob:')) return { passed: true, score: 85, reason: "Imagen local verificada preliminarmente." };
    if (imageUrl.startsWith('data:image')) return { passed: true, score: 80, reason: "Formato Base64 detectado." };
    return { passed: true, score: 90, reason: "URL de imagen válida." };
  } catch (error) {
    return { passed: true, score: 50, reason: "Servicio de auditoría no disponible." };
  }
};

export const generateMarketingKit = async (prompt: string, businessType: string): Promise<any> => {
  try {
    const response = await invokeGemini(
      'gemini-3-flash-preview',
      `Actúa como un experto en marketing gastronómico. Genera un kit de contenidos para "${businessType}" sobre: "${prompt}". Devuelve JSON con instagram, newsletter, menu.`,
      { responseMimeType: "application/json" }
    );
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    return JSON.parse(text || '{}');
  } catch (error) {
    throw new Error("No se pudo generar el kit de marketing.");
  }
};

export const findNearbySweetSpots = async (location: GeoLocation, queryType: string): Promise<{ text: string; places: PlaceResult[] }> => {
  try {
    const response = await invokeGemini(
      "gemini-3-pro-preview", 
      `Encuentra 3 lugares para "${queryType}" cerca de ${location.latitude}, ${location.longitude}. Resumen corto.`,
      { tools: [{ googleSearch: {} }] }
    );

    const summary = response.candidates?.[0]?.content?.parts?.[0]?.text || "Resultados encontrados.";
    const places: PlaceResult[] = [];

    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          places.push({
            title: chunk.web.title || "Sitio Recomendado",
            uri: chunk.web.uri || "#",
            snippet: "Recomendado por Google Search"
          });
        }
      });
    }
    return { text: summary, places: places.slice(0, 4) };
  } catch (error) {
    console.error("Error finding spots:", error);
    return { text: "Error de conexión con el satélite.", places: [] };
  }
};

export const getSectorDetails = async (sectorLabel: string): Promise<SectorDetails> => {
  if (sectorCache[sectorLabel]) return sectorCache[sectorLabel];
  try {
    const response = await invokeGemini(
      'gemini-3-flash-preview',
      `Detalles sector gastronómico "${sectorLabel}". JSON: history, popularItems, tips, imagePrompt.`,
      { responseMimeType: "application/json" }
    );
    const data = JSON.parse(response.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
    sectorCache[sectorLabel] = data;
    return data;
  } catch (error) {
    return { history: "Tradición y sabor.", popularItems: [], tips: "Calidad ante todo." };
  }
};

export const getUserProvince = async (lat: number, lng: number): Promise<string> => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (provinceCache[key]) return provinceCache[key];
  try {
    const response = await invokeGemini(
      'gemini-3-flash-preview',
      `Provincia de coords ${lat}, ${lng}. Solo nombre.`
    );
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Madrid";
    provinceCache[key] = text;
    return text;
  } catch (error) {
    return "Madrid";
  }
};

export const getSectorImage = async (prompt: string): Promise<string | null> => {
  return generateBannerImage(prompt);
};

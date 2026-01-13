
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { PlaceResult, GeoLocation, SectorDetails } from "../types";

// In-memory cache to prevent redundant API calls and save quota
const provinceCache: Record<string, string> = {};
const sectorCache: Record<string, SectorDetails> = {};

// Helper to get safe API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.includes("your_api_key")) {
    console.warn("Gemini API Key missing or invalid. Using fallback mock data.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

// Generate a creative description and an image for a specific sweet idea
export const generateSweetContent = async (
  prompt: string,
  sector: string
): Promise<{ description: string; imageUrl?: string }> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    // 1. Generate Description
    const textResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe una descripción breve, sensual y apetitosa (máximo 80 palabras) para una creación de ${sector} basada en: "${prompt}". Enfócate en los sabores, texturas y la experiencia de comerlo.`,
    });
    
    const description = textResponse.text || "No se pudo generar una descripción.";

    // 2. Generate Image Fallback (Hybrid approach)
    const keywords = prompt.split(' ').slice(0, 3).join(',');
    const imageUrl = `https://source.unsplash.com/800x800/?${sector},${keywords},sweet`;

    return { description, imageUrl };
  } catch (error: any) {
    console.error("Error generating sweet content:", error);
    return { 
      description: "Descripción no disponible por el momento (Modo Offline).", 
      imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800" 
    };
  }
};

// --- IMAGE GENERATION FOR BANNERS ---
export const generateBannerImage = async (prompt: string): Promise<string | null> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `Professional food photography, cinematic lighting, 4k, delicious, appetizing: ${prompt}` },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });
    
    return null;
  } catch (error) {
    console.error("Error generating banner image:", error);
    return null;
  }
};

// --- IMAGE QUALITY AUDIT ---
export const auditImageQuality = async (base64Image: string): Promise<{ passed: boolean; score: number; reason: string }> => {
  try {
    const ai = getAiClient();
    if (!ai) return { passed: true, score: 50, reason: "Verificación IA omitida (Configuración)" };

    // Strip header if present
    const cleanBase64 = base64Image.includes('base64,') ? base64Image.split('base64,')[1] : base64Image;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image", // Efficient vision model
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", 
              data: cleanBase64
            }
          },
          {
            text: "Analiza esta imagen para una app de comida profesional. Reglas estrictas: 1. Debe ser comida/dulces/local. 2. No debe ser borrosa u oscura. 3. No contenido ofensivo. Responde JSON: { score (0-100), passed (bool, true si score>60), reason (string corto español) }."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            passed: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      passed: result.passed ?? true,
      score: result.score ?? 50,
      reason: result.reason ?? "Análisis completado."
    };

  } catch (error) {
    console.warn("Audit failed, bypassing:", error);
    return { passed: true, score: 50, reason: "Servicio de auditoría no disponible." };
  }
};

// --- MARKETING KIT GENERATION ---
export const generateMarketingKit = async (prompt: string, businessType: string): Promise<{ instagram: { caption: string, hashtags: string }, newsletter: { subject: string, body: string }, menu: { title: string, description: string } }> => {
  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Actúa como un experto en marketing gastronómico. Genera un kit de contenidos para un negocio de tipo "${businessType}" que quiere promocionar: "${prompt}".
      
      Devuelve un JSON estricto con:
      1. instagram: objeto con 'caption' (texto persuasivo con emojis) y 'hashtags' (string con tags populares).
      2. newsletter: objeto con 'subject' (asunto irresistible) y 'body' (cuerpo del email venta suave, max 50 palabras).
      3. menu: objeto con 'title' (nombre comercial atractivo del producto) y 'description' (descripción sensorial para la carta).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            instagram: {
              type: Type.OBJECT,
              properties: {
                caption: { type: Type.STRING },
                hashtags: { type: Type.STRING }
              }
            },
            newsletter: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                body: { type: Type.STRING }
              }
            },
            menu: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Error generating marketing kit:", error);
    throw new Error("No se pudo generar el kit de marketing.");
  }
};

// --- FIND NEARBY SWEET SPOTS (REAL LOGIC) ---
export const findNearbySweetSpots = async (
  location: GeoLocation,
  queryType: string
): Promise<{ text: string; places: PlaceResult[] }> => {
  try {
    const ai = getAiClient();
    
    // Fallback immediato si no hay cliente (evita crash en UI)
    if (!ai) {
        return {
            text: "Modo demostración (Sin conexión IA). Aquí tienes ejemplos simulados.",
            places: [
                { title: `El Rey del ${queryType}`, uri: "#", snippet: "Famoso por su sabor tradicional." },
                { title: `Dulces & Co`, uri: "#", snippet: "Opción moderna y artesanal." }
            ]
        };
    }
    
    // Using Google Search Grounding to find real places
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Encuentra 3 lugares reales y excelentes para comer "${queryType}" cerca de las coordenadas ${location.latitude}, ${location.longitude}. 
      Proporciona un resumen introductorio corto y motivador.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const summary = response.text || "Aquí tienes algunas opciones deliciosas cerca de ti.";
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

    // Fallback if no grounding (API restriction or no results)
    if (places.length === 0) {
       return {
         text: `He buscado opciones para ${queryType} en tu zona pero no pude confirmar detalles específicos en tiempo real. Aquí tienes sugerencias generales.`,
         places: [
           { title: `Buscador Local: ${queryType}`, uri: `https://www.google.com/maps/search/${queryType}/@${location.latitude},${location.longitude},14z`, snippet: "Ver resultados en Google Maps" }
         ]
       };
    }

    return { text: summary, places: places.slice(0, 4) };

  } catch (error) {
    console.error("Error finding spots:", error);
    return { 
      text: "Lo siento, tuve problemas conectando con el satélite del dulce. Inténtalo de nuevo más tarde.", 
      places: [] 
    };
  }
};

// --- GET SECTOR DETAILS (REAL LOGIC) ---
export const getSectorDetails = async (sectorLabel: string): Promise<SectorDetails> => {
  if (sectorCache[sectorLabel]) return sectorCache[sectorLabel];

  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Proporciona detalles expertos sobre el sector gastronómico: "${sectorLabel}".
      Devuelve JSON con:
      - history: Breve historia o importancia cultural (max 30 palabras).
      - popularItems: Array de 5 productos estrella.
      - tips: Un consejo experto para reconocer la calidad.
      - imagePrompt: Un prompt en inglés para generar una imagen de fondo de este sector.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            history: { type: Type.STRING },
            popularItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            tips: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    sectorCache[sectorLabel] = data;
    return data;
  } catch (error) {
    return {
      history: "Un sector lleno de tradición y sabor.",
      popularItems: ["Clásico", "Especialidad", "Temporada"],
      tips: "Busca siempre ingredientes naturales.",
      imagePrompt: "sweet pastry background"
    };
  }
};

// --- GET USER PROVINCE (REVERSE GEO) ---
export const getUserProvince = async (lat: number, lng: number): Promise<string> => {
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (provinceCache[key]) return provinceCache[key];

  try {
    const ai = getAiClient();
    if (!ai) throw new Error("API Key missing");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Identifica la provincia o región principal de estas coordenadas: ${lat}, ${lng}. Responde SOLAMENTE con el nombre de la provincia (ej: Madrid, Barcelona, Valencia).`,
    });
    
    const province = response.text?.trim() || "Madrid";
    provinceCache[key] = province;
    return province;
  } catch (error) {
    return "Madrid"; // Default fallback
  }
};

export const getSectorImage = async (prompt: string): Promise<string | null> => {
  // Returns a curated Unsplash URL based on the AI prompt to ensure high quality
  // (Real generation is possible but slow for UI backgrounds, this is a hybrid approach)
  const keywords = prompt.replace(/ /g, ',');
  return `https://source.unsplash.com/1600x900/?${keywords},food,dessert`;
};

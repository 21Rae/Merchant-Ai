import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedProductContent } from "../types";

// Helper to convert file to Base64
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const generateProductContent = async (
  imageFile: File | null,
  textInput: string
): Promise<GeneratedProductContent> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Schema definition for structured JSON output
  const schema = {
    type: Type.OBJECT,
    properties: {
      productName: {
        type: Type.STRING,
        description: "A professional, catchy, and clean name for the product."
      },
      shortDescription: {
        type: Type.STRING,
        description: "A 2-3 sentence engaging description suitable for social media captions."
      },
      longDescription: {
        type: Type.STRING,
        description: "A detailed paragraph highlighting features, benefits, and use cases."
      },
      suggestedPrice: {
        type: Type.STRING,
        description: "A suggested price range in Nigerian Naira (₦) based on Jumia Nigeria market rates (e.g., '₦15,000 - ₦20,000')."
      },
      seoKeywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Top 5-8 SEO keywords for search visibility."
      },
      hashtags: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "10-15 relevant and trending hashtags for Instagram/TikTok."
      },
      socialMediaPost: {
        type: Type.STRING,
        description: "A ready-to-post caption for Instagram/Facebook including emojis and hook."
      },
      targetAudience: {
        type: Type.STRING,
        description: "Brief description of who this product is for."
      }
    },
    required: [
      "productName",
      "shortDescription",
      "longDescription",
      "suggestedPrice",
      "seoKeywords",
      "hashtags",
      "socialMediaPost",
      "targetAudience"
    ]
  };

  const model = "gemini-2.5-flash"; // Using 2.5 flash as recommended for general tasks + speed

  const parts: any[] = [];

  // Add text prompt
  let promptText = "You are an expert e-commerce copywriter and sales strategist for the Nigerian market. Analyze the input (image and/or text) and generate a high-converting product listing.";
  
  if (textInput) {
    promptText += `\n\nUser provided context: "${textInput}". Use this context to refine the description.`;
  }
  
  if (!imageFile && !textInput) {
    throw new Error("Please provide an image or text description.");
  }

  parts.push({ text: promptText });

  // Add image if present
  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.push(imagePart);
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        systemInstruction: "You are MerchantAI, a helpful assistant for Nigerian small business owners. Your tone is professional, enthusiastic, and sales-oriented. Always format currency in Nigerian Naira (₦). Use Jumia Nigeria pricing as a benchmark for accuracy. Focus on benefits relevant to the local market.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");
    
    return JSON.parse(text) as GeneratedProductContent;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
};

export const generateLifestyleImage = async (
  originalImage: File | null,
  productName: string,
  description: string,
  editInstruction: string = ""
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-2.5-flash-image";

  const parts: any[] = [];
  
  // Construct a prompt for image generation/editing
  let promptText = `Create a high-quality, professional Instagram lifestyle photography shot for the product "${productName}". 
  Context/Description: ${description}. 
  The image should be aesthetically pleasing, bright, and suitable for social media marketing. 
  Aspect Ratio 1:1.`;

  if (editInstruction) {
      promptText += `\n\nIMPORTANT EDIT INSTRUCTION: ${editInstruction}. Modify the image to strictly follow this instruction (e.g., change color, background, or setting).`;
  }

  if (originalImage) {
    // If original image exists, use it as reference
    const imagePart = await fileToGenerativePart(originalImage);
    parts.push(imagePart);
    promptText += " preserve the key visual details of the product in the input image but place it in a better background/setting.";
  }

  parts.push({ text: promptText });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        // No responseMimeType/responseSchema for nano banana series
      }
    });

    // Iterate through parts to find the image
    const content = response.candidates?.[0]?.content;
    if (content?.parts) {
      for (const part of content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image generated by the model.");

  } catch (error) {
    console.error("Gemini Image Gen Error:", error);
    throw new Error("Failed to generate lifestyle image.");
  }
};
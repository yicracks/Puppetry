import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini API client lazily to avoid crashing on start if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Route: Generate Shadow Play Script
app.post("/api/script", async (req, res) => {
  try {
    const { theme, puppets } = req.body;
    if (!theme) {
      return res.status(400).json({ error: "Theme is required" });
    }

    const ai = getAiClient();
    const prompt = `你是一位精通中国传统文化和民间艺术的皮影戏大师兼编导。
请为我创作一出皮影大戏剧本，主题是：“${theme}”。
当前戏台备有的皮影道具或模板有：${puppets ? puppets.join("、") : "经典人物、灵犬、神龙、瑞虎"}。
请合理安排剧情，让这些角色参与互动。

剧本需要包含：
1. 剧目名称 (title)
2. 推荐背景画面描述 (backgroundDescription)
3. 出场皮影角色建议 (characters)
4. 剧目结构：3个简短且节奏明快的场景 (scenes)。每个场景需要：
   - 场景标题 (sceneTitle)
   - 旁白或舞台调度说明 (narration)
   - 角色精彩对话 (dialogs)

请以中文和极其优美的曲艺风格（如评书、鼓书或传统戏曲旁白风味）输出。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "backgroundDescription", "characters", "scenes"],
          properties: {
            title: { type: Type.STRING },
            backgroundDescription: { type: Type.STRING },
            characters: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["sceneTitle", "narration", "dialogs"],
                properties: {
                  sceneTitle: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  dialogs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["character", "lines"],
                      properties: {
                        character: { type: Type.STRING },
                        lines: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const scriptJson = response.text;
    res.setHeader("Content-Type", "application/json");
    res.send(scriptJson);
  } catch (error: any) {
    console.error("Error generating script:", error);
    res.status(500).json({ error: error.message || "Failed to generate script" });
  }
});

// Vite server integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

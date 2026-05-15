import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.post("/api/explain", async (req, res) => {
    const { input, isImage } = req.body;
    const model = "gemini-3-flash-preview";
    
    const prompt = `Analyze this input (which can be Python code or a description of a programming task/activity in Spanish or English). 
    
    If the input is a description of a task (enunciado), solve it by writing the complete and functional Python code first.
    If the input is an image, transcribe the code exactly (if it contains code) or solve the task described in it.

    Then, generate an ACADEMIC PRESENTATION SCRIPT in Spanish for this code. 
    Imagine you are presenting as a group in a class exhibition.
    
    The response must include:
    1. A CONCISE, DIRECT and technical explanation for every single line in Spanish. Be brief and avoid filler words.
    2. A HIGHLY ACCURATE simulation.
    3. A complete oral script (presentationScript) that:
       - Speaks on behalf of the group ("En nuestro grupo hemos desarrollado...", "Podemos observar...").
       - Explains line by line as part of a flow.
       - Connects each part naturally ("Luego procedemos a...", "Esta variable nos permite...", "Aquí conectamos con...").
       - Includes natural pauses and subtitles for sections (e.g., "[Pausa]", "### Sección: Inicialización").
       - Includes a general objective and a final conclusion.
    4. 3 suggestions for extending this code.
    
    Return the response as a JSON object matching the requested schema.`;

    const contents = isImage 
      ? { parts: [{ text: prompt }, { inlineData: input }] }
      : { parts: [{ text: prompt }, { text: input }] };

    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              code: { type: Type.STRING },
              objective: { type: Type.STRING },
              presentationScript: { type: Type.STRING },
              conclusion: { type: Type.STRING },
              explanations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    line: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                  },
                  required: ["line", "explanation"],
                },
              },
              simulatedOutput: { type: Type.STRING },
              possibleErrors: { type: Type.STRING },
              autocompleteSuggestions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }
              },
            },
            required: ["code", "explanations", "simulatedOutput", "presentationScript", "objective", "conclusion"],
          },
        },
      });

      const text = response.text;
      if (!text) throw new Error("No response from AI");
      
      res.json(JSON.parse(text));
    } catch (error) {
      console.error("Error explaining code:", error);
      res.status(500).json({ error: "Failed to explain code" });
    }
  });

  app.post("/api/instruction", async (req, res) => {
    const { code, instruction } = req.body;
    const model = "gemini-3-flash-preview";
    const prompt = `You are an expert Python developer. 
    Apply the following instruction to the provided Python code. 
    Modify the code correctly and return ONLY the resulting code. 
    Do NOT include any explanations, markdown markers, or extra text.

    Instruction: ${instruction}
    
    Code:
    ${code}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      res.send(response.text?.trim().replace(/```python|```/g, "") || code);
    } catch (error) {
      console.error("Error applying instruction:", error);
      res.status(500).send(code);
    }
  });

  app.post("/api/complete", async (req, res) => {
    const { code } = req.body;
    const model = "gemini-3-flash-preview";
    const prompt = `Based on this Python code, suggest exactly one single line (or the completion of the current line) to continue. 
    Return ONLY the suggested code string, nothing else. No markdown, no comments, just the code.

    Code:
    ${code}`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      res.send(response.text?.trim().replace(/```python|```/g, "") || "");
    } catch (error) {
      res.send("");
    }
  });

  app.post("/api/ask", async (req, res) => {
    const { code, question } = req.body;
    const model = "gemini-3-flash-preview";
    const prompt = `You are an expert Python tutor. Your goal is to provide high-quality, pedagogical, and accurate answers.
    Context Code:
    ${code}
    
    Question from student: ${question}
    
    Instructions:
    - Answer the question clearly, thoroughly and in Spanish.
    - If the student asks about a specific concept, explain it with simple analogies if necessary.
    - If they ask for a change, provide a clear explanation of how it would work.
    - Maintain a professional yet encouraging academic tone.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      res.send(response.text || "Lo siento, no pude procesar tu pregunta.");
    } catch (error) {
      console.error("Error asking question:", error);
      res.status(500).send("Error al procesar la pregunta.");
    }
  });

  app.post("/api/expand-line", async (req, res) => {
    const { code, line, currentExplanation } = req.body;
    const model = "gemini-3-flash-preview";
    const prompt = `Provide a DEEP, TECHNICAL and PEDAGOGICAL explanation for this specific line of Python code within its context.
    
    Context Code:
    ${code}
    
    Specific Line:
    ${line}
    
    Current Simple Explanation:
    ${currentExplanation}
    
    Task: Expand this into a thorough explanation (2-3 paragraphs) in Spanish. Explain hidden mechanisms, common pitfalls, or why the syntax is structured this way.`;

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      res.send(response.text || "No se pudo generar la expansión.");
    } catch (error) {
      console.error("Error expanding line:", error);
      res.status(500).send("Error al expandir la explicación.");
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

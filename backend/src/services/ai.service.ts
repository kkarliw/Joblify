type CVProfile = {
  headline: string;
  bio: string;
  skills: string[];
  experienceYears: number;
  recommendation: string;
};

const PROFILE_PROMPT = `
Eres un experto en recursos humanos. Analiza el siguiente texto de currículum y devuelve ÚNICAMENTE un JSON válido con esta estructura exacta:

{
  "headline": "Título profesional sugerido",
  "bio": "Resumen personal en PRIMERA PERSONA de 2-3 oraciones. Debe sonar natural y profesional, como si la persona se presentara. Ejemplo: 'Soy desarrolladora full stack con 5 años de experiencia creando aplicaciones web. Me apasiona el diseño de interfaces y la arquitectura escalable. He trabajado en startups tech liderando equipos de producto.'",
  "skills": ["Habilidad 1", "Habilidad 2", "Habilidad 3"],
  "experienceYears": 0,
  "recommendation": "Sugerencia breve de mejora"
}

Reglas CRÍTICAS:
- El bio DEBE estar en PRIMERA PERSONA (yo, me, mi, he trabajado, soy, etc.)
- Debe sonar personal y auténtico, no como descripción de tercera persona
- No uses markdown
- No agregues texto adicional
- Si falta información, usa valores vacíos o 0
`;

const safeJsonParse = (raw: string): CVProfile => {
  const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
  return JSON.parse(cleaned) as CVProfile;
};

const extractPdfText = async (pdfBuffer: Buffer): Promise<string> => {
  const pdfParseModule = await import("pdf-parse").catch(() => {
    throw new Error("Falta la dependencia pdf-parse. Ejecuta npm install en backend.");
  });

  const pdfParse = (
    (pdfParseModule as { default?: (buffer: Buffer) => Promise<{ text?: string }> }).default ||
    (pdfParseModule as unknown as (buffer: Buffer) => Promise<{ text?: string }>)
  );

  if (typeof pdfParse !== "function") {
    throw new Error("No se pudo inicializar pdf-parse correctamente.");
  }

  const result = await pdfParse(pdfBuffer);
  const text = (result.text || "").trim();

  if (!text) {
    throw new Error("No se pudo extraer texto del PDF. Si es un escaneo, prueba con un PDF digital.");
  }

  return text;
};

const extractWithOllama = async (pdfBuffer: Buffer): Promise<CVProfile> => {
  const baseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
  const model = process.env.OLLAMA_MODEL || "llama3.1:8b";
  const cvText = await extractPdfText(pdfBuffer);

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json",
      options: { temperature: 0.2 },
      prompt: `${PROFILE_PROMPT}\n\nTexto del CV:\n${cvText.slice(0, 15000)}`,
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama respondió ${response.status}: ${details}`);
  }

  const data = (await response.json()) as { response?: string };
  if (!data.response) {
    throw new Error("Ollama no devolvió contenido en la respuesta.");
  }

  return safeJsonParse(data.response);
};

const extractWithGemini = async (pdfBuffer: Buffer, mimeType: string): Promise<CVProfile> => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("No hay API Key de Gemini configurada.");
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai").catch(() => {
    throw new Error("Falta la dependencia @google/generative-ai. Ejecuta npm install @google/generative-ai en backend.");
  });

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const model = genAI.getGenerativeModel({ model: modelName });

  const documentPart = {
    inlineData: {
      data: pdfBuffer.toString("base64"),
      mimeType,
    },
  };

  const result = await model.generateContent([PROFILE_PROMPT, documentPart]);
  return safeJsonParse(result.response.text());
};

export const aiService = {
  async extractProfileFromCV(pdfBuffer: Buffer, mimeType: string = "application/pdf") {
    const provider = (process.env.AI_PROVIDER || "ollama").toLowerCase();

    try {
      if (provider === "gemini") {
        console.log("Analizando CV con Gemini...");
        return await extractWithGemini(pdfBuffer, mimeType);
      }

      console.log("Analizando CV con Ollama local...");
      return await extractWithOllama(pdfBuffer);
    } catch (error) {
      const details = (error as { message?: string })?.message || "Error desconocido";
      throw new Error(`Fallo al analizar el CV con IA (${provider}): ${details}`);
    }
  },
};

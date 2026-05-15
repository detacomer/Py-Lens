export interface CodeLineExplanation {
  line: string;
  explanation: string;
}

export interface ExplanationResponse {
  code: string;
  objective: string;
  presentationScript: string;
  conclusion: string;
  explanations: CodeLineExplanation[];
  simulatedOutput: string;
  possibleErrors?: string;
  autocompleteSuggestions?: string[];
}

export async function explainPythonCode(
  input: string | { mimeType: string; data: string },
  isImage: boolean
): Promise<ExplanationResponse> {
  try {
    const response = await fetch("/api/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, isImage }),
    });
    
    if (!response.ok) throw new Error("Failed to call server API");
    return await response.json();
  } catch (error) {
    console.error("Error explaining code:", error);
    throw error;
  }
}

export async function applyCodeInstruction(code: string, instruction: string): Promise<string> {
  try {
    const response = await fetch("/api/instruction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, instruction }),
    });
    
    if (!response.ok) return code;
    return await response.text();
  } catch (error) {
    console.error("Error applying instruction:", error);
    return code;
  }
}

export async function getCodeCompletion(code: string): Promise<string> {
  try {
    const response = await fetch("/api/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) return "";
    return await response.text();
  } catch (error) {
    return "";
  }
}

export async function askQuestionAboutCode(code: string, question: string): Promise<string> {
  try {
    const response = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, question }),
    });
    
    if (!response.ok) return "Lo siento, hubo un error de conexión.";
    return await response.text();
  } catch (error) {
    console.error("Error calling ask API:", error);
    return "Error al conectar con el asistente.";
  }
}

export async function expandLineExplanation(code: string, line: string, currentExplanation: string): Promise<string> {
  try {
    const response = await fetch("/api/expand-line", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, line, currentExplanation }),
    });
    
    if (!response.ok) return "No se pudo conectar para expandir la explicación.";
    return await response.text();
  } catch (error) {
    console.error("Error calling expand API:", error);
    return "Error al expandir la explicación.";
  }
}

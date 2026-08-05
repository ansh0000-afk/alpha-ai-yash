/**
 * Helper client service to call server-side Gemini endpoints.
 */

export interface AnalyzeRequest {
  taskType: 'complex_reasoning' | 'code_analysis' | 'summarize' | 'fast_edit' | 'auto_category';
  text: string;
  context?: string;
}

export interface AnalyzeResponse {
  result: string;
  modelUsed: string;
}

/**
 * Perform content analysis, summarization, code editing or categorization using Gemini.
 */
export async function analyzeContent(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to analyze content');
  }

  return response.json();
}

/**
 * Generate a visual graphic or image prompt using Gemini Image generation.
 */
export async function generateImage(prompt: string, aspectRatio: string = '1:1'): Promise<string> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, aspectRatio })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate image');
  }

  const data = await response.json();
  return data.imageUrl;
}

/**
 * Request Text-To-Speech audio output from Gemini TTS model.
 */
export async function generateGeminiSpeech(text: string, voiceName: string = 'Kore'): Promise<string> {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to generate speech');
  }

  const data = await response.json();
  return data.audioData;
}

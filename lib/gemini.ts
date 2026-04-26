const getModel = () => process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash';
const getApiKey = () => {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
  return key;
};

function stripCodeFences(text: string): string {
  // Removes markdown code blocks like ```json ... ```
  let result = text.trim();
  if (result.startsWith('```')) {
    const firstNewline = result.indexOf('\n');
    if (firstNewline !== -1) {
      result = result.substring(firstNewline + 1);
    }
  }
  if (result.endsWith('```')) {
    const lastNewline = result.lastIndexOf('\n');
    if (lastNewline !== -1) {
      result = result.substring(0, lastNewline);
    } else {
      result = result.substring(0, result.length - 3);
    }
  }
  return result.trim();
}

export async function callGemini(systemPrompt: string, userText: string): Promise<string> {
  const model = getModel();
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return stripCodeFences(rawText);
}

export async function callGeminiChat(
  systemPrompt: string,
  context: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  newMessage: string
): Promise<string> {
  const model = getModel();
  const apiKey = getApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const messages = [
    // 1. Inject context
    { role: 'user', parts: [{ text: context }] },
    // 2. Model acknowledges
    { role: 'model', parts: [{ text: 'I have read the full study material and I am ready to help you.' }] },
    // 3. History
    ...history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    })),
    // 4. New message
    { role: 'user', parts: [{ text: newMessage }] },
  ];

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return rawText;
}
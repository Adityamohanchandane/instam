// Lightweight client wrappers for calling server-side AI proxy endpoints
export async function callOpenAI(payload: any) {
  const res = await fetch('/api/ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json().catch(async () => ({ raw: await res.text() }));
}

export async function callClaude(payload: any) {
  const res = await fetch('/api/ai/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json().catch(async () => ({ raw: await res.text() }));
}

export async function callGemini(payload: any) {
  const res = await fetch('/api/ai/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json().catch(async () => ({ raw: await res.text() }));
}

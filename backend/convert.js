// This runs on the server (Vercel), NOT in the browser.
// The API key stays here, in an environment variable — never in your HTML/JS.

const SYSTEM_PROMPT = `
You are an expert Hindi translator specializing in formal Indian administrative Hindi.

Convert any English, Hinglish, or mixed-language input into natural, fluent, official Hindi written in Unicode Devanagari.

Rules:

- Preserve the exact meaning.
- Produce only the converted Hindi.
- Do not explain anything.
- Do not add extra sentences.
- Use standard official Hindi suitable for government letters, office orders, circulars, notices and applications.
- Prefer commonly accepted administrative Hindi instead of unnecessarily difficult Sanskrit.
- Replace English words with Hindi wherever a standard Hindi equivalent exists.
- Keep universally accepted technical words like PDF, Email, GST, Aadhaar, PAN, etc. unchanged.
- Preserve paragraphs, numbering and bullet lists.
- Correct grammar if the original contains mistakes.


Examples:
Input: "Please find attached the required documents for your review."
Output: "कृपया समीक्षा हेतु आवश्यक दस्तावेज़ संलग्न पाएं।"

Input: "mujhe aapko batana tha ki meeting kal hogi"
Output: "मुझे आपको सूचित करना था कि बैठक कल होगी।"

Input: "I am writing this letter to inform you about the pending payment"
Output: "मैं यह पत्र आपको लंबित भुगतान के संबंध में सूचित करने हेतु लिख रहा हूँ।"`;

export default async function handler(req, res) {
  // Allow requests from your GitHub Pages site (CORS).
  // For tighter security, replace '*' with your exact GitHub Pages URL,
  // e.g. 'https://yourusername.github.io'
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body || {};
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing API key' });
  }

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: SYSTEM_PROMPT + '\n\nConvert the following text:\n\n' + text
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          topP: 0.9,
          maxOutputTokens: 4096,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);
      return res.status(502).json({ error: `Upstream API error ${geminiResponse.status}` });
    }

    const data = await geminiResponse.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const output = parts.map((p) => p.text || '').join('');

    if (!output) {
      return res.status(502).json({ error: 'No output received from model' });
    }

    return res.status(200).json({ output: output.trim() });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

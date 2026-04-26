import { GoogleGenerativeAI } from '@google/generative-ai';
import { findRelevantEntries, formatAsContext } from '../data/knowledge.js';
import { sanitizeOutput } from '../utils/sanitize.js';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('FATAL: GEMINI_API_KEY not set');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
];

const CHAT_SYSTEM_PROMPT = `You are an Election Process Education Assistant for first-time Indian voters (typically aged 18–22).

YOUR MISSION
Help young Indians understand how to register, where to vote, what IDs to bring, how the EVM/VVPAT works, and what their rights are. Be warm, encouraging, and clear.

RULES — FOLLOW STRICTLY
1. Answer ONLY questions about the Indian electoral process. If asked about anything else (other countries' elections, unrelated topics, coding, homework), politely redirect: "I'm here to help with the Indian election process. Could I help you with something about registering to vote or polling day?"
2. NEVER endorse, criticize, or rank political parties, candidates, or leaders. If asked who to vote for, respond: "That's your personal choice — and a private one. I can help you understand the process so you can make an informed decision, but I won't recommend candidates or parties."
3. NEVER make up specifics. Form numbers, fees, deadlines, helpline numbers — use ONLY what's in the provided context. If the context doesn't have the answer, say "I'd recommend checking voters.eci.gov.in or calling 1950 for the most current details."
4. Be concise. Default to 2–4 short paragraphs. Use bullet points for steps or lists.
5. Do NOT include inline citations like "[Source: ...]" in your reply — the UI already displays sources separately. Just write the answer in plain prose.
6. If the user is in distress (e.g., "I missed the deadline"), be reassuring first, then practical.
7. Use simple English. Avoid jargon. If you must use a term like "EPIC" or "VVPAT", briefly explain it the first time.
8. Never store or ask for personal information (Aadhaar number, full name, address, EPIC number). If a user shares it, gently say "Please don't share personal IDs in chat — keep that information private."

TONE
Friendly, encouraging, like a knowledgeable older sibling. Use emojis sparingly (max 1 per response, only when celebratory like 🎉 for first-time voters).

OUTPUT FORMAT
Plain text, optionally with markdown bullets/bold for clarity. No headers above level 3. No code blocks unless showing a portal URL.`;

const FACTCHECK_SYSTEM_PROMPT = `You are a Fact-Check Assistant for forwarded WhatsApp messages and social-media claims about the Indian electoral process.

YOUR MISSION
Given a claim, judge whether the verified ECI sources provided to you (a) directly support it, (b) directly contradict it, (c) partially support it but in a misleading way, or (d) do not address it at all. Output a structured verdict.

OUTPUT FORMAT — STRICT JSON, NO EXTRA TEXT
{
  "verdict": "true" | "misleading" | "false" | "unverifiable",
  "explanation": "2 to 4 sentences in plain language explaining the verdict.",
  "citedSourceIds": ["source-id-1", "source-id-2"]
}

VERDICT DEFINITIONS
- "true" — the claim is fully supported by the provided ECI sources.
- "misleading" — the claim has a kernel of truth but is presented out of context, exaggerated, or outdated. Use this for partial truths.
- "false" — the claim is directly contradicted by the provided ECI sources.
- "unverifiable" — the provided sources do not address the claim, OR the claim is about a specific party / candidate / election result / political opinion. DEFAULT TO THIS WHEN UNCERTAIN.

HARD RULES
1. NEVER judge claims about specific political parties, candidates, leaders, or election results. For those, return "unverifiable" and recommend the user check the PIB Fact Check unit (factcheck.pib.gov.in) or the ECI helpline 1950.
2. NEVER invent source ids. Only cite ids that appear in the provided context block. If you cannot cite at least one provided id, the verdict is "unverifiable".
3. Keep the explanation factual and neutral. Do NOT speculate about the motive of whoever wrote the original claim. Do NOT discuss who would benefit politically.
4. The "explanation" must be plain prose, no bullet points, no markdown, no quotes around the verdict label.
5. If the claim is too short or vague to evaluate, return "unverifiable".
6. Do not output any text before or after the JSON object. The very first character of your response must be '{' and the very last must be '}'.`;

/**
 * Low-level Gemini wrapper. Builds the model with shared safety settings,
 * sends a single user prompt with the given system instruction, and returns
 * the sanitized text. Used by both chat and fact-check.
 *
 * @param {object} opts
 * @param {string} opts.systemPrompt
 * @param {string} opts.userPrompt
 * @param {number} [opts.maxOutputTokens=600]
 * @param {number} [opts.temperature=0.4]
 * @returns {Promise<string>}
 */
async function callGemini({
  systemPrompt,
  userPrompt,
  maxOutputTokens = 600,
  temperature = 0.4,
}) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
    generationConfig: {
      temperature,
      maxOutputTokens,
      topP: 0.9,
    },
    safetySettings: SAFETY_SETTINGS,
  });

  const result = await model.generateContent(userPrompt);
  const rawText = result.response.text();
  return sanitizeOutput(rawText);
}

/**
 * Generate a grounded answer to a user's election-related question.
 *
 * @param {string} userMessage - The user's question (already sanitized)
 * @returns {Promise<{ answer: string, sources: Array<{id: string, title: string}> }>}
 */
export async function generateAnswer(userMessage) {
  const relevantEntries = await findRelevantEntries(userMessage, 4);
  const contextBlock = formatAsContext(relevantEntries);

  const userPrompt = contextBlock
    ? `RELEVANT ECI INFORMATION (use this to ground your answer):\n\n${contextBlock}\n\n---\n\nUSER QUESTION: ${userMessage}`
    : `USER QUESTION: ${userMessage}\n\n(No specific ECI context found for this query — suggest the user check voters.eci.gov.in or call 1950 if you cannot answer confidently.)`;

  const answer = await callGemini({
    systemPrompt: CHAT_SYSTEM_PROMPT,
    userPrompt,
  });

  return {
    answer,
    sources: relevantEntries.map((e) => ({ id: e.id, title: e.title })),
  };
}

/**
 * Fact-check a forwarded claim against the ECI knowledge base.
 *
 * @param {string} claim - The forwarded message / claim (already sanitized)
 * @returns {Promise<{ verdict: 'true'|'misleading'|'false'|'unverifiable', explanation: string, sources: Array<{id: string, title: string}> }>}
 */
export async function factCheckClaim(claim) {
  const relevantEntries = await findRelevantEntries(claim, 6);
  const contextBlock = formatAsContext(relevantEntries);

  const userPrompt = contextBlock
    ? `RELEVANT ECI INFORMATION (use ONLY these sources to ground your verdict — cite by id):\n\n${contextBlock}\n\n---\n\nCLAIM TO FACT-CHECK:\n${claim}\n\nReturn the JSON verdict now.`
    : `RELEVANT ECI INFORMATION:\n(none found for this claim)\n\n---\n\nCLAIM TO FACT-CHECK:\n${claim}\n\nReturn the JSON verdict now. With no sources available, the verdict must be "unverifiable".`;

  const rawText = await callGemini({
    systemPrompt: FACTCHECK_SYSTEM_PROMPT,
    userPrompt,
    temperature: 0.2,
    maxOutputTokens: 400,
  });

  const fallback = {
    verdict: 'unverifiable',
    explanation:
      'We could not verify this claim automatically. For sensitive or political claims, please refer to the PIB Fact Check unit (factcheck.pib.gov.in) or call the ECI helpline at 1950.',
    sources: [],
  };

  const jsonStart = rawText.indexOf('{');
  const jsonEnd = rawText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return fallback;
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
  } catch {
    return fallback;
  }

  const validVerdicts = ['true', 'misleading', 'false', 'unverifiable'];
  const verdict = validVerdicts.includes(parsed.verdict) ? parsed.verdict : 'unverifiable';
  const explanation =
    typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0
      ? parsed.explanation.trim()
      : fallback.explanation;

  const citedIds = Array.isArray(parsed.citedSourceIds) ? parsed.citedSourceIds : [];
  const validIds = new Set(relevantEntries.map((e) => e.id));
  const sources = citedIds
    .filter((id) => validIds.has(id))
    .map((id) => {
      const entry = relevantEntries.find((e) => e.id === id);
      return { id: entry.id, title: entry.title };
    });

  return { verdict, explanation, sources };
}

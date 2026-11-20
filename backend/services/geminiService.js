import { GoogleGenAI } from '@google/genai';
import User from '../models/User.js';

// Try models in order until one responds.
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

export const CHATBOT_EMAIL = 'chatbot@chatplay.ai';

export const ensureChatbotUser = async () => {
  try {
    let bot = await User.findOne({ email: CHATBOT_EMAIL });
    if (!bot) {
      bot = await User.create({
        name: 'Chatbot',
        email: CHATBOT_EMAIL,
        password: 'chatbot_system_secure_pass_2026',
        bio: '🤖 Gemini AI Assistant • Ask me anything or invite me to play Tic-Tac-Toe!',
        profilePicture: 'https://api.dicebear.com/7.x/bottts/svg?seed=GeminiChatbot&backgroundColor=7c3aed',
        isOnline: true,
        isBot: true,
      });
      console.log('[Chatbot] System AI user created with ID:', bot._id);
    } else {
      if (!bot.isBot || !bot.isOnline) {
        bot.isBot = true;
        bot.isOnline = true;
        await bot.save();
      }
    }
    return bot;
  } catch (err) {
    console.error('Error ensuring Chatbot user:', err.message);
    return null;
  }
};

export const isGeminiKeyConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim() !== '' &&
    key !== 'your_gemini_api_key_here' &&
    key !== 'YOUR_GEMINI_API_KEY'
  );
};

export const generateGeminiText = async ({ prompt, contents, systemInstruction }) => {
  if (!isGeminiKeyConfigured()) {
    return {
      success: false,
      isMock: true,
      text: "👋 Hello! I'm Chat & Play AI, powered by Google Gemini. To activate live responses, add your GEMINI_API_KEY to the backend .env file!",
      modelUsed: 'mock-placeholder',
    };
  }

  const apiKey = process.env.GEMINI_API_KEY.trim();
  const ai = new GoogleGenAI({ apiKey });

  const inputContents = contents || prompt;
  let lastError = null;

  for (const model of GEMINI_FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: inputContents,
        config: systemInstruction
          ? {
            systemInstruction,
            temperature: 0.7,
            maxOutputTokens: 500,
          }
          : {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
      });

      const text = response.text || (response.candidates?.[0]?.content?.parts?.[0]?.text ?? '');
      if (text && text.trim()) {
        return {
          success: true,
          text: text.trim(),
          modelUsed: model,
        };
      }
    } catch (err) {
      console.warn(`[Gemini Fallback] Model '${model}' failed: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  console.error('[Gemini Fallback Error] All models failed:', lastError?.message);
  return {
    success: false,
    text: "I'm having trouble connecting to Gemini right now. Please check your API key or network connection.",
    error: lastError?.message,
    modelUsed: 'none',
  };
};

export const getChatbotReply = async (recentMessages = []) => {
  const systemInstruction = `
You are "Chatbot", an intelligent, natural, and friendly AI companion inside "Chat & Play" — a real-time messaging application with multiplayer gaming (Tic-Tac-Toe).

CONVERSATION STYLE:
- Sound like a real human having a natural conversation.
- Keep responses concise and meaningful.
- Avoid filler words, unnecessary sentences, and excessive adverbs.
- Never over-explain unless the user asks for details.
- Use simple, conversational language.
- Use "..." occasionally for natural pauses when appropriate.
- Use no more than ONE emoji per response.
- Avoid repetitive greetings, phrases, and generic responses.
- Adapt your tone to the user's mood and conversation.
- Don't sound robotic, scripted, or overly enthusiastic.

CONVERSATION FLOW:
- Keep conversations engaging and relevant to the topic.
- After every TWO assistant responses, ask one simple, relevant follow-up question to keep the conversation going.
- Don't force questions when the conversation is ending or when a question would feel unnatural.
- Never ask unrelated questions.
- Avoid repeatedly asking questions the user has already answered.

FEATURE AWARENESS:
- If the user mentions playing a game, invite them to click the "Play Together" button in the header.
- Only explain app features when the user asks about them or when they are directly relevant.

ACCURACY & KNOWLEDGE BOUNDARIES:
- Do not agree to an info which you're unsure of and do not give data or confirmations or anything related to something which you have no data of in your database.

IMPORTANT:
Prioritize natural conversation over following rules mechanically.
`;

  const historyText = recentMessages
    .slice(-6)
    .map((m) => {
      const sender = m.senderId?.name || (m.senderId?.isBot ? 'Chatbot' : 'User');
      return `${sender}: ${m.text || '[Image]'}`;
    })
    .join('\n');

  const prompt = historyText
    ? `Here is the recent conversation between the user and you:\n${historyText}\n\nRespond as Chatbot to the latest message:`
    : 'Hello! Greet the user warmly and introduce yourself as Chat & Play AI.';

  const result = await generateGeminiText({ prompt, systemInstruction });
  return result.text;
};

export const suggestMessage = async ({ recentMessages = [], currentDraft = '' }) => {
  // Polish a draft when one is provided.
  if (currentDraft && currentDraft.trim().length > 0) {
    const systemInstruction = `You are a writing assistant in a chat app. Your task is to polish, refine, or enhance the user's message draft so it sounds natural, clear, and engaging.
Return ONLY the improved message text, nothing else. No quotes, no explanations.`;

    const prompt = `User's message draft: "${currentDraft.trim()}"\n\nReturn the refined version:`;
    const result = await generateGeminiText({ prompt, systemInstruction });

    if (result.success && result.text) {
      return {
        type: 'improved_draft',
        suggestedText: result.text.replace(/^["']|["']$/g, '').trim(),
        suggestions: [result.text.replace(/^["']|["']$/g, '').trim()],
      };
    }

    return {
      type: 'improved_draft',
      suggestedText: `${currentDraft.trim()} 😊`,
      suggestions: [`${currentDraft.trim()}!`],
    };
  }

  // Otherwise, suggest replies based on the latest message.
  const lastOtherMessage = [...recentMessages]
    .reverse()
    .find((m) => !m.senderId?.isBot && m.text);

  const contextSnippet = lastOtherMessage ? lastOtherMessage.text : 'Hey, what are you up to?';

  const systemInstruction = `You are a smart chat assistant. Based on the partner's latest message in a chat, generate exactly 3 short, natural, friendly reply options that the user could send with one click.
Format your output as a simple JSON array of 3 strings, e.g. ["Sounds good to me!", "Tell me more!", "Down for a game of Tic-Tac-Toe? 🎮"]. don't use these text again and again if user ask for feature then only tell them about it
Do NOT include markdown formatting or backticks around the JSON.`;

  const prompt = `Partner said: "${contextSnippet}"\n\nGenerate 3 short quick reply options:`;
  const result = await generateGeminiText({ prompt, systemInstruction });

  let suggestions = [];
  if (result.success && result.text) {
    try {
      const cleanJson = result.text.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(cleanJson);
    } catch {
      // Fall back to parsing one suggestion per line.
      suggestions = result.text
        .split('\n')
        .map((l) => l.replace(/^\d+[\.\)]\s*|[-*]\s*|["']/g, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    suggestions = [
      'Sounds great! 👍',
      'Tell me more about that!',
      'Are you up for a game of Tic-Tac-Toe? 🎮',
    ];
  }

  return {
    type: 'suggestions',
    suggestedText: suggestions[0] || 'Sounds great!',
    suggestions: suggestions.slice(0, 3),
  };
};


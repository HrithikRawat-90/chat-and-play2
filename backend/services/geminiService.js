import { GoogleGenAI } from '@google/genai';
import User from '../models/User.js';

// Fallback chain of modern Gemini models
// Primary: modern gemini-3.8-flash -> gemini-3.5-flash-lite -> gemini-3.1-flash-lite -> legacy fallbacks
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

export const CHATBOT_EMAIL = 'chatbot@chatplay.ai';

// Initialize or retrieve the system Chatbot user
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

// Check if a valid Gemini API key is configured
export const isGeminiKeyConfigured = () => {
  const key = process.env.GEMINI_API_KEY;
  return Boolean(
    key &&
    key.trim() !== '' &&
    key !== 'your_gemini_api_key_here' &&
    key !== 'YOUR_GEMINI_API_KEY'
  );
};

// Core text generator with automatic model fallback
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

  // Try each model in the fallback chain until one succeeds
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
      if (text) {
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

// Generate smart Chatbot reply based on conversation history
export const getChatbotReply = async (recentMessages = []) => {
  const systemInstruction = `You are "Chatbot", an intelligent, fun, and warm AI companion inside "Chat & Play" — a real-time messaging application with multiplayer gaming (Tic-Tac-Toe).
Keep your answers friendly, concise (1-3 sentences unless asked for more), formatting with markdown or emojis where appropriate.
If the user mentions playing a game, invite them to click the "Play Together" button in the header!`;

  // Format message history
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

// Generate message suggestions / AI write assistance
export const suggestMessage = async ({ recentMessages = [], currentDraft = '' }) => {
  // If the user has typed something, polish/enhance the draft
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

  // If input is empty, generate contextual reply suggestions based on the last message
  const lastOtherMessage = [...recentMessages]
    .reverse()
    .find((m) => !m.senderId?.isBot && m.text);

  const contextSnippet = lastOtherMessage ? lastOtherMessage.text : 'Hey, what are you up to?';

  const systemInstruction = `You are a smart chat assistant. Based on the partner's latest message in a chat, generate exactly 3 short, natural, friendly reply options that the user could send with one click.
Format your output as a simple JSON array of 3 strings, e.g. ["Sounds good to me!", "Tell me more!", "Down for a game of Tic-Tac-Toe? 🎮"].
Do NOT include markdown formatting or backticks around the JSON.`;

  const prompt = `Partner said: "${contextSnippet}"\n\nGenerate 3 short quick reply options:`;
  const result = await generateGeminiText({ prompt, systemInstruction });

  let suggestions = [];
  if (result.success && result.text) {
    try {
      const cleanJson = result.text.replace(/```json|```/g, '').trim();
      suggestions = JSON.parse(cleanJson);
    } catch {
      // Fallback parse lines
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


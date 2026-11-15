import Message from '../models/Message.js';
import {
  suggestMessage,
  generateGeminiText,
  isGeminiKeyConfigured,
  GEMINI_FALLBACK_MODELS,
} from '../services/geminiService.js';

// @desc    Get AI message suggestions or polish draft
// @route   POST /api/ai/suggest
// @access  Private
export const getMessageSuggestion = async (req, res) => {
  try {
    const { conversationId, draft = '', context = [] } = req.body;

    let recentMessages = context;
    if ((!recentMessages || recentMessages.length === 0) && conversationId) {
      recentMessages = await Message.find({ conversationId })
        .populate('senderId', 'name isBot')
        .sort({ createdAt: -1 })
        .limit(6);
      recentMessages.reverse();
    }

    const result = await suggestMessage({
      recentMessages,
      currentDraft: draft,
    });

    return res.status(200).json({
      success: true,
      ...result,
      isApiKeyConfigured: isGeminiKeyConfigured(),
    });
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI suggestion.',
      error: error.message,
    });
  }
};

// @desc    Get AI service status
// @route   GET /api/ai/status
// @access  Private
export const getAiStatus = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      isConfigured: isGeminiKeyConfigured(),
      models: GEMINI_FALLBACK_MODELS,
      activeModel: GEMINI_FALLBACK_MODELS[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI status.',
    });
  }
};


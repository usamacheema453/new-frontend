// services/chat.js
// Updated chat service with mood-based meme support

import { Platform, Alert } from 'react-native';

// Configuration
const API_BASE_URL = Platform.OS === 'web' 
  ? 'http://localhost:8000/api'  // Local development
  : 'https://your-api-domain.com/api';  // Production API

const API_ENDPOINTS = {
  message: '/chat/message',
  suggestion: '/chat/suggestion', 
  feedback: '/chat/thumbs',
  health: '/chat/health'
};

// Request timeout
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Helper function to create request with timeout
const createRequestWithTimeout = (url, options) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
    )
  ]);
};

// Enhanced error handler
const handleApiError = (error, context = '') => {
  console.error(`❌ API Error ${context}:`, error);
  
  if (error.message === 'Request timeout') {
    return {
      type: 'TIMEOUT',
      message: 'Request timed out. Please check your connection and try again.'
    };
  }
  
  if (error.message?.includes('quota') || error.message?.includes('429')) {
    return {
      type: 'QUERY_LIMIT', 
      message: 'Query limit reached. Please upgrade your plan to continue.'
    };
  }
  
  if (error.message?.includes('plan') || error.message?.includes('restriction')) {
    return {
      type: 'PLAN_RESTRICTION',
      message: 'This feature requires a higher plan. Please upgrade to access advanced capabilities.'
    };
  }
  
  return {
    type: 'GENERAL_ERROR',
    message: error.message || 'An unexpected error occurred. Please try again.'
  };
};

// Show user-friendly error messages
const showErrorMessage = (errorInfo) => {
  if (Platform.OS === 'web') {
    console.error('Chat Error:', errorInfo.message);
  } else {
    Alert.alert('Error', errorInfo.message);
  }
};

/**
 * 🎭 NEW: Send meme request with mood data
 */
export const sendMemeMessage = async ({
  message,
  memeData,
  userPlan = 'free',
  conversationHistory = [],
  conversationId = null,
  userId = 'anonymous'
}) => {
  try {
    console.log('🎭 Sending meme request:', { message, memeData, userPlan });

    const requestBody = {
      message: message || `Generate a ${memeData.mood} meme`,
      tool: 'meme',
      user_plan: userPlan,
      conversation_history: conversationHistory,
      attachments: [],
      conversation_id: conversationId,
      meme_data: {
        mood: memeData.mood,
        label: memeData.label,
        description: memeData.description
      }
    };

    console.log('🎭 Meme request body:', requestBody);

    const response = await createRequestWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.message}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Meme response received:', data);

    return {
      id: data.id || `meme_${Date.now()}`,
      content: data.content || `🎭 Generated ${memeData.mood} meme!`,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: {
        mood: memeData.mood,
        tool_used: 'meme',
        ...data.metadata
      }
    };

  } catch (error) {
    console.error('💥 Meme request failed:', error);
    const errorInfo = handleApiError(error, 'meme generation');
    
    // Don't show error popup, return fallback response
    return {
      id: `meme_error_${Date.now()}`,
      content: `🎭 **[MEME MODE - ${memeData.mood.toUpperCase()} FALLBACK]**

Having trouble generating your ${memeData.mood} meme right now, but here's some ${memeData.mood} energy for you!

${getMoodEmoji(memeData.mood)} ${getFallbackMemeText(memeData.mood)}

*I'll be back to full meme-generating power soon!*`,
      timestamp: new Date().toISOString(),
      metadata: {
        mood: memeData.mood,
        tool_used: 'meme',
        error: true,
        fallback: true
      }
    };
  }
};

// Helper functions for fallback memes
const getMoodEmoji = (mood) => {
  const emojis = {
    happy: '🎉😊🌟',
    sad: '😢💙🌧️', 
    neutral: '🤖⚖️📊'
  };
  return emojis[mood] || emojis.neutral;
};

const getFallbackMemeText = (mood) => {
  const texts = {
    happy: "Even when my circuits are down, I'm still excited to help! Your alarm system deserves all the joy! 🎊",
    sad: "I understand the technical struggles... We've all been there with troubleshooting. Let's work through this together. 💙",
    neutral: "Taking a methodical approach to your query. Professional and reliable, just like a good alarm system. 📋"
  };
  return texts[mood] || texts.neutral;
};

/**
 * Enhanced sendMessage with meme support
 */
export const sendMessage = async ({
  message,
  tool = null,
  userPlan = 'free',
  conversationHistory = [],
  attachments = [],
  conversationId = null,
  userId = 'anonymous',
  memeData = null  // 🎭 NEW: Add meme data support
}) => {
  try {
    // 🎭 Route meme requests to dedicated handler
    if (tool === 'meme' && memeData) {
      return await sendMemeMessage({
        message,
        memeData,
        userPlan,
        conversationHistory,
        conversationId,
        userId
      });
    }

    console.log('🚀 Sending message:', { message, tool, userPlan });

    const requestBody = {
      message,
      tool,
      user_plan: userPlan,
      conversation_history: conversationHistory,
      attachments,
      conversation_id: conversationId
    };

    // Add ninja context if ninja tool
    if (tool === 'ninja') {
      requestBody.ninja_context = {
        technical_context: '',
        exchange_context: conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        youtube_videos: [],
        alarm_context: null
      };
    }

    console.log('📤 Request body:', requestBody);

    const response = await createRequestWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.message}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Response received:', data);

    return {
      id: data.id || `msg_${Date.now()}`,
      content: data.content || 'Response received successfully',
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata || {}
    };

  } catch (error) {
    console.error('💥 Send message failed:', error);
    const errorInfo = handleApiError(error, 'message');
    
    // Re-throw for proper error handling in components
    throw new Error(errorInfo.message);
  }
};

/**
 * Enhanced sendSuggestionCard with meme support
 */
export const sendSuggestionCard = async ({
  cardId,
  cardTitle,
  userPlan = 'free',
  tool = null,
  conversationHistory = [],
  memeData = null  // 🎭 NEW: Add meme data support
}) => {
  try {
    console.log('🎯 Sending suggestion:', { cardId, cardTitle, tool, userPlan });

    const requestBody = {
      cardId,
      cardTitle,
      userPlan,
      tool,
      conversation_history: conversationHistory
    };

    // 🎭 Add meme data if meme tool
    if (tool === 'meme' && memeData) {
      requestBody.meme_data = {
        mood: memeData.mood,
        label: memeData.label,
        description: memeData.description
      };
    }

    // Add ninja context if ninja tool
    if (tool === 'ninja') {
      requestBody.ninja_context = {
        technical_context: '',
        exchange_context: conversationHistory.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n'),
        youtube_videos: [],
        alarm_context: null
      };
    }

    const response = await createRequestWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.suggestion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Suggestion response:', data);

    return {
      id: data.id || `sug_${Date.now()}`,
      content: data.content || `Response for: ${cardTitle}`,
      timestamp: data.timestamp || new Date().toISOString(),
      metadata: data.metadata || {}
    };

  } catch (error) {
    console.error('💥 Suggestion failed:', error);
    const errorInfo = handleApiError(error, 'suggestion');
    
    // Re-throw for proper error handling in components
    throw new Error(errorInfo.message);
  }
};

/**
 * Send feedback (thumbs up/down)
 */
export const sendFeedback = async ({
  messageId,
  feedbackType,
  conversationId = null,
  userPlan = 'free'
}) => {
  try {
    console.log('👍👎 Sending feedback:', { messageId, feedbackType });

    const response = await createRequestWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.feedback}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id: messageId,
        feedback_type: feedbackType,
        conversation_id: conversationId,
        user_plan: userPlan
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Feedback sent:', data);

    return {
      success: data.success || true,
      message: data.message || 'Feedback received'
    };

  } catch (error) {
    console.error('💥 Feedback failed:', error);
    // Don't throw for feedback errors, just log
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Handle plan restrictions and show appropriate upgrade prompts
 */
export const handlePlanRestriction = (error) => {
  const errorString = error.message || error.toString();
  
  if (errorString.includes('quota') || errorString.includes('429')) {
    return {
      type: 'QUERY_LIMIT',
      message: 'You have reached your query limit. Please upgrade to continue chatting.',
      action: 'upgrade'
    };
  }
  
  if (errorString.includes('plan') || errorString.includes('restriction')) {
    return {
      type: 'PLAN_RESTRICTION', 
      message: 'This feature requires a higher plan. Please upgrade to access advanced capabilities.',
      action: 'upgrade'
    };
  }
  
  if (errorString.includes('ninja') || errorString.includes('o3')) {
    return {
      type: 'PLAN_RESTRICTION',
      message: 'Ninja mode requires a premium plan. Upgrade to unlock O3 advanced reasoning.',
      action: 'upgrade'
    };
  }

  if (errorString.includes('meme') || errorString.includes('dalle')) {
    return {
      type: 'PLAN_RESTRICTION',
      message: 'Meme generation requires a premium plan. Upgrade to unlock DALL-E powered memes.',
      action: 'upgrade'
    };
  }
  
  return {
    type: 'GENERAL_ERROR',
    message: errorString,
    action: 'retry'
  };
};

/**
 * Check service health
 */
export const checkHealth = async () => {
  try {
    const response = await createRequestWithTimeout(`${API_BASE_URL}${API_ENDPOINTS.health}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('🏥 Health check:', data);

    return {
      status: data.status || 'unknown',
      ninja_available: data.ninja_mode_available || false,
      meme_available: data.meme_generation_available || false,  // 🎭 NEW
      dalle_available: data.dalle_available || false,  // 🎭 NEW
      fallback_active: data.fallback_active || false,
      timestamp: data.timestamp,
      supported_moods: data.meme_moods_supported || ['happy', 'sad', 'neutral']  // 🎭 NEW
    };

  } catch (error) {
    console.error('💥 Health check failed:', error);
    return {
      status: 'error',
      ninja_available: false,
      meme_available: false,
      dalle_available: false,
      fallback_active: true,
      error: error.message
    };
  }
};

// Export all functions
export default {
  sendMessage,
  sendMemeMessage,  // 🎭 NEW
  sendSuggestionCard,
  sendFeedback,
  handlePlanRestriction,
  checkHealth
};
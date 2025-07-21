// screens/ChatPage.js
// Enhanced with plan-based access control and INTEGRATED real-time scoring system
// FIXED: Tool deselection now works properly
// UPDATED: Enhanced microphone button behavior and G800 suggestion with plan-based access
// UPDATED: Integrated with SuperpowerAssistant backend API
// UPDATED: Added TypingIndicator integration
// NEW: Added MemeMode integration with mood-based meme generation
// FINAL: Complete implementation with DALL-E mood support
// 🎭 FIXED: Added meme image display functionality
// 🎯 NEW: Integrated real-time scoring system with animations

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Animated,
  Image,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// TTS Import
import * as Speech from 'expo-speech';

// API Integration Imports
import { 
  sendMessage, 
  sendSuggestionCard, 
  sendMemeMessage,  // 🎭 NEW: Mood-based meme function
  sendFeedback, 
  handlePlanRestriction 
} from '../services/chat';

// Icon imports
import {
  Shield,
  Send,
  Maximize2,
  Minimize2,
  Share,
  PanelLeftOpen,
  PanelLeftClose,
  ChevronRight,
  Zap,
  Settings,
  Edit3,
  Volume2,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Crown,
  Lock,
  MapPin,
  Sparkles,
} from 'lucide-react-native';

// Component imports
import CameraRecording from '../components/chatpage/CameraRecording';
import PlusButton from '../components/chatpage/PlusButton';
import ToolsButton from '../components/chatpage/ToolsButton';
import AttachmentDisplay from '../components/chatpage/AttachmentDisplay';
import Sidebar, { SIDEBAR_WIDTH, COLLAPSED_SIDEBAR_WIDTH } from '../components/chatpage/Sidebar';
import UserAccount from '../components/chatpage/UserAccount';
import SubscriptionModal from '../components/SubscriptionModal';
import ShareChat from '../components/ShareChat';
import MessagesList from '../components/chatpage/MessagesList';
import WelcomePopup from '../components/WelcomePopup';
import TypingIndicator from '../components/chatpage/TypingIndicator';
import MemeMode from '../components/chatpage/MemeMode';

// 🎯 NEW: Scoring System Imports
import ScoringAnimationOverlay, { 
  useScoringManager, 
  ANIMATION_TYPES 
} from '../components/scoring/ScoringAnimationOverlay';

// Plan access control imports
import {
  hasFeatureAccess,
  getAvailableTools,
  getLockedTools,
  hasUnlimitedQueries,
  getQueryLimit,
  FEATURES,
  PLAN_INFO,
} from '../utils/planAccessManager';
import UpgradePrompt from '../components/UpgradePrompt';
import PlanLockedFeature from '../components/PlanLockedFeature';

export default function ChatPage({ userPlan = 'free', onUpgrade }) {
  // State variables
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [freeQueries, setFreeQueries] = useState(3);
  const [currentUserPlan, setCurrentUserPlan] = useState(userPlan);
  const [userRole, setUserRole] = useState('user');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('default');

  // Plan access control state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState(null);

  // Avatar dropdown
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Sidebar drawer (mobile)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Desktop sidebar state
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(SIDEBAR_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(SIDEBAR_WIDTH)).current;
  
  const sidebarRef = useRef(null);

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [inputHeight, setInputHeight] = useState(40);
  const [lineCount, setLineCount] = useState(1);
  
  // Tools state
  const [selectedTool, setSelectedTool] = useState(null); // 'ninja', 'meme', 'location', or null
  
  const [attachments, setAttachments] = useState([]);

  // Keyboard handling states
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const keyboardAnimation = useRef(new Animated.Value(0)).current;

  // Hover states for suggestion cards (desktop only)
  const [hoveredCard, setHoveredCard] = useState(null);

  // Message interaction states
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [editedMessages, setEditedMessages] = useState(new Set());
  const [copiedMessageId, setCopiedMessageId] = useState(null);

  // Thumbs up/down states
  const [thumbsUpMessages, setThumbsUpMessages] = useState(new Set());
  const [thumbsDownMessages, setThumbsDownMessages] = useState(new Set());

  // Enhanced keyboard handling states for message editing
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [editingMessageRef, setEditingMessageRef] = useState(null);

  // Add refs for better scroll control
  const editingTextInputRef = useRef(null);
  const messagePositions = useRef(new Map());

  // 🎯 NEW: Scoring System Refs
  const pointsScoreRef = useRef(null);
  const sendButtonRef = useRef(null);
  const memeButtonRef = useRef(null);

  const maxVisibleLines = 5;
  const lineHeight = 20;

  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const inputScrollRef = useRef(null);
  const isMobile = Dimensions.get('window').width < 768;
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  // Compute header padding
  const headerPaddingTop = Platform.OS === 'web' ? 12 : insets.top + 12;

  // Get plan information
  const planInfo = PLAN_INFO[currentUserPlan] || PLAN_INFO.free;
  const isUnlimitedPlan = hasUnlimitedQueries(currentUserPlan);
  const isTeamAdmin = userRole === 'team_admin' && currentUserPlan === 'team';
  const queryLimit = getQueryLimit(currentUserPlan);

  // Get available and locked tools based on plan
  const availableTools = getAvailableTools(currentUserPlan);
  const lockedTools = getLockedTools(currentUserPlan);

  // 🎯 NEW: Scoring System Setup
  const getScoringTargetPosition = () => {
    if (isMobile) {
      // Mobile: target position in sidebar when it opens, or top-left area
      return { x: 50, y: 100 };
    } else {
      // Desktop: sidebar score position
      if (isCollapsed) {
        return { x: 140, y: 80 }; // Collapsed sidebar
      } else {
        return { x: 140, y: 80 }; // Full sidebar
      }
    }
  };

  const {
    animationRef,
    awardPoints,
    handlePointsAwarded,
    ScoringOverlay,
  } = useScoringManager(pointsScoreRef, getScoringTargetPosition());

  // 🎯 NEW: Helper function to get element position for animations
  const getElementPosition = (elementRef) => {
    if (!elementRef?.current) {
      // Default fallback positions
      if (isMobile) {
        return { x: Dimensions.get('window').width - 80, y: 60 };
      } else {
        return { x: Dimensions.get('window').width - 200, y: 60 };
      }
    }
    
    // For web, try to get actual button position
    if (Platform.OS === 'web' && elementRef.current.getBoundingClientRect) {
      try {
        const rect = elementRef.current.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } catch (error) {
        console.warn('Could not get element position:', error);
      }
    }
    
    // Mobile fallback or if getBoundingClientRect fails
    return isMobile 
      ? { x: Dimensions.get('window').width - 80, y: 60 }
      : { x: Dimensions.get('window').width - 200, y: 60 };
  };

  // Add helper function to get the last user message for the typing indicator
  const getLastUserMessage = () => {
    const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();
    return lastUserMessage?.content || '';
  };

  // 🎭 NEW: Function to render meme images in messages
  const renderMemeInMessage = (message) => {
    console.log('🎭 Checking message for meme:', {
      messageId: message.id,
      tool: message.tool,
      hasMemeData: !!message.memeData,
      hasBase64: !!message.memeData?.base64,
      hasMemeUrl: !!message.memeUrl,
      memeDataKeys: message.memeData ? Object.keys(message.memeData) : 'none'
    });

    // Check for both base64 and URL-based memes
    if (message.tool === 'meme' || message.memeData) {
      const hasBase64 = message.memeData?.base64;
      const hasMemeUrl = message.memeUrl || message.memeData?.image_url;
      
      if (hasBase64 || hasMemeUrl) {
        const imageSource = hasBase64 
          ? { uri: `data:image/png;base64,${message.memeData.base64}` }
          : { uri: hasMemeUrl };

        return (
          <View style={styles.memeContainer}>
            <Text style={styles.memeHeader}>
              🎭 {message.memeData?.mood ? 
                `${message.memeData.mood.charAt(0).toUpperCase() + message.memeData.mood.slice(1)} Meme` : 
                'Generated Meme'}
            </Text>
            
            <Image
              source={imageSource}
              style={styles.memeImage}
              resizeMode="contain"
              onError={(error) => {
                console.log('🚨 Meme image error:', error);
                console.log('🚨 Failed image source:', imageSource);
              }}
              onLoad={() => console.log('✅ Meme image loaded successfully!')}
              onLoadStart={() => console.log('🔄 Meme image loading started...')}
            />
            
            {message.memeData?.mood && (
              <View style={styles.moodIndicator}>
                <Text style={styles.moodEmoji}>
                  {message.memeData.mood === 'happy' ? '😄' : 
                   message.memeData.mood === 'sad' ? '😢' : 
                   message.memeData.mood === 'angry' ? '😠' :
                   message.memeData.mood === 'surprised' ? '😲' :
                   message.memeData.mood === 'confused' ? '😕' : '😐'}
                </Text>
                <Text style={styles.moodLabel}>{message.memeData.mood}</Text>
              </View>
            )}
          </View>
        );
      }
    }
    return null;
  };

  // UPDATED: Enhanced suggestion cards with plan-based access control
  const allSuggestionCards = [
    {
      id: 'smartcom',
      title: 'SmartCom Not working',
      description: 'Troubleshoot connectivity issues',
      icon: Zap,
      iconColor: '#FFFFFF',
      iconBg: '#1F2937',
      requiredFeature: null, // Available to all plans
      availableForPlans: ['free', 'solo'], // Only show for free and solo users
    },
    {
      id: 'g800',
      title: 'How to default G800',
      description: 'Reset device to factory settings',
      icon: Settings,
      iconColor: '#FFFFFF',
      iconBg: '#1F2937',
      requiredFeature: null, // Available to all plans
      availableForPlans: ['free', 'solo', 'team', 'enterprise'], // Available to all plans
    },
    {
      id: 'location_check',
      title: 'Check site equipment status',
      description: 'Monitor equipment at specific locations',
      icon: MapPin,
      iconColor: '#FFFFFF',
      iconBg: '#1F2937',
      requiredFeature: null, // Available to all plans
      availableForPlans: ['team', 'enterprise'], // Only show for team and enterprise users
    },
  ];

  // UPDATED: Filter suggestion cards based on current user plan
  const getAccessibleSuggestionCards = (userPlan) => {
    return allSuggestionCards.filter(card => {
      // Check if card is available for current plan
      if (card.availableForPlans && !card.availableForPlans.includes(userPlan)) {
        return false;
      }
      
      // Check if user has access to required features (if any)
      if (card.requiredFeature && !hasFeatureAccess(userPlan, card.requiredFeature)) {
        return false;
      }
      
      return true;
    });
  };

  // UPDATED: Get cards that are locked for current plan (for upgrade prompts)
  const getLockedSuggestionCards = (userPlan) => {
    return allSuggestionCards.filter(card => {
      // Card is locked if it's not available for current plan OR requires a feature user doesn't have
      const planLocked = card.availableForPlans && !card.availableForPlans.includes(userPlan);
      const featureLocked = card.requiredFeature && !hasFeatureAccess(userPlan, card.requiredFeature);
      
      return planLocked || featureLocked;
    });
  };

  // Use the filtered cards
  const accessibleSuggestionCards = getAccessibleSuggestionCards(currentUserPlan);
  const lockedSuggestionCards = getLockedSuggestionCards(currentUserPlan);

  // Updated sidebar toggle function
  const handleSidebarToggle = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      if (sidebarRef.current) {
        sidebarRef.current.toggleSidebar();
        const newCollapsed = !isCollapsed;
        setIsCollapsed(newCollapsed);
        setSidebarWidth(newCollapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH);
      }
    }
  };

  // Handle restricted feature access
  const handleRestrictedFeature = (feature) => {
    setRestrictedFeature(feature);
    setShowUpgradePrompt(true);
  };

  // Handle upgrade action
  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradePrompt(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    } else {
      setShowSubscriptionModal(true);
    }
  };

  // FIXED: Enhanced tool selection handler with plan restrictions AND deselection support
  const handleToolSelect = (toolId) => {
    console.log('🔧 ChatPage: Tool selected →', toolId);
    
    // Handle deselection/clear - this is the missing functionality!
    if (toolId === null || toolId === 'clear' || toolId === undefined) {
      console.log('🔧 ChatPage: Clearing tool selection');
      setSelectedTool(null);
      return;
    }
    
    // Handle toggle behavior - if same tool is selected again, deselect it
    if (toolId === selectedTool) {
      console.log('🔧 ChatPage: Toggling off current tool');
      setSelectedTool(null);
      return;
    }
    
    // Check if tool is available for current plan
    const toolAvailable = availableTools.some(tool => tool.id === toolId);
    
    if (!toolAvailable) {
      // Tool is locked, show upgrade prompt
      const lockedTool = lockedTools.find(tool => tool.id === toolId);
      if (lockedTool) {
        if (toolId === 'ninja' || toolId === 'meme') {
          handleRestrictedFeature(toolId === 'ninja' ? FEATURES.NINJA_MODE : FEATURES.MEME_MODE);
        } else if (toolId === 'location') {
          handleRestrictedFeature(FEATURES.LOCATION_MODE);
        }
      }
      return;
    }
    
    // Tool is available, set it
    setSelectedTool(toolId);
  };

  // Get selected tool info for message processing
  const getSelectedToolInfo = () => {
    return availableTools.find(tool => tool.id === selectedTool);
  };

  // 🎭 UPDATED: Enhanced meme handler with improved debugging and image handling + SCORING
  const handleMemeSelect = async (memeData) => {
    console.log('🎭 Meme selected:', memeData);
    
    // Check query limits for non-unlimited plans
    if (!isUnlimitedPlan && freeQueries <= 0) {
      setShowSubscriptionModal(true);
      return;
    }

    const messageContent = `Generate a ${memeData.mood} meme`;
    
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      tool: 'meme',
      memeData: memeData,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('🚀 Sending meme request to SuperpowerAssistant...');
      
      // 🎭 NEW: Use the enhanced sendMemeMessage function
      const response = await sendMemeMessage({
        message: `Create a ${memeData.mood} meme based on our conversation`,
        memeData: {
          mood: memeData.mood,
          label: memeData.label,
          description: memeData.description
        },
        userPlan: currentUserPlan,
        conversationHistory: messages.slice(-5),
        conversationId: null,
        userId: userEmail || 'anonymous'
      });

      // 🔍 ENHANCED DEBUG LOGGING
      console.log('🎭 FULL RESPONSE:', JSON.stringify(response, null, 2));
      console.log('🎭 Response keys:', Object.keys(response));
      console.log('🎭 Metadata exists:', !!response.metadata);
      if (response.metadata) {
        console.log('🎭 Metadata keys:', Object.keys(response.metadata));
        console.log('🎭 Base64 exists:', !!response.metadata.base64);
        console.log('🎭 Base64 length:', response.metadata.base64?.length || 0);
        console.log('🎭 Image URL exists:', !!response.metadata.image_url);
        console.log('🎭 DALL-E generated:', response.metadata.dalle_generated);
      }

      const assistantMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
        tool: 'meme', // 🔧 IMPORTANT: Ensure tool is set for proper rendering
        memeUrl: response.metadata?.image_url, // If DALL-E generated an image
        memeData: {
          mood: memeData.mood,
          generated: response.metadata?.dalle_generated || false,
          base64: response.metadata?.base64 || null,
          image_url: response.metadata?.image_url || null
        }
      };

      console.log('🎭 Assistant message created:', {
        id: assistantMessage.id,
        tool: assistantMessage.tool,
        hasBase64: !!assistantMessage.memeData?.base64,
        hasImageUrl: !!assistantMessage.memeUrl,
        memeDataKeys: Object.keys(assistantMessage.memeData)
      });
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // 🎯 NEW: Award points for generating meme (+2 points)
      const sourcePosition = getElementPosition(memeButtonRef);
      awardPoints('GENERATE_MEME', sourcePosition);

      // Update query count for non-unlimited plans
      if (!isUnlimitedPlan) {
        const remaining = freeQueries - 1;
        setFreeQueries(remaining);
        await AsyncStorage.setItem('freeQueries', remaining.toString());
        if (remaining <= 0) {
          setTimeout(() => setShowSubscriptionModal(true), 1000);
        }
      }

      // 🎉 Success feedback
      if (Platform.OS !== 'web') {
        console.log(`✅ ${memeData.mood} meme generated successfully!`);
      }

    } catch (error) {
      console.error('💥 Meme Error:', error);
      setIsLoading(false);
      
      // Handle different error types
      const errorInfo = handlePlanRestriction(error);
      
      if (errorInfo.type === 'PLAN_RESTRICTION') {
        // Show upgrade prompt for meme feature
        handleRestrictedFeature(FEATURES.MEME_MODE);
      } else if (errorInfo.type === 'QUERY_LIMIT') {
        setShowSubscriptionModal(true);
      } else {
        // Show user-friendly error message
        if (Platform.OS === 'web') {
          console.error('Meme generation failed:', errorInfo.message);
        } else {
          Alert.alert(
            'Meme Generation Failed',
            errorInfo.message,
            [
              { text: 'Try Again', onPress: () => handleMemeSelect(memeData) },
              { text: 'OK', style: 'cancel' }
            ]
          );
        }
      }
    }
  };

  // NEW: Meme mode close handler
  const handleCloseMemeMode = () => {
    setSelectedTool(null);
  };

  // Handle text input content size change (for paste operations)
  const handleContentSizeChange = (event) => {
    if (event?.nativeEvent?.contentSize?.height) {
      const contentHeight = event.nativeEvent.contentSize.height;
      const calculatedLines = Math.max(1, Math.round((contentHeight - 20) / lineHeight));
      
      if (calculatedLines !== lineCount && calculatedLines >= 1 && calculatedLines <= 10) {
        setLineCount(calculatedLines);
      }
    }
  };

  // Enhanced text change handler for consistent typing/pasting behavior
  const handleInputChange = (text) => {
    setInput(text);
    
    if (!text || text.trim() === '') {
      setLineCount(1);
      return;
    }
    
    const actualLines = text.split('\n').length;
    const estimatedWrappedLines = Math.ceil(text.length / (isMobile ? 40 : 60));
    const totalLines = Math.max(actualLines, estimatedWrappedLines);
    const maxLines = isMobile ? 8 : 10;
    const newLineCount = Math.min(totalLines, maxLines);
    
    setLineCount(Math.max(1, newLineCount));
  };

  // Function to scroll to the currently edited message
  const scrollToEditedMessage = () => {
    if (editingMessageId && messagePositions.current.has(editingMessageId)) {
      const messagePosition = messagePositions.current.get(editingMessageId);
      if (messagePosition && scrollViewRef.current) {
        const screenHeight = Dimensions.get('window').height;
        const keyboardSpace = keyboardHeight + 20;
        const availableSpace = screenHeight - keyboardSpace - 100;
        const targetY = Math.max(0, messagePosition.y - availableSpace * 0.3);
        
        scrollViewRef.current?.scrollTo({
          y: targetY,
          animated: true,
        });
      }
    } else {
      const messageIndex = messages.findIndex(msg => msg.id === editingMessageId);
      if (messageIndex >= 0) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, messageIndex * 100),
            animated: true,
          });
        }, 100);
      }
    }
  };

  // Calculate input area height for proper spacing
  const getInputAreaHeight = () => {
    const baseInputHeight = Math.max(
      40,
      Math.min(lineCount * lineHeight + 20, maxVisibleLines * lineHeight + 20)
    );
    
    const buttonRowHeight = 48;
    const verticalPadding = 24;
    const wrapperMargin = 8;
    const bottomMargin = 16;
    
    return baseInputHeight + buttonRowHeight + verticalPadding + wrapperMargin + bottomMargin;
  };

  // Dynamic ScrollView padding calculation
  const getScrollViewPadding = () => {
    const inputAreaHeight = getInputAreaHeight();
    const messageActionIconsHeight = 15;
    const safetyMargin = 2;
    
    if (isEditingMessage && isKeyboardVisible) {
      return Math.max(keyboardHeight + 60, 180);
    } else if (isKeyboardVisible) {
      return inputAreaHeight + messageActionIconsHeight + safetyMargin;
    } else {
      return inputAreaHeight + messageActionIconsHeight + safetyMargin;
    }
  };

  // Enhanced keyboard event handling to support message editing
  useEffect(() => {
    if (!isMobile || isWeb) return;

    const keyboardWillShow = (e) => {
      const keyboardHeight = e.endCoordinates.height;
      setKeyboardHeight(keyboardHeight);
      setIsKeyboardVisible(true);
      
      Animated.timing(keyboardAnimation, {
        toValue: keyboardHeight,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start();

      if (isEditingMessage) {
        setTimeout(() => {
          scrollToEditedMessage();
        }, (e.duration || 250) + 50);
      } else {
        setTimeout(() => {
          if (messages.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, (e.duration || 250) + 100);
      }
    };

    const keyboardWillHide = (e) => {
      setIsKeyboardVisible(false);
      
      Animated.timing(keyboardAnimation, {
        toValue: 0,
        duration: e.duration || 250,
        useNativeDriver: false,
      }).start(() => {
        setKeyboardHeight(0);
      });
    };

    const keyboardDidShow = (e) => {
      if (!isEditingMessage) {
        setTimeout(() => {
          if (messages.length > 0) {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        }, 150);
      }
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showListener = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideListener = Keyboard.addListener(hideEvent, keyboardWillHide);
    const didShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);

    return () => {
      showListener?.remove();
      hideListener?.remove();
      didShowListener?.remove();
    };
  }, [isMobile, isWeb, keyboardAnimation, messages.length, isEditingMessage]);

  // FIXED WELCOME POPUP HANDLERS
  const handlePersonalize = () => {
    console.log('🎯 ChatPage: handlePersonalize called');
    console.log('🎯 Navigation object:', !!navigation);
    
    setShowWelcomePopup(false);
    
    // Small delay to ensure popup closes before navigation
    setTimeout(() => {
      // Log navigation state for debugging
      if (navigation.getState) {
        try {
          const state = navigation.getState();
          console.log('🎯 Navigation state:', state);
          console.log('🎯 Available routes:', state.routeNames || 'No routeNames found');
        } catch (stateError) {
          console.log('🎯 Could not get navigation state:', stateError);
        }
      }
      
      // FIXED: Try "Settings" first since that's what exists in your navigation stack
      const possibleRoutes = [
        'Settings',        // ✅ This is the correct route name from your logs
        'SettingsPage',    // Keep as fallback
        'SettingsScreen',
        'UserSettings',
        'ProfileSettings'
      ];
      
      let navigationSuccessful = false;
      
      for (const routeName of possibleRoutes) {
        try {
          console.log(`🎯 Attempting navigation to: ${routeName}`);
          navigation.navigate(routeName, { 
            initialSection: 'personalization' 
          });
          console.log(`✅ Successfully navigated to ${routeName}`);
          navigationSuccessful = true;
          break;
        } catch (error) {
          console.log(`❌ Failed to navigate to ${routeName}:`, error.message);
        }
      }
      
      // If navigation with parameters failed, try without parameters
      if (!navigationSuccessful) {
        for (const routeName of possibleRoutes) {
          try {
            console.log(`🎯 Trying ${routeName} without params`);
            navigation.navigate(routeName);
            console.log(`✅ Successfully navigated to ${routeName} (no params)`);
            navigationSuccessful = true;
            break;
          } catch (error) {
            console.log(`❌ Failed to navigate to ${routeName} (no params):`, error.message);
          }
        }
      }
      
      if (!navigationSuccessful) {
        console.warn('🎯 All navigation attempts failed');
        if (Platform.OS === 'web') {
          console.error('Unable to open personalization settings. Please ensure your navigation stack includes a Settings route.');
        } else {
          Alert.alert(
            'Navigation Error',
            'Unable to open personalization settings. Please ensure your navigation stack includes a Settings route.',
            [
              { text: 'OK' },
              { 
                text: 'Debug Info', 
                onPress: () => {
                  const debugInfo = `
Available navigation methods: ${navigation ? Object.keys(navigation).join(', ') : 'None'}

Available routes from your navigation: Settings, Chat, Admin, etc.

Attempted routes: ${possibleRoutes.join(', ')}

The route "Settings" exists in your navigation stack, so this should work now.`;
                  
                  Alert.alert('Debug Information', debugInfo, [{ text: 'OK' }]);
                }
              }
            ]
          );
        }
      }
    }, 150);
  };

  const handleStartChatting = () => {
    setShowWelcomePopup(false);
    // Optional: Welcome speech for new users
    if (!isWeb && Platform.OS !== 'web') {
      try {
        Speech.speak('Welcome to Super Engineer! How may I help you?', {
          language: 'en-US',
          pitch: 1.0,
          rate: 1.0,
        });
      } catch (speechError) {
        console.warn('Speech synthesis failed:', speechError);
      }
    }
  };

  const handleCloseWelcome = () => {
    setShowWelcomePopup(false);
  };

  // Handle thumbs up
  const handleThumbsUp = async (messageId) => {
    setThumbsUpMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        // Remove thumbs up if already liked
        newSet.delete(messageId);
      } else {
        // Add thumbs up and remove thumbs down if it exists
        newSet.add(messageId);
        setThumbsDownMessages(prevDown => {
          const newDownSet = new Set(prevDown);
          newDownSet.delete(messageId);
          return newDownSet;
        });
      }
      return newSet;
    });

    // Save to AsyncStorage for persistence
    try {
      const currentLikes = await AsyncStorage.getItem('thumbsUpMessages');
      const likesSet = currentLikes ? new Set(JSON.parse(currentLikes)) : new Set();
      
      if (likesSet.has(messageId)) {
        likesSet.delete(messageId);
      } else {
        likesSet.add(messageId);
        // Also remove from dislikes
        const currentDislikes = await AsyncStorage.getItem('thumbsDownMessages');
        const dislikesSet = currentDislikes ? new Set(JSON.parse(currentDislikes)) : new Set();
        dislikesSet.delete(messageId);
        await AsyncStorage.setItem('thumbsDownMessages', JSON.stringify([...dislikesSet]));
      }
      
      await AsyncStorage.setItem('thumbsUpMessages', JSON.stringify([...likesSet]));
    } catch (error) {
      console.warn('Error saving thumbs up state:', error);
    }
  };

  // Handle thumbs down
  const handleThumbsDown = async (messageId) => {
    setThumbsDownMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        // Remove thumbs down if already disliked
        newSet.delete(messageId);
      } else {
        // Add thumbs down and remove thumbs up if it exists
        newSet.add(messageId);
        setThumbsUpMessages(prevUp => {
          const newUpSet = new Set(prevUp);
          newUpSet.delete(messageId);
          return newUpSet;
        });
      }
      return newSet;
    });

    // Save to AsyncStorage for persistence
    try {
      const currentDislikes = await AsyncStorage.getItem('thumbsDownMessages');
      const dislikesSet = currentDislikes ? new Set(JSON.parse(currentDislikes)) : new Set();
      
      if (dislikesSet.has(messageId)) {
        dislikesSet.delete(messageId);
      } else {
        dislikesSet.add(messageId);
        // Also remove from likes
        const currentLikes = await AsyncStorage.getItem('thumbsUpMessages');
        const likesSet = currentLikes ? new Set(JSON.parse(currentLikes)) : new Set();
        likesSet.delete(messageId);
        await AsyncStorage.setItem('thumbsUpMessages', JSON.stringify([...likesSet]));
      }
      
      await AsyncStorage.setItem('thumbsDownMessages', JSON.stringify([...dislikesSet]));
    } catch (error) {
      console.warn('Error saving thumbs down state:', error);
    }
  };

  // Load user/auth data with welcome popup check
  useEffect(() => {
    async function loadData() {
      try {
        const auth = await AsyncStorage.getItem('isAuthenticated');
        const queries = await AsyncStorage.getItem('freeQueries');
        const plan = await AsyncStorage.getItem('userPlan');
        const role = (await AsyncStorage.getItem('userRole')) || 'user';
        const email = await AsyncStorage.getItem('userEmail');
        const name = await AsyncStorage.getItem('userName');
        const avatar = await AsyncStorage.getItem('userAvatar');
        
        // Check if user is new
        const isNewUser = await AsyncStorage.getItem('isNewUser');

        // Load thumbs up/down state
        const savedThumbsUp = await AsyncStorage.getItem('thumbsUpMessages');
        const savedThumbsDown = await AsyncStorage.getItem('thumbsDownMessages');

        if (!auth) {
          navigation.navigate('Login');
          return;
        }

        setIsAuthenticated(true);
        setFreeQueries(parseInt(queries || '3', 10));
        setCurrentUserPlan(plan || 'free');
        setUserRole(role);
        setUserEmail(email || 'user@example.com');
        setUserName(name || 'User');
        setSelectedAvatar(avatar || 'default');

        // Set thumbs state
        if (savedThumbsUp) {
          setThumbsUpMessages(new Set(JSON.parse(savedThumbsUp)));
        }

        if (savedThumbsDown) {
          setThumbsDownMessages(new Set(JSON.parse(savedThumbsDown)));
        }

        // Show welcome popup for new users
        if (isNewUser === 'true') {
          setShowWelcomePopup(true);
          // Mark user as no longer new
          await AsyncStorage.setItem('isNewUser', 'false');
        } else {
          // Only speak welcome for returning users
          if (!isWeb) {
            try {
              Speech.speak('Welcome Back! How may I help you?', {
                language: 'en-US',
                pitch: 1.0,
                rate: 1.0,
              });
            } catch (speechError) {
              console.warn('Speech synthesis failed:', speechError);
            }
          }
        }

        const history = await AsyncStorage.getItem('chatHistory');
        if (history) {
          setChatHistory(JSON.parse(history));
        }
      } catch (e) {
        console.warn('Error loading chat data:', e);
      }
    }
    loadData();
  }, [navigation, isWeb]);

  // Smart scroll when messages change
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Animate sidebar based on current width
  useEffect(() => {
    if (!isMobile) {
      Animated.timing(sidebarAnimation, {
        toValue: isDesktopSidebarOpen ? sidebarWidth : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isDesktopSidebarOpen, sidebarWidth, isMobile, sidebarAnimation]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if (isSpeaking) {
        Speech.stop();
      }
    };
  }, [isSpeaking]);

  // Cleanup message positions on unmount
  useEffect(() => {
    return () => {
      messagePositions.current.clear();
    };
  }, []);

  // DEBUG: Add debugging for desktop suggestion clicks
  useEffect(() => {
    if (Platform.OS === 'web') {
      console.log('🔍 ChatPage Debug Info:');
      console.log('- Platform:', Platform.OS);
      console.log('- isMobile:', isMobile);
      console.log('- isWeb:', isWeb);
      console.log('- allSuggestionCards:', allSuggestionCards.length);
      console.log('- accessibleSuggestionCards:', accessibleSuggestionCards.length);
      console.log('- currentUserPlan:', currentUserPlan);
      
      // Expose debug functions to browser console
      window.debugSuggestionClick = (cardTitle) => {
        console.log('🧪 Testing suggestion click:', cardTitle);
        handleSuggestionClick(cardTitle || 'SmartCom Not working');
      };
      
      window.debugState = () => {
        console.log('🧪 Current state:', {
          messages: messages.length,
          isLoading,
          currentUserPlan,
          freeQueries,
          isUnlimitedPlan,
          allSuggestionCards: allSuggestionCards.length,
          accessibleSuggestionCards: accessibleSuggestionCards.length
        });
      };
    }
  }, [allSuggestionCards, accessibleSuggestionCards, messages.length, currentUserPlan]);

  // Open sidebar function for mobile
  const openSidebar = () => {
    Keyboard.dismiss();
    setIsSidebarOpen(true);
  };

  // UPDATED: Simplified CameraRecording initialization
  const cameraRecording = CameraRecording({
    setInput,
    attachments,
    setAttachments,
    isMobile,
  });

  // Custom user account component
  const userAccount = UserAccount({
    isMenuOpen,
    setIsMenuOpen,
    showAvatarModal,
    setShowAvatarModal,
    selectedAvatar,
    setSelectedAvatar,
    userName,
    userEmail,
    navigation,
    openSidebar,
    isMobile,
    headerPaddingTop,
  });

  // Image upload handlers for PlusButton
  const handleImagePicked = (imageAsset) => {
    console.log('📸 ChatPage: Image picked from PlusButton:', imageAsset);
    
    const attachment = {
      uri: imageAsset.uri,
      type: 'image',
      mimeType: imageAsset.mimeType || 'image/jpeg',
      fileName: imageAsset.fileName || 'image.jpg',
      size: imageAsset.fileSize,
      width: imageAsset.width,
      height: imageAsset.height,
    };
    
    setAttachments(prev => [...prev, attachment]);
    
    if (Platform.OS !== 'web') {
      // Optional: Add haptic feedback here if needed
    }
  };

  const handleFilePicked = (fileAsset) => {
    console.log('📄 ChatPage: File picked from PlusButton:', fileAsset);
    
    const attachment = {
      uri: fileAsset.uri,
      type: fileAsset.mimeType && fileAsset.mimeType.startsWith('image/') ? 'image' : 'document',
      mimeType: fileAsset.mimeType,
      fileName: fileAsset.name,
      size: fileAsset.size,
    };
    
    setAttachments(prev => [...prev, attachment]);
  };

  // Add remove attachment handler
  const handleRemoveAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 🎯 UPDATED: Enhanced send message with REAL API integration, TypingIndicator support, and SCORING
  const handleSubmit = async () => {
    if (!input.trim() && attachments.length === 0) return;
    
    // Check query limits for non-unlimited plans
    if (!isUnlimitedPlan && freeQueries <= 0) {
      setShowSubscriptionModal(true);
      return;
    }

    const toolInfo = getSelectedToolInfo();
    let messageContent = input.trim() || (attachments.length > 0 ? 'Attachments sent' : '');
    
    // Add tool context to message if a tool is selected
    if (toolInfo) {
      messageContent = `[${toolInfo.name}] ${messageContent}`;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      attachments: attachments.length > 0 ? attachments : undefined,
      tool: selectedTool,
      image: attachments.find(att => att.type === 'image')?.uri,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setInputHeight(40);
    setLineCount(1);
    setAttachments([]);
    setIsLoading(true); // This will trigger the TypingIndicator

    try {
      console.log('🚀 Sending to SuperpowerAssistant...');
      
      // 🆕 REAL API CALL to your SuperpowerAssistant backend!
      const response = await sendMessage({
        message: input.trim() || 'Attachments sent',
        tool: selectedTool,
        userPlan: currentUserPlan,
        conversationHistory: messages.slice(-5), // Last 5 messages for context
        attachments: attachments,
        conversationId: null, // Add conversation ID if you want to track conversations
        userId: userEmail || 'anonymous'
      });

      const assistantMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false); // This will hide the TypingIndicator

      // 🎯 NEW: Award points for submitting prompt (+1 point)
      const sourcePosition = getElementPosition(sendButtonRef);
      awardPoints('SUBMIT_PROMPT', sourcePosition);

      // Update query count for non-unlimited plans
      if (!isUnlimitedPlan) {
        const remaining = freeQueries - 1;
        setFreeQueries(remaining);
        await AsyncStorage.setItem('freeQueries', remaining.toString());
        if (remaining <= 0) {
          setTimeout(() => setShowSubscriptionModal(true), 1000);
        }
      }

    } catch (error) {
      console.error('💥 Chat Error:', error);
      setIsLoading(false); // Hide TypingIndicator on error
      
      // Handle plan restrictions and errors
      const errorInfo = handlePlanRestriction(error);
      
      if (errorInfo.type === 'PLAN_RESTRICTION') {
        setShowUpgradePrompt(true);
      } else if (errorInfo.type === 'QUERY_LIMIT') {
        setShowSubscriptionModal(true);
      } else {
        // Show error message (already handled in sendMessage service)
        console.log('Error handled by service layer');
      }
    }
  };

  // 🎭 UPDATED: Enhanced suggestion click with meme support and random mood
  const handleSuggestionClick = async (cardOrString) => {
    console.log('🎯 handleSuggestionClick called with:', cardOrString);
    
    try {
      // Handle both card object and string inputs
      let card;
      if (typeof cardOrString === 'string') {
        card = allSuggestionCards.find(c => c.title === cardOrString || c.id === cardOrString);
        if (!card) {
          card = {
            id: 'generic',
            title: cardOrString,
            description: 'Generic suggestion',
            requiredFeature: null
          };
        }
      } else if (cardOrString && typeof cardOrString === 'object') {
        card = cardOrString;
      } else {
        console.error('🚨 Invalid card input:', cardOrString);
        return;
      }

      // Validate card object
      if (!card || !card.title) {
        console.error('🚨 Invalid card object:', card);
        return;
      }
      
      // Check if feature is restricted
      if (card.requiredFeature && !hasFeatureAccess(currentUserPlan, card.requiredFeature)) {
        handleRestrictedFeature(card.requiredFeature);
        return;
      }

      // Check query limits
      if (!isUnlimitedPlan && freeQueries <= 0) {
        setShowSubscriptionModal(true);
        return;
      }
      
      const toolInfo = selectedTool ? getSelectedToolInfo() : null;
      let messageContent = card.title || 'Suggestion clicked';
      
      if (toolInfo && toolInfo.name) {
        messageContent = `[${toolInfo.name}] ${messageContent}`;
      }
      
      const userMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent,
        tool: selectedTool || null,
        image: null,
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      let response;

      // 🎭 Handle meme suggestions with random mood
      if (selectedTool === 'meme') {
        const randomMoods = ['happy', 'sad', 'neutral'];
        const randomMood = randomMoods[Math.floor(Math.random() * randomMoods.length)];
        
        console.log(`🎭 Meme suggestion with random mood: ${randomMood}`);
        
        response = await sendSuggestionCard({
          cardId: card.id || 'generic',
          cardTitle: card.title,
          userPlan: currentUserPlan,
          tool: selectedTool,
          conversationHistory: messages.slice(-5),
          memeData: {
            mood: randomMood,
            label: randomMood.charAt(0).toUpperCase() + randomMood.slice(1),
            description: `Generate ${randomMood} memes`
          }
        });
      } else {
        // Regular suggestion handling
        response = await sendSuggestionCard({
          cardId: card.id || 'generic',
          cardTitle: card.title,
          userPlan: currentUserPlan,
          tool: selectedTool,
          conversationHistory: messages.slice(-5)
        });
      }

      const assistantMessage = {
        id: response.id,
        role: 'assistant',
        content: response.content,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // 🎯 NEW: Award points for submitting suggestion prompt (+1 point)
      // Note: Suggestions count as submitting prompts
      const sourcePosition = { x: Dimensions.get('window').width / 2, y: 200 }; // Center of suggestion cards area
      awardPoints('SUBMIT_PROMPT', sourcePosition);

      // Update query count for non-unlimited plans
      if (!isUnlimitedPlan) {
        const remaining = Math.max(0, freeQueries - 1);
        setFreeQueries(remaining);
        await AsyncStorage.setItem('freeQueries', remaining.toString());
        
        if (remaining <= 0) {
          setTimeout(() => setShowSubscriptionModal(true), 1000);
        }
      }
      
    } catch (error) {
      console.error('🚨 Error in handleSuggestionClick:', error);
      setIsLoading(false);
      
      const errorInfo = handlePlanRestriction(error);
      
      if (errorInfo.type === 'PLAN_RESTRICTION') {
        setShowUpgradePrompt(true);
      } else if (errorInfo.type === 'QUERY_LIMIT') {
        setShowSubscriptionModal(true);
      }
    }
  };

  // Updated handleEditMessage with keyboard awareness
  const handleEditMessage = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditingText(currentContent);
    setIsEditingMessage(true);
    setEditingMessageRef(messageId);
  };

  // Enhanced edit input changes with auto-resize
  const handleEditInputChange = (text) => {
    setEditingText(text);
  };

  // Add keyboard shortcuts for editing (only for web)
  const handleEditKeyPress = (e, messageId) => {
    if (Platform.OS === 'web') {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSaveEdit(messageId);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCancelEdit();
      }
    }
  };

  // Updated save edit to reset editing state
  const handleSaveEdit = async (messageId) => {
    if (!editingText.trim()) return;

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, content: editingText.trim() } : msg
      )
    );

    setEditedMessages((prev) => new Set([...prev, messageId]));

    setEditingMessageId(null);
    setEditingText('');
    setIsEditingMessage(false);
    setEditingMessageRef(null);

    Keyboard.dismiss();

    const messageIndex = messages.findIndex((msg) => msg.id === messageId);
    
    if (messageIndex >= 0) {
      setMessages((prev) => {
        const updatedMessages = prev.map((msg) =>
          msg.id === messageId ? { ...msg, content: editingText.trim() } : msg
        );
        return updatedMessages.slice(0, messageIndex + 1);
      });
      
      setIsLoading(true);
      
      setTimeout(async () => {
        const newAssistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Thanks for your updated message! We are working on it and soon your query solution will be available. Our AI system is currently being enhanced to provide you with the best engineering assistance.',
        };
        setMessages((prev) => [...prev, newAssistantMessage]);
        setIsLoading(false);
      }, 1500);
    }
  };

  // Updated cancel edit to reset editing state
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
    setIsEditingMessage(false);
    setEditingMessageRef(null);
    
    Keyboard.dismiss();
  };

  const handleCopyMessage = async (content, messageId) => {
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(content);
      } else {
        let copySuccess = false;
        
        try {
          const { setStringAsync } = require('expo-clipboard');
          await setStringAsync(content);
          copySuccess = true;
        } catch (expoError) {
          try {
            const Clipboard = require('@react-native-clipboard/clipboard');
            Clipboard.setString(content);
            copySuccess = true;
          } catch (clipboardError) {
            Alert.alert(
              'Copy Message', 
              content,
              [
                { text: 'Close', style: 'cancel' },
                { text: 'Copy Manually', onPress: () => console.log('Manual copy:', content) }
              ]
            );
            copySuccess = true;
          }
        }
      }
      
      setCopiedMessageId(messageId);
      
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
      
    } catch (error) {
      console.warn('Copy failed:', error);
      if (Platform.OS === 'web') {
        console.error('Unable to copy message. Please try again.');
      } else {
        Alert.alert('Copy Failed', 'Unable to copy message. Please try again.');
      }
    }
  };

  const handleSpeakMessage = (messageId, content) => {
    if (isSpeaking && speakingMessageId === messageId) {
      Speech.stop();
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    } else {
      if (isSpeaking) {
        Speech.stop();
      }
      
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
      
      Speech.speak(content, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
        onError: () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        },
      });
    }
  };

  const handleRegenerateResponse = async (userMessageId) => {
    const userMessageIndex = messages.findIndex((msg) => msg.id === userMessageId);
    
    if (userMessageIndex >= 0) {
      setMessages((prev) => prev.slice(0, userMessageIndex + 1));
      
      setIsLoading(true);
      
      setTimeout(async () => {
        const newAssistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content:
            'Here\'s a regenerated response! We are working on it and soon your query solution will be available. Our AI system is currently being enhanced to provide you with the best engineering assistance.',
        };
        setMessages((prev) => [...prev, newAssistantMessage]);
        setIsLoading(false);
      }, 1500);
    }
  };

  const getPlanDisplayName = (plan) => {
    return planInfo.displayName;
  };

  const getQueriesRemaining = () => {
    if (isUnlimitedPlan) return 'Unlimited queries';
    if (currentUserPlan === 'solo') return `${freeQueries} of ${queryLimit} queries remaining`;
    return `${freeQueries} queries remaining`;
  };

  // Render locked suggestion card
  const renderLockedSuggestionCard = (card) => {
    const IconComponent = card.icon;
    const requiredPlanInfo = PLAN_INFO[card.requiredPlan];
    
    return (
      <PlanLockedFeature
        key={card.id}
        feature={card.requiredFeature}
        userPlan={currentUserPlan}
        onUpgrade={handleUpgradeAction}
        lockStyle="overlay"
        lockPosition="center"
        style={styles.lockedSuggestionCard}
      >
        <TouchableOpacity
          style={[
            styles.suggestionCard,
            hoveredCard === card.id && styles.suggestionCardHovered,
          ]}
          onPress={() => handleSuggestionClick(card)}
          onMouseEnter={() => Platform.OS === 'web' && setHoveredCard(card.id)}
          onMouseLeave={() => Platform.OS === 'web' && setHoveredCard(null)}
        >
          <View style={[styles.suggestionIcon, { backgroundColor: card.iconBg }]}>
            <IconComponent size={20} color={card.iconColor} />
          </View>
          <View style={styles.suggestionContent}>
            <Text style={styles.suggestionTitle}>{card.title}</Text>
            <Text style={styles.suggestionDescription}>{card.description}</Text>
            <View style={styles.planRequirement}>
              <Crown size={12} color="#EF4444" />
              <Text style={styles.planRequirementText}>
                Requires {requiredPlanInfo.displayName}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </PlanLockedFeature>
    );
  };

  // Show loading screen if not authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* 🎯 NEW: Scoring Animation Overlay */}
      <ScoringOverlay />

      {isMobile ? (
        <>
          {/* Mobile Header */}
          <View style={[styles.mobileHeader, { paddingTop: headerPaddingTop }]}>
            {userAccount.renderAvatar()}
            <Text style={styles.headerTitleMobile}>Super Engineer</Text>
            <TouchableOpacity 
              onPress={() => setShowShareModal(true)} 
              style={[
                styles.shareButton,
                { opacity: messages.length === 0 ? 0.5 : 1 }
              ]}
              disabled={messages.length === 0}
            >
              <Share size={22} color={messages.length === 0 ? "#9CA3AF" : "#222"} />
            </TouchableOpacity>
          </View>

          {userAccount.renderDropdown()}

          {/* Main Container */}
          <View style={styles.mobileMainContainer}>
            <MessagesList
              // Message data
              messages={messages}
              setMessages={setMessages}
              isLoading={isLoading}
              
              // NEW: TypingIndicator props
              selectedTool={selectedTool}
              lastUserMessage={getLastUserMessage()}
              showTypingIndicator={isLoading}
              
              // Editing state
              editingMessageId={editingMessageId}
              setEditingMessageId={setEditingMessageId}
              editingText={editingText}
              setEditingText={setEditingText}
              editedMessages={editedMessages}
              setEditedMessages={setEditedMessages}
              isEditingMessage={isEditingMessage}
              setIsEditingMessage={setIsEditingMessage}
              editingMessageRef={editingMessageRef}
              setEditingMessageRef={setEditingMessageRef}
              
              // Message interactions
              copiedMessageId={copiedMessageId}
              setCopiedMessageId={setCopiedMessageId}
              isSpeaking={isSpeaking}
              setIsSpeaking={setIsSpeaking}
              speakingMessageId={speakingMessageId}
              setSpeakingMessageId={setSpeakingMessageId}
              
              // Thumbs up/down state
              thumbsUpMessages={thumbsUpMessages}
              setThumbsUpMessages={setThumbsUpMessages}
              thumbsDownMessages={thumbsDownMessages}
              setThumbsDownMessages={setThumbsDownMessages}
              
              // UI state
              isMobile={isMobile}
              isWeb={isWeb}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
              
              // User data
              userPlan={currentUserPlan}
              freeQueries={freeQueries}
              
              // UPDATED: Enhanced suggestion cards with plan-based restrictions
              suggestionCards={accessibleSuggestionCards}
              lockedSuggestionCards={lockedSuggestionCards}
              onSuggestionClick={handleSuggestionClick}
              renderLockedSuggestionCard={renderLockedSuggestionCard}
              
              // 🎭 NEW: Pass meme rendering function
              renderMemeInMessage={renderMemeInMessage}
              
              // Scroll management
              scrollViewRef={scrollViewRef}
              messagePositions={messagePositions}
              keyboardHeight={keyboardHeight}
              isKeyboardVisible={isKeyboardVisible}
              getScrollViewPadding={getScrollViewPadding}
              scrollToEditedMessage={scrollToEditedMessage}
              
              // Handlers
              onEditMessage={handleEditMessage}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onCopyMessage={handleCopyMessage}
              onSpeakMessage={handleSpeakMessage}
              onRegenerateResponse={handleRegenerateResponse}
              onEditInputChange={handleEditInputChange}
              onEditKeyPress={handleEditKeyPress}
              // Thumbs handlers
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              
              // Refs
              editingTextInputRef={editingTextInputRef}
            />

            {/* 🎭 UPDATED: Mobile Input Area with MemeMode integration */}
            {selectedTool === 'meme' ? (
              // MEME MODE: Show MemeMode component instead of regular input
              <View style={[
                styles.mobileInputArea,
                {
                  paddingBottom: Math.max(insets.bottom, 20),
                  zIndex: 10,
                }
              ]}>
                <MemeMode 
                  ref={memeButtonRef} // 🎯 NEW: Add ref for scoring animations
                  isMobile={true}
                  onMemeSelect={handleMemeSelect}
                  onClose={handleCloseMemeMode}
                  isLoading={isLoading}
                />
              </View>
            ) : (
              // REGULAR MODE: Show normal input interface
              <Animated.View 
                style={[
                  styles.mobileInputArea,
                  {
                    paddingBottom: Math.max(insets.bottom, 20),
                    transform: [{ translateY: keyboardAnimation.interpolate({
                      inputRange: [0, 1000],
                      outputRange: [0, -1000],
                      extrapolate: 'clamp',
                    })}],
                    zIndex: 10,
                  }
                ]}
              >
                {/* Show attachments inline */}
                <AttachmentDisplay 
                  attachments={attachments}
                  onRemove={handleRemoveAttachment}
                  isMobile={true}
                />

                <View style={styles.mobileInputWrapper}>
                  {!cameraRecording.isRecording ? (
                    <>
                      <View style={{ flex: 1, position: 'relative' }}>
                        <ScrollView
                          ref={inputScrollRef}
                          style={[
                            styles.mobileTextInputContainer,
                            {
                              height: Math.max(
                                40,
                                Math.min(
                                  lineCount * lineHeight + 20,
                                  maxVisibleLines * lineHeight + 20
                                )
                              ),
                            },
                          ]}
                          nestedScrollEnabled={true}
                          scrollEnabled={lineCount > maxVisibleLines}
                          showsVerticalScrollIndicator={lineCount > maxVisibleLines}
                        >
                          <TextInput
                            style={styles.mobileTextInput}
                            value={input}
                            onChangeText={handleInputChange}
                            onContentSizeChange={handleContentSizeChange}
                            placeholder={
                              !isUnlimitedPlan && freeQueries <= 0
                                ? 'Upgrade to continue chatting'
                                : attachments.length > 0
                                ? 'Add a message...'
                                : 'How may I help you?'
                            }
                            placeholderTextColor="#9CA3AF"
                            editable={
                              !(
                                (!isUnlimitedPlan && freeQueries <= 0) ||
                                isLoading
                              )
                            }
                            multiline
                            textAlignVertical="top"
                            scrollEnabled={false}
                            onFocus={() => {
                              setTimeout(() => {
                                if (messages.length > 0) {
                                  const scrollDelay = isKeyboardVisible ? 50 : 300;
                                  setTimeout(() => {
                                    scrollViewRef.current?.scrollToEnd({ animated: true });
                                  }, scrollDelay);
                                }
                              }, 50);
                            }}
                          />
                        </ScrollView>
                        {lineCount > 3 && input.trim() && (
                          <TouchableOpacity
                            style={styles.mobileExpandButton}
                            onPress={() => setIsFullScreen(true)}
                          >
                            <Maximize2 size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* 🎯 UPDATED: Mobile send/mic button logic with scoring ref */}
                      {input.trim() || attachments.length > 0 ? (
                        <TouchableOpacity
                          ref={sendButtonRef} // 🎯 NEW: Add ref for scoring animations
                          style={styles.mobileSendButton}
                          onPress={handleSubmit}
                          disabled={
                            (!isUnlimitedPlan && freeQueries <= 0) ||
                            isLoading
                          }
                        >
                          <Send size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                      ) : (
                        cameraRecording.renderMicButton(input, attachments.length > 0)
                      )}
                    </>
                  ) : (
                    cameraRecording.renderRecordingBar()
                  )}
                </View>

                {!cameraRecording.isRecording && (
                  <View style={styles.mobileButtonRow}>
                    <View style={styles.mobileLeftButtons}>
                      <View style={styles.plusButtonWrapper}>
                        <PlusButton 
                          isMobile={isMobile} 
                          onImagePicked={handleImagePicked}
                          onFilePicked={handleFilePicked}
                        />
                      </View>
                      <ToolsButton 
                        isMobile={true}
                        selectedTool={selectedTool}
                        onToolSelect={handleToolSelect}
                        userPlan={currentUserPlan}
                        availableTools={availableTools}
                        lockedTools={lockedTools}
                        onRestrictedAccess={handleRestrictedFeature}
                      />
                    </View>

                    <View style={styles.mobileRightButtons}>
                      {cameraRecording.renderCameraButton()}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}
          </View>

          {/* Mobile Drawer */}
          <Sidebar
            ref={sidebarRef}
            isMobile={isMobile}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
            chatHistory={chatHistory}
            messages={messages}
            setMessages={setMessages}
            setInput={setInput}
            setInputHeight={setInputHeight}
            setLineCount={setLineCount}
            setChatHistory={setChatHistory}
            userPlan={currentUserPlan}
            userRole={userRole}
            freeQueries={freeQueries}
            isUnlimitedPlan={isUnlimitedPlan}
            isTeamAdmin={isTeamAdmin}
            getPlanDisplayName={getPlanDisplayName}
            getQueriesRemaining={getQueriesRemaining}
            setShowSubscriptionModal={setShowSubscriptionModal}
            navigation={navigation}
            AsyncStorage={AsyncStorage}
            headerPaddingTop={headerPaddingTop}
            handleLogout={userAccount.handleLogout}
            goToSettings={userAccount.goToSettings}
            pointsScoreRef={pointsScoreRef} // 🎯 NEW: Pass scoring ref to sidebar
          />
        </>
      ) : (
        // Desktop Layout
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Sidebar */}
          <Animated.View
            style={[
              styles.desktopSidebarContainer,
              {
                width: sidebarAnimation,
                opacity: sidebarAnimation.interpolate({
                  inputRange: [0, COLLAPSED_SIDEBAR_WIDTH, SIDEBAR_WIDTH],
                  outputRange: [0, 1, 1],
                }),
              }
            ]}
          >
            {isDesktopSidebarOpen && (
              <Sidebar
                ref={sidebarRef}
                isMobile={isMobile}
                isSidebarOpen={true}
                setIsSidebarOpen={setIsSidebarOpen}
                chatHistory={chatHistory}
                messages={messages}
                setMessages={setMessages}
                setInput={setInput}
                setInputHeight={setInputHeight}
                setLineCount={setLineCount}
                setChatHistory={setChatHistory}
                userPlan={currentUserPlan}
                userRole={userRole}
                freeQueries={freeQueries}
                isUnlimitedPlan={isUnlimitedPlan}
                isTeamAdmin={isTeamAdmin}
                getPlanDisplayName={getPlanDisplayName}
                getQueriesRemaining={getQueriesRemaining}
                setShowSubscriptionModal={setShowSubscriptionModal}
                navigation={navigation}
                AsyncStorage={AsyncStorage}
                headerPaddingTop={headerPaddingTop}
                pointsScoreRef={pointsScoreRef} // 🎯 NEW: Pass scoring ref to sidebar
              />
            )}
          </Animated.View>

          {/* Main Chat Area */}
          <View style={[styles.mainArea, { flex: 1 }]}>
            {/* Desktop Header */}
            <View style={[
              styles.header, 
              { 
                paddingTop: headerPaddingTop,
              }
            ]}>
              <View style={styles.headerLeftSection}>
                <TouchableOpacity
                  style={styles.sidebarToggle}
                  onPress={handleSidebarToggle}
                >
                  {isCollapsed ? (
                    <PanelLeftOpen size={20} color="#000000" />
                  ) : (
                    <PanelLeftClose size={20} color="#000000" />
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.headerCenterSection}>
                <Text style={styles.headerTitle}></Text>
              </View>

              <View style={styles.headerRightSection}>
                <TouchableOpacity 
                  onPress={() => setShowShareModal(true)} 
                  style={[
                    styles.desktopShareButton,
                    messages.length === 0 && styles.desktopShareButtonDisabled
                  ]}
                  disabled={messages.length === 0}
                >
                  <Share size={18} color={messages.length === 0 ? "#6B7280" : "#000000"} />
                  <Text style={[
                    styles.desktopShareButtonText,
                    messages.length === 0 && styles.desktopShareButtonTextDisabled
                  ]}>Share</Text>
                </TouchableOpacity>
                
                <View style={styles.avatarContainer}>
                  {userAccount.renderAvatar()}
                </View>
              </View>
            </View>

            {userAccount.renderDropdown()}

            {/* Messages */}
            <MessagesList
              // Message data
              messages={messages}
              setMessages={setMessages}
              isLoading={isLoading}
              
              // NEW: TypingIndicator props
              selectedTool={selectedTool}
              lastUserMessage={getLastUserMessage()}
              showTypingIndicator={isLoading}
              
              // Editing state
              editingMessageId={editingMessageId}
              setEditingMessageId={setEditingMessageId}
              editingText={editingText}
              setEditingText={setEditingText}
              editedMessages={editedMessages}
              setEditedMessages={setEditedMessages}
              isEditingMessage={isEditingMessage}
              setIsEditingMessage={setIsEditingMessage}
              editingMessageRef={editingMessageRef}
              setEditingMessageRef={setEditingMessageRef}
              
              // Message interactions
              copiedMessageId={copiedMessageId}
              setCopiedMessageId={setCopiedMessageId}
              isSpeaking={isSpeaking}
              setIsSpeaking={setIsSpeaking}
              speakingMessageId={speakingMessageId}
              setSpeakingMessageId={setSpeakingMessageId}
              
              // Thumbs up/down state
              thumbsUpMessages={thumbsUpMessages}
              setThumbsUpMessages={setThumbsUpMessages}
              thumbsDownMessages={thumbsDownMessages}
              setThumbsDownMessages={setThumbsDownMessages}
              
              // UI state
              isMobile={isMobile}
              isWeb={isWeb}
              hoveredCard={hoveredCard}
              setHoveredCard={setHoveredCard}
              
              // User data
              userPlan={currentUserPlan}
              freeQueries={freeQueries}
              
              // UPDATED: Enhanced suggestion cards with plan-based restrictions
              suggestionCards={accessibleSuggestionCards}
              lockedSuggestionCards={lockedSuggestionCards}
              onSuggestionClick={handleSuggestionClick}
              renderLockedSuggestionCard={renderLockedSuggestionCard}
              
              // 🎭 NEW: Pass meme rendering function
              renderMemeInMessage={renderMemeInMessage}
              
              // Scroll management
              scrollViewRef={scrollViewRef}
              messagePositions={messagePositions}
              keyboardHeight={keyboardHeight}
              isKeyboardVisible={isKeyboardVisible}
              getScrollViewPadding={getScrollViewPadding}
              scrollToEditedMessage={scrollToEditedMessage}
              
              // Handlers
              onEditMessage={handleEditMessage}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onCopyMessage={handleCopyMessage}
              onSpeakMessage={handleSpeakMessage}
              onRegenerateResponse={handleRegenerateResponse}
              onEditInputChange={handleEditInputChange}
              onEditKeyPress={handleEditKeyPress}
              // Thumbs handlers
              onThumbsUp={handleThumbsUp}
              onThumbsDown={handleThumbsDown}
              
              // Refs
              editingTextInputRef={editingTextInputRef}
            />

            {/* 🎭 UPDATED: Desktop Input Area with MemeMode integration */}
            <View style={styles.desktopInputWrapper}>
              <View style={styles.desktopInputContainer}>
                {selectedTool === 'meme' ? (
                  // Show Meme Mode for desktop
                  <MemeMode 
                    ref={memeButtonRef} // 🎯 NEW: Add ref for scoring animations
                    isMobile={false}
                    onMemeSelect={handleMemeSelect}
                    onClose={handleCloseMemeMode}
                    isLoading={isLoading}
                  />
                ) : (
                  // Original desktop input area
                  <>
                    <AttachmentDisplay 
                      attachments={attachments}
                      onRemove={handleRemoveAttachment}
                      isMobile={false}
                    />
                    
                    <View style={styles.desktopInputBox}>
                      {!cameraRecording.isRecording ? (
                        <>
                          <View style={styles.desktopTextInputWrapper}>
                            <View style={styles.desktopInputInnerWrapper}>
                              <TextInput
                                style={[
                                  styles.desktopTextInput,
                                  Platform.OS === 'web' && { 
                                    outline: 'none',
                                    scrollbarWidth: 'thin',
                                    scrollbarColor: '#374151 #000000',
                                  },
                                  {
                                    height: Math.min(
                                      lineCount * lineHeight + 10,
                                      maxVisibleLines * lineHeight + 10
                                    ),
                                  }
                                ]}
                                value={input}
                                onChangeText={handleInputChange}
                                onContentSizeChange={handleContentSizeChange}
                                placeholder={
                                  !isUnlimitedPlan && freeQueries <= 0
                                    ? 'Upgrade to continue chatting'
                                    : attachments.length > 0
                                    ? 'Add a message...'
                                    : 'How may I help you?'
                                }
                                placeholderTextColor="#9CA3AF"
                                editable={
                                  !(
                                    (!isUnlimitedPlan && freeQueries <= 0) ||
                                    isLoading
                                  )
                                }
                                multiline
                                textAlignVertical="top"
                                scrollEnabled={lineCount > maxVisibleLines}
                                onSubmitEditing={(e) => {
                                  if (!e.nativeEvent.text.includes('\n')) {
                                    handleSubmit();
                                  }
                                }}
                                onFocus={() => {
                                  setTimeout(() => {
                                    if (messages.length > 0) {
                                      scrollViewRef.current?.scrollToEnd({ animated: true });
                                    }
                                  }, 300);
                                }}
                              />

                              {lineCount > 5 && input.trim() && (
                                <TouchableOpacity
                                  style={styles.desktopExpandButton}
                                  onPress={() => setIsFullScreen(true)}
                                >
                                  <Maximize2 size={16} color="#FFFFFF" />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* 🎯 UPDATED: Desktop send button - only show when there's input with scoring ref */}
                            {(input.trim() || attachments.length > 0) && (
                              <TouchableOpacity
                                ref={sendButtonRef} // 🎯 NEW: Add ref for scoring animations
                                style={[
                                  styles.desktopSendButton,
                                  styles.desktopSendButtonActive,
                                ]}
                                onPress={handleSubmit}
                                disabled={
                                  (!isUnlimitedPlan && freeQueries <= 0) ||
                                  isLoading ||
                                  (!input.trim() && attachments.length === 0)
                                }
                              >
                                <Send size={20} color="#000000" />
                              </TouchableOpacity>
                            )}
                          </View>

                          <View style={styles.desktopButtonRow}>
                            <View style={styles.desktopLeftButtons}>
                              <PlusButton 
                                isMobile={isMobile} 
                                onImagePicked={handleImagePicked}
                                onFilePicked={handleFilePicked}
                              />
                              <ToolsButton 
                                isMobile={false}
                                selectedTool={selectedTool}
                                onToolSelect={handleToolSelect}
                                userPlan={currentUserPlan}
                                availableTools={availableTools}
                                lockedTools={lockedTools}
                                onRestrictedAccess={handleRestrictedFeature}
                              />
                            </View>

                            <View style={styles.desktopRightButtons}>
                              {/* UPDATED: Desktop mic button - always visible, changes style based on input */}
                              {cameraRecording.renderMicButton(input, attachments.length > 0)}
                            </View>
                          </View>
                        </>
                      ) : (
                        cameraRecording.renderRecordingBar()
                      )}
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Avatar Selection Modal */}
      {userAccount.renderAvatarModal()}

      {/* Subscription Modal */}
      <SubscriptionModal
        visible={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        currentPlan={currentUserPlan}
      />

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={handleUpgradeAction}
        currentPlan={currentUserPlan}
        feature={restrictedFeature}
      />

      {/* Share Modal */}
      <ShareChat
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        messages={messages}
        chatTitle={(() => {
          const userMessage = messages.find((m) => m.role === 'user');
          const content = userMessage?.content;
          if (content && typeof content === 'string') {
            return content.slice(0, 50);
          }
          return 'Chat';
        })()}
      />

      {/* Full Screen Input Modal */}
      {isFullScreen && (
        <View style={styles.fullScreenOverlay}>
          <View style={styles.fullScreenContainer}>
            <View style={styles.fullScreenHeader}>
              <Text style={styles.fullScreenTitle}>Message</Text>
              <TouchableOpacity onPress={() => setIsFullScreen(false)}>
                <Minimize2 size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.fullScreenTextInput}
              value={input}
              onChangeText={setInput}
              placeholder="How may I help you?"
              multiline
              autoFocus
              textAlignVertical="top"
            />

            <View style={styles.fullScreenButtonRow}>
              <TouchableOpacity
                style={[
                  styles.fullScreenButton,
                  styles.fullScreenCancelButton,
                  { marginRight: 12 },
                ]}
                onPress={() => setIsFullScreen(false)}
              >
                <Text
                  style={[styles.fullScreenButtonText, styles.fullScreenCancelText]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fullScreenButton, styles.fullScreenSendButton]}
                onPress={() => {
                  handleSubmit();
                  setIsFullScreen(false);
                }}
                disabled={(!input.trim() && attachments.length === 0) || isLoading}
              >
                <Text
                  style={[styles.fullScreenButtonText, styles.fullScreenSendText]}
                >
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Welcome Popup */}
      <WelcomePopup
        visible={showWelcomePopup}
        onPersonalize={handlePersonalize}
        onStartChatting={handleStartChatting}
        onClose={handleCloseWelcome}
        userName={userName}
        navigation={navigation}
      />
    </View>
  );
}

// UPDATED: StyleSheet with enhanced meme display styles
const styles = StyleSheet.create({
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  mainArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  
  /* Mobile Layout */
  mobileMainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 5,
    position: 'relative',
  },
  
  mobileInputArea: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  
  /* Desktop Header Styles */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFE',
    zIndex: 5,
  },
  
  headerLeftSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerCenterSection: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  
  avatarContainer: {
    position: 'relative',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 2,
  },

  shareButton: {
    padding: 6,
    marginRight: 10,
    opacity: 1,
  },
  desktopShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  desktopShareButtonDisabled: {
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'default',
      },
    }),
  },
  desktopShareButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  desktopShareButtonTextDisabled: {
    color: '#6B7280',
  },
  desktopSidebarContainer: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    overflow: 'hidden',
  },
  sidebarToggle: {
    width: 36,
    height: 36,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  headerTitleMobile: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconMarginSmall: {
    marginRight: 6,
  },
  
  mobileInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  mobileTextInputContainer: {
    backgroundColor: '#000000',
    borderRadius: 24,
    marginRight: 8,
    minHeight: 40,
  },
  mobileTextInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingRight: 40,
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    minHeight: 40,
    ...Platform.select({
      web: {
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
    }),
  },
  mobileExpandButton: {
    position: 'absolute',
    right: 20,
    top: 10,
    padding: 4,
  },
  mobileSendButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  mobileButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mobileLeftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mobileRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plusButtonWrapper: {
    zIndex: 1,
  },
  
  /* Desktop Input */
  desktopInputWrapper: {
    backgroundColor: 'transparent',
    paddingVertical: 2,
    paddingHorizontal: 24,
  },
  desktopInputContainer: {
    maxWidth: 768,
    marginHorizontal: 'auto',
    width: '100%',
  },
  desktopInputBox: {
    backgroundColor: '#000000',
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    paddingBottom: 12,
    ...Platform.select({
      web: {
        '& *::-webkit-scrollbar': {
          width: '6px',
        },
        '& *::-webkit-scrollbar-track': {
          background: '#000000 !important',
        },
        '& *::-webkit-scrollbar-thumb': {
          background: '#374151 !important',
          borderRadius: '3px',
        },
        '& *::-webkit-scrollbar-thumb:hover': {
          background: '#4B5563 !important',
        },
        '& *::-webkit-scrollbar-corner': {
          background: '#000000 !important',
        },
      },
    }),
  },
  desktopTextInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  desktopInputInnerWrapper: {
    flex: 1,
    marginRight: 8,
    position: 'relative',
    ...Platform.select({
      web: {
        '& *::-webkit-scrollbar': {
          width: '6px',
        },
        '& *::-webkit-scrollbar-track': {
          background: '#000000',
        },
        '& *::-webkit-scrollbar-thumb': {
          background: '#374151',
          borderRadius: '3px',
        },
        '& *::-webkit-scrollbar-thumb:hover': {
          background: '#4B5563',
        },
      },
    }),
  },
  desktopTextInput: {
    fontSize: 16,
    lineHeight: 20,
    color: '#FFFFFF',
    paddingVertical: 5,
    paddingRight: 40,
    paddingLeft: 0,
    outline: 'none',
    outlineStyle: 'none',
    outlineWidth: 0,
    borderWidth: 0,
    maxHeight: 110,
    overflow: 'auto',
    ...Platform.select({
      web: {
        '::placeholder': {
          color: '#9CA3AF',
        },
      },
    }),
  },
  desktopExpandButton: {
    position: 'absolute',
    right: 12,
    top: 5,
    padding: 4,
  },
  // UPDATED: Desktop send button with proper spacing for mic button
  desktopSendButton: {
    backgroundColor: '#374151',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    marginRight: 8, // Add spacing for mic button
  },
  desktopSendButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  desktopButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  desktopLeftButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // UPDATED: Desktop right buttons - mic button handles its own margins
  desktopRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Plan restriction styles
  planRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  planRequirementText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  lockedSuggestionCard: {
    position: 'relative',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    // FIXED: Add web-specific properties for better click handling
    ...Platform.select({
      web: {
        cursor: 'pointer',
        pointerEvents: 'auto',
        userSelect: 'none',
        outline: 'none',
      },
    }),
  },
  suggestionCardHovered: {
    borderColor: '#3B82F6',
    shadowOpacity: 0.1,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  suggestionDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  /* Full Screen Modal */
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  fullScreenContainer: {
    flex: 1,
    padding: 20,
  },
  fullScreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  fullScreenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  fullScreenTextInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    textAlignVertical: 'top',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  fullScreenButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  fullScreenButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  fullScreenCancelButton: {
    backgroundColor: '#E5E7EB',
  },
  fullScreenSendButton: {
    backgroundColor: '#111827',
  },
  fullScreenButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fullScreenCancelText: {
    color: '#374151',
  },
  fullScreenSendText: {
    color: '#FFFFFF',
  },
  
  // 🎭 NEW: Meme-specific styles
  memeContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  memeHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
    textAlign: 'center',
  },
  memeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  moodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
  },
  moodEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  moodLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6C757D',
    textTransform: 'capitalize',
  },
});
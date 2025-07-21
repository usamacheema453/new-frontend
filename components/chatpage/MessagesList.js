// components/chatpage/MessagesList.js
// Updated with meme image rendering support and text bubble hiding for memes

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Image,
  Platform,
  Animated,
} from 'react-native';

// TTS Import
import * as Speech from 'expo-speech';

// ADDED: Import the markdown parser
import { renderFormattedMessage } from '../../utils/markdownParser';

// Icon imports
import {
  ChevronRight,
  Edit3,
  Volume2,
  RotateCcw,
  Copy,
  Check,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  Download,
  Share,
  Smile,
  Frown,
  Meh,
} from 'lucide-react-native';

// Import the feedback modal
import DislikeFeedbackModal from './DislikeFeedbackModal';

// ADDED: Import the TypingIndicator component
import TypingIndicator from './TypingIndicator';

export default function MessagesList({
  // Message data
  messages,
  setMessages,
  isLoading,
  
  // NEW: TypingIndicator props
  selectedTool,
  lastUserMessage,
  showTypingIndicator,
  
  // Editing state
  editingMessageId,
  setEditingMessageId,
  editingText,
  setEditingText,
  editedMessages,
  setEditedMessages,
  isEditingMessage,
  setIsEditingMessage,
  editingMessageRef,
  setEditingMessageRef,
  
  // Message interactions
  copiedMessageId,
  setCopiedMessageId,
  isSpeaking,
  setIsSpeaking,
  speakingMessageId,
  setSpeakingMessageId,
  
  // Thumbs up/down state
  thumbsUpMessages,
  setThumbsUpMessages,
  thumbsDownMessages,
  setThumbsDownMessages,
  
  // UI state
  isMobile,
  isWeb,
  hoveredCard,
  setHoveredCard,
  
  // User data
  userPlan,
  freeQueries,
  
  // Suggestion cards
  suggestionCards,
  onSuggestionClick,
  
  // Scroll management
  scrollViewRef,
  messagePositions,
  keyboardHeight,
  isKeyboardVisible,
  getScrollViewPadding,
  scrollToEditedMessage,
  
  // Handlers
  onEditMessage,
  onSaveEdit,
  onCancelEdit,
  onCopyMessage,
  onSpeakMessage,
  onRegenerateResponse,
  onEditInputChange,
  onEditKeyPress,
  onThumbsUp,
  onThumbsDown,
  
  // Optional feedback handler
  onDislikeFeedback,
  
  // Refs
  editingTextInputRef,
}) {
  const lineHeight = 20;
  
  // Animation states for thumbs buttons
  const [thumbsAnimations, setThumbsAnimations] = useState(new Map());
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState(null);
  const [feedbackMessageContent, setFeedbackMessageContent] = useState('');

  // Helper functions for checking thumbs state
  const isMessageLiked = (messageId) => {
    return thumbsUpMessages && thumbsUpMessages.has && thumbsUpMessages.has(messageId);
  };

  const isMessageDisliked = (messageId) => {
    return thumbsDownMessages && thumbsDownMessages.has && thumbsDownMessages.has(messageId);
  };

  // 🎭 Helper functions for meme detection and rendering
  const isMemeMessage = (message) => {
    return message.tool === 'meme' || (message.memeData && (message.memeData.base64 || message.memeUrl));
  };

  // 🎭 NEW: Helper function to check if message should only show image
  const shouldShowOnlyMemeImage = (message) => {
    return isMemeMessage(message) && 
           message.memeData?.dalle_generated === true && 
           (message.memeData?.base64 || message.memeUrl);
  };

  const getMoodColor = (mood) => {
    const colors = {
      happy: '#22C55E',
      sad: '#3B82F6',
      neutral: '#6B7280'
    };
    return colors[mood] || '#6B7280';
  };

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      sad: '😢',
      neutral: '😐'
    };
    return emojis[mood] || '😐';
  };

  const getMoodIcon = (mood) => {
    const icons = {
      happy: Smile,
      sad: Frown,
      neutral: Meh
    };
    return icons[mood] || Meh;
  };

  // 🎭 Download meme function
  const handleDownloadMeme = async (base64Data, mood) => {
    try {
      if (Platform.OS === 'web') {
        // Web download
        const link = document.createElement('a');
        link.href = `data:image/png;base64,${base64Data}`;
        link.download = `alarm-meme-${mood}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ Meme downloaded successfully');
      } else {
        // Mobile download - would need additional libraries like expo-media-library
        console.log('📱 Download meme:', mood);
        // Could implement mobile download here with expo-media-library
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
    }
  };

  // 🎭 Share meme function
  const handleShareMeme = async (base64Data, mood) => {
    try {
      if (Platform.OS === 'web') {
        // Web share
        if (navigator.share) {
          const blob = await fetch(`data:image/png;base64,${base64Data}`).then(r => r.blob());
          const file = new File([blob], `alarm-meme-${mood}.png`, { type: 'image/png' });
          await navigator.share({
            title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Alarm Meme`,
            text: 'Check out this alarm system meme!',
            files: [file]
          });
        } else {
          // Fallback to copying text
          navigator.clipboard.writeText(`Check out this ${mood} alarm system meme!`);
          console.log('📋 Meme info copied to clipboard');
        }
      } else {
        // Mobile share - would need expo-sharing
        console.log('📱 Share meme:', mood);
        // Could implement mobile sharing here with expo-sharing
      }
    } catch (error) {
      console.error('❌ Share failed:', error);
    }
  };

  // 🎭 Render meme image component
  const renderMemeImage = (message) => {
    if (!isMemeMessage(message)) return null;

    const hasMemeImage = message.memeData?.base64 || message.memeUrl;
    const mood = message.memeData?.mood || 'neutral';
    const moodColor = getMoodColor(mood);
    const moodEmoji = getMoodEmoji(mood);
    const MoodIcon = getMoodIcon(mood);

    if (!hasMemeImage) {
      // Show ASCII fallback if available
      if (message.memeData?.ascii_meme) {
        return (
          <View style={[styles.memeContainer, isMobile && styles.memeContainerMobile]}>
            <View style={styles.memeHeader}>
              <Text style={[styles.memeTitle, { color: moodColor }]}>
                🎭 {mood.charAt(0).toUpperCase() + mood.slice(1)} Meme (ASCII)
              </Text>
              <View style={[styles.moodBadge, { backgroundColor: moodColor + '20' }]}>
                <MoodIcon size={14} color={moodColor} />
                <Text style={[styles.moodLabel, { color: moodColor }]}>
                  {mood}
                </Text>
              </View>
            </View>
            
            <View style={styles.asciiContainer}>
              <Text style={styles.asciiText}>{message.memeData.ascii_meme}</Text>
            </View>
            
            <View style={styles.generationInfo}>
              <Text style={styles.generationText}>ASCII Art Fallback • DALL-E Unavailable</Text>
            </View>
          </View>
        );
      }
      return null;
    }

    return (
      <View style={[styles.memeContainer, isMobile && styles.memeContainerMobile]}>
        {/* Meme Header */}
        <View style={styles.memeHeader}>
          <Text style={[styles.memeTitle, { color: moodColor }]}>
            🎭 {mood.charAt(0).toUpperCase() + mood.slice(1)} Meme
          </Text>
          <View style={[styles.moodBadge, { backgroundColor: moodColor + '20' }]}>
            <Text style={styles.moodEmoji}>{moodEmoji}</Text>
            <Text style={[styles.moodLabel, { color: moodColor }]}>
              {mood}
            </Text>
          </View>
        </View>
        
        {/* Meme Image */}
        <View style={styles.imageContainer}>
          {message.memeData?.base64 ? (
            <Image
              source={{ uri: `data:image/png;base64,${message.memeData.base64}` }}
              style={[
                styles.memeImage,
                isMobile ? styles.memeImageMobile : styles.memeImageDesktop
              ]}
              resizeMode="contain"
              onError={(error) => {
                console.log('🚨 Meme image load error:', error);
              }}
              onLoad={() => {
                console.log('✅ Meme image loaded successfully');
              }}
            />
          ) : message.memeUrl ? (
            <Image
              source={{ uri: message.memeUrl }}
              style={[
                styles.memeImage,
                isMobile ? styles.memeImageMobile : styles.memeImageDesktop
              ]}
              resizeMode="contain"
              onError={(error) => {
                console.log('🚨 Meme URL image load error:', error);
              }}
              onLoad={() => {
                console.log('✅ Meme URL image loaded successfully');
              }}
            />
          ) : null}
          
          {/* Image Actions */}
          {message.memeData?.base64 && (
            <View style={styles.imageActions}>
              <TouchableOpacity 
                style={[styles.imageActionButton, styles.downloadButton]}
                onPress={() => handleDownloadMeme(message.memeData.base64, mood)}
                activeOpacity={0.8}
              >
                <Download size={14} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Save</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageActionButton, styles.shareImageButton]}
                onPress={() => handleShareMeme(message.memeData.base64, mood)}
                activeOpacity={0.8}
              >
                <Share size={14} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Generation Info */}
        <View style={styles.generationInfo}>
          <Sparkles size={12} color={moodColor} />
          <Text style={styles.generationText}>
            Generated with DALL-E • {mood} themed
            {message.memeData?.generation_time && ` • ${message.memeData.generation_time}`}
          </Text>
        </View>
      </View>
    );
  };

  // Get or create animation value for a message button
  const getThumbsAnimation = (messageId, type) => {
    const key = `${messageId}-${type}`;
    if (!thumbsAnimations.has(key)) {
      const newAnimation = new Animated.Value(1);
      setThumbsAnimations(prev => new Map(prev).set(key, newAnimation));
      return newAnimation;
    }
    return thumbsAnimations.get(key);
  };

  // Animate thumbs up button
  const animateThumbsUp = (messageId) => {
    const animation = getThumbsAnimation(messageId, 'up');
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Animate thumbs down button
  const animateThumbsDown = (messageId) => {
    const animation = getThumbsAnimation(messageId, 'down');
    
    Animated.sequence([
      Animated.parallel([
        Animated.timing(animation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle thumbs up with animation
  const handleThumbsUpPress = (messageId) => {
    animateThumbsUp(messageId);
    if (onThumbsUp) {
      onThumbsUp(messageId);
    }
  };

  // Handle thumbs down with animation and feedback modal
  const handleThumbsDownPress = (messageId) => {
    // Check if message is already disliked
    const isCurrentlyDisliked = isMessageDisliked(messageId);
    
    if (isCurrentlyDisliked) {
      // If already disliked, just remove the dislike (no feedback needed)
      animateThumbsDown(messageId);
      if (onThumbsDown) {
        onThumbsDown(messageId);
      }
    } else {
      // If not disliked, show feedback modal first
      const message = messages.find(msg => msg.id === messageId);
      setFeedbackMessageId(messageId);
      setFeedbackMessageContent(message?.content || '');
      setShowFeedbackModal(true);
    }
  };

  // Handle feedback submission
  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      // If parent component wants to handle feedback
      if (onDislikeFeedback) {
        await onDislikeFeedback(feedbackData);
      } else {
        // Default local handling
        console.log('Dislike Feedback:', feedbackData);
      }
      
      // Animate and register the dislike
      animateThumbsDown(feedbackData.messageId);
      if (onThumbsDown) {
        onThumbsDown(feedbackData.messageId);
      }
      
      // Close modal
      setShowFeedbackModal(false);
      setFeedbackMessageId(null);
      setFeedbackMessageContent('');
      
    } catch (error) {
      console.error('Error handling feedback:', error);
      throw error; // Re-throw to let modal handle the error
    }
  };

  // Handle feedback modal close
  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);
    setFeedbackMessageId(null);
    setFeedbackMessageContent('');
  };

  // Auto-focus editing input when editing starts
  useEffect(() => {
    if (editingMessageId && editingTextInputRef?.current) {
      setTimeout(() => {
        editingTextInputRef.current?.focus();
        
        if (isKeyboardVisible && scrollToEditedMessage) {
          setTimeout(() => {
            scrollToEditedMessage();
          }, 100);
        }
      }, 50);
    }
  }, [editingMessageId, isKeyboardVisible, scrollToEditedMessage]);

  // Handle message layout tracking
  const handleMessageLayout = (messageId, event) => {
    const { x, y, width, height } = event.nativeEvent.layout;
    if (messagePositions?.current) {
      messagePositions.current.set(messageId, { x, y, width, height });
    }
  };

  // Render welcome screen
  const renderWelcomeScreen = () => {
    if (isMobile) {
      return (
        <View style={styles.mobileWelcomeWrapper}>
          <Image
            source={require('../../assets/SuperEngineer_Logo.png')}
            style={styles.mobileLogoImage}
          />
          
          {/* Mobile Suggestion Cards */}
          <View style={styles.mobileSuggestionsContainer}>
            {suggestionCards && suggestionCards.map((card) => (
              <TouchableOpacity 
                key={card.id}
                style={styles.mobileSuggestionCard}
                onPress={() => onSuggestionClick && onSuggestionClick(card.title)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.mobileSuggestionIcon,
                  { backgroundColor: card.iconBg }
                ]}>
                  <card.icon size={20} color={card.iconColor} />
                </View>
                <View style={styles.mobileSuggestionContent}>
                  <Text style={styles.mobileSuggestionTitle}>
                    {card.title}
                  </Text>
                  <Text style={styles.mobileSuggestionDescription}>
                    {card.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.desktopWelcomeWrapper}>
          <Image
            source={require('../../assets/SuperEngineer_Logo.png')}
            style={styles.logoImage}
          />
         
          {/* Desktop Suggestion Cards */}
          <View style={styles.desktopSuggestionsContainer}>
            {suggestionCards && suggestionCards.map((card) => (
              <TouchableOpacity 
                key={card.id}
                style={[
                  styles.desktopSuggestionCard,
                  hoveredCard === card.id && styles.desktopSuggestionCardHovered,
                ]}
                onPress={() => onSuggestionClick && onSuggestionClick(card.title)}
                activeOpacity={0.8}
                onMouseEnter={() => isWeb && setHoveredCard && setHoveredCard(card.id)}
                onMouseLeave={() => isWeb && setHoveredCard && setHoveredCard(null)}
              >
                <View style={[
                  styles.desktopSuggestionIcon,
                  { backgroundColor: card.iconBg }
                ]}>
                  <card.icon size={24} color={card.iconColor} />
                </View>
                <View style={styles.desktopSuggestionContent}>
                  <Text style={styles.desktopSuggestionTitle}>
                    {card.title}
                  </Text>
                  <Text style={styles.desktopSuggestionDescription}>
                    {card.description}
                  </Text>
                </View>
                {hoveredCard === card.id && isWeb && (
                  <View style={styles.desktopSuggestionArrow}>
                    <ChevronRight size={20} color="#6B7280" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
  };

  // Render message attachments
  const renderMessageAttachments = (message) => {
    if (!message.attachments || message.attachments.length === 0) {
      return null;
    }

    return (
      <View style={[
        styles.messageAttachments,
        Platform.OS === 'web' && !isMobile && styles.webMessageAttachments,
        isMobile && styles.mobileMessageAttachments
      ]}>
        {message.attachments.map((attachment, attIndex) => (
          <View 
            key={`${message.id}-${attIndex}`} 
            style={[
              styles.messageAttachment,
              Platform.OS === 'web' && !isMobile && styles.webMessageAttachment,
              isMobile && styles.mobileMessageAttachment
            ]}
          >
            {attachment.type === 'image' ? (
              <Image
                source={{ uri: attachment.uri }}
                style={[
                  styles.messageImage,
                  Platform.OS === 'web' && !isMobile && styles.webMessageImage,
                  isMobile && styles.mobileMessageImage
                ]}
                resizeMode="cover"
              />
            ) : (
              <View style={[
                styles.messageDocument,
                Platform.OS === 'web' && !isMobile && styles.webMessageDocument,
                isMobile && styles.mobileMessageDocument
              ]}>
                <FileText 
                  size={Platform.OS === 'web' && !isMobile ? 20 : (isMobile ? 16 : 16)} 
                  color="#6B7280" 
                />
                <Text style={[
                  styles.messageDocumentName,
                  Platform.OS === 'web' && !isMobile && styles.webMessageDocumentName,
                  isMobile && styles.mobileMessageDocumentName
                ]}
                numberOfLines={isMobile ? 2 : undefined}
                ellipsizeMode="tail"
                >{attachment.fileName}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  // UPDATED: New enhanced typing indicator using TypingIndicator component
  const renderTypingIndicator = () => {
    // Use the new TypingIndicator component if showTypingIndicator is true
    if (showTypingIndicator) {
      return (
        <TypingIndicator
          tool={selectedTool}
          message={lastUserMessage}
          showProgress={selectedTool === 'ninja'}
          style={{ 
            marginTop: 8,
            marginBottom: 16,
            // Ensure proper width for mobile and desktop
            width: '100%',
            maxWidth: isMobile ? undefined : 768,
            alignSelf: 'center',
          }}
        />
      );
    }

    // Fallback to old typing indicator if props aren't available
    if (isLoading) {
      return (
        <View style={isMobile ? styles.mobileMessagesContainer : styles.desktopMessagesContainer}>
          <View style={[styles.messageRow, styles.messageAssistant]}>
            <View style={[styles.messageBubble, styles.assistantBubble]}>
              <View style={styles.typingWrapper}>
                <View style={[styles.typingDot, { marginLeft: 0 }]} />
                <View style={[styles.typingDot, { marginLeft: 4 }]} />
                <View style={[styles.typingDot, { marginLeft: 8 }]} />
              </View>
            </View>
          </View>
        </View>
      );
    }

    return null;
  };

  // Render message actions
  const renderMessageActions = (message, index, isEditing, isUserMessage, hasResponse) => {
    if (isEditing) {
      return (
        <View style={[
          styles.editActionsExternal,
          isUserMessage ? styles.userEditActionsExternal : styles.assistantEditActionsExternal
        ]}>
          <TouchableOpacity
            style={[
              isMobile ? styles.editActionButtonMobile : styles.editActionButton, 
              isMobile ? styles.cancelEditButtonMobile : styles.cancelEditButton
            ]}
            onPress={onCancelEdit || (() => {})}
            activeOpacity={0.7}
          >
            <Text style={isMobile ? styles.cancelEditButtonTextMobile : styles.cancelEditButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              isMobile ? styles.editActionButtonMobile : styles.editActionButton, 
              isMobile ? styles.saveEditButtonMobile : styles.saveEditButton
            ]}
            onPress={() => onSaveEdit && onSaveEdit(message.id)}
            disabled={!editingText || !editingText.trim()}
            activeOpacity={0.7}
          >
            <Text style={[
              isMobile ? styles.saveEditButtonTextMobile : styles.saveEditButtonText,
              (!editingText || !editingText.trim()) && styles.saveEditButtonTextDisabled
            ]}>Save</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {isUserMessage && hasResponse && (
          <View style={[styles.messageActionsExternal, styles.userActionsExternal]}>
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => onEditMessage && onEditMessage(message.id, message.content)}
            >
              <Edit3 size={isMobile ? 14 : 16} color="#374151" />
            </TouchableOpacity>
            {editedMessages && editedMessages.has && editedMessages.has(message.id) && (
              <Text style={styles.editedText}>edited</Text>
            )}
          </View>
        )}
        
        {!isUserMessage && (
          <View style={[styles.messageActionsExternal, styles.assistantActionsExternal]}>
            {/* Thumbs Up Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => handleThumbsUpPress(message.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [
                    { scale: getThumbsAnimation(message.id, 'up') },
                    { 
                      translateY: getThumbsAnimation(message.id, 'up').interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0, -2],
                      })
                    }
                  ]
                }}
              >
                <ThumbsUp 
                  size={isMobile ? 14 : 16} 
                  color={isMessageLiked(message.id) ? "#000000" : "#374151"}
                  fill={isMessageLiked(message.id) ? "#000000" : "transparent"}
                />
              </Animated.View>
            </TouchableOpacity>
            
            {/* Thumbs Down Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => handleThumbsDownPress(message.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [
                    { scale: getThumbsAnimation(message.id, 'down') },
                    { 
                      translateY: getThumbsAnimation(message.id, 'down').interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0, 2],
                      })
                    }
                  ]
                }}
              >
                <ThumbsDown 
                  size={isMobile ? 14 : 16} 
                  color={isMessageDisliked(message.id) ? "#000000" : "#374151"}
                  fill={isMessageDisliked(message.id) ? "#000000" : "transparent"}
                />
              </Animated.View>
            </TouchableOpacity>
            
            {/* Speak Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => onSpeakMessage && onSpeakMessage(message.id, message.content)}
              activeOpacity={0.7}
            >
              <Volume2 
                size={isMobile ? 14 : 16} 
                color={speakingMessageId === message.id ? "#3B82F6" : "#374151"} 
              />
            </TouchableOpacity>
            
            {/* Regenerate Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => {
                if (onRegenerateResponse) {
                  const userMessageIndex = index - 1;
                  if (userMessageIndex >= 0 && messages[userMessageIndex]) {
                    onRegenerateResponse(messages[userMessageIndex].id);
                  }
                }
              }}
              activeOpacity={0.7}
            >
              <RotateCcw size={isMobile ? 14 : 16} color="#374151" />
            </TouchableOpacity>
            
            {/* Copy Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => onCopyMessage && onCopyMessage(message.content, message.id)}
              activeOpacity={0.7}
            >
              {copiedMessageId === message.id ? (
                <Check size={isMobile ? 14 : 16} color="#10B981" />
              ) : (
                <Copy size={isMobile ? 14 : 16} color="#374151" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </>
    );
  };

  // 🎭 UPDATED: Render individual message with meme-only logic
  const renderMessage = (message, index) => {
    const isUserMessage = message.role === 'user';
    const hasResponse = !isUserMessage || (index < messages.length - 1 && messages[index + 1]?.role === 'assistant');
    const isEditing = editingMessageId === message.id;
    const showOnlyMemeImage = shouldShowOnlyMemeImage(message);
    
    const isLastInTurn = isUserMessage ? 
      (index === messages.length - 1 || messages[index + 1]?.role === 'user') :
      (index === messages.length - 1 || messages[index + 1]?.role === 'user');

    return (
      <View 
        key={message.id} 
        style={[
          styles.messageContainer,
          isUserMessage && !hasResponse && styles.userMessageContainer,
          !isUserMessage && isLastInTurn && styles.assistantMessageContainer,
        ]}
        onLayout={(event) => handleMessageLayout(message.id, event)}
      >
        {/* 🎭 NEW: If it's a meme with image, skip the text bubble entirely */}
        {!showOnlyMemeImage && (
          <View
            style={[
              styles.messageRow,
              isUserMessage
                ? styles.messageUser
                : styles.messageAssistant,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isUserMessage
                  ? styles.userBubble
                  : styles.assistantBubble,
                isEditing && (isMobile ? styles.editingBubbleMobile : styles.editingBubble),
              ]}
            >
              <View style={styles.messageContent}>
                {/* Show attachments */}
                {renderMessageAttachments(message)}
                
                {/* Backward compatibility: show old image format */}
                {message.image && !message.attachments?.find(att => att.uri === message.image) && (
                  <Image
                    source={{ uri: message.image }}
                    style={[
                      styles.messageImage,
                      Platform.OS === 'web' && !isMobile && styles.webMessageImage,
                      isMobile && styles.mobileMessageImage
                    ]}
                    resizeMode="cover"
                  />
                )}
                
                {isEditing ? (
                  <View style={styles.inPlaceEditContainer}>
                    <TextInput
                      ref={editingTextInputRef}
                      style={[
                        styles.messageText,
                        isUserMessage ? styles.userText : styles.assistantText,
                        isMobile ? styles.editableMessageTextMobile : styles.editableMessageText,
                      ]}
                      value={editingText || ''}
                      onChangeText={onEditInputChange || (() => {})}
                      onKeyPress={Platform.OS === 'web' ? (e) => onEditKeyPress && onEditKeyPress(e, message.id) : undefined}
                      multiline
                      autoFocus
                      textAlignVertical="top"
                      scrollEnabled={true}
                      placeholder="Edit your message..."
                      placeholderTextColor={isUserMessage ? "rgba(255,255,255,0.6)" : "rgba(17,24,39,0.6)"}
                      onFocus={() => {
                        if (setIsEditingMessage) {
                          setIsEditingMessage(true);
                        }
                        setTimeout(() => {
                          if (isKeyboardVisible && scrollToEditedMessage) {
                            scrollToEditedMessage();
                          }
                        }, 100);
                      }}
                    />
                  </View>
                ) : (
                  message.content && (
                    // UPDATED: Use renderFormattedMessage instead of plain Text
                    renderFormattedMessage(
                      message.content,
                      isUserMessage,
                      [
                        styles.messageText,
                        isUserMessage ? styles.userText : styles.assistantText,
                      ]
                    )
                  )
                )}
              </View>
            </View>
          </View>
        )}
        
        {/* 🎭 UPDATED: Render meme image (this will be the only thing shown for successful memes) */}
        {!isEditing && renderMemeImage(message)}
        
        {/* 🎭 UPDATED: Only show message actions if not a meme-only message */}
        {!showOnlyMemeImage && renderMessageActions(message, index, isEditing, isUserMessage, hasResponse)}
        
        {/* 🎭 NEW: For meme-only messages, show simplified actions */}
        {showOnlyMemeImage && !isEditing && (
          <View style={[styles.messageActionsExternal, styles.assistantActionsExternal, styles.memeOnlyActions]}>
            {/* Thumbs Up Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => handleThumbsUpPress(message.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [
                    { scale: getThumbsAnimation(message.id, 'up') },
                    { 
                      translateY: getThumbsAnimation(message.id, 'up').interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0, -2],
                      })
                    }
                  ]
                }}
              >
                <ThumbsUp 
                  size={isMobile ? 14 : 16} 
                  color={isMessageLiked(message.id) ? "#000000" : "#374151"}
                  fill={isMessageLiked(message.id) ? "#000000" : "transparent"}
                />
              </Animated.View>
            </TouchableOpacity>
            
            {/* Thumbs Down Button */}
            <TouchableOpacity
              style={styles.actionButtonExternal}
              onPress={() => handleThumbsDownPress(message.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={{
                  transform: [
                    { scale: getThumbsAnimation(message.id, 'down') },
                    { 
                      translateY: getThumbsAnimation(message.id, 'down').interpolate({
                        inputRange: [1, 1.2],
                        outputRange: [0, 2],
                      })
                    }
                  ]
                }}
              >
                <ThumbsDown 
                  size={isMobile ? 14 : 16} 
                  color={isMessageDisliked(message.id) ? "#000000" : "#374151"}
                  fill={isMessageDisliked(message.id) ? "#000000" : "transparent"}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <>
      <ScrollView
        ref={scrollViewRef}
        style={isMobile ? styles.mobileMessagesWrapper : styles.messagesWrapper}
        contentContainerStyle={[
          isMobile ? styles.mobileMessagesContent : styles.messagesContent,
          isMobile && { paddingBottom: getScrollViewPadding ? getScrollViewPadding() : 20 }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        contentInsetAdjustmentBehavior="automatic"
      >
        {(!messages || messages.length === 0) ? (
          renderWelcomeScreen()
        ) : (
          <View style={isMobile ? styles.mobileMessagesContainer : styles.desktopMessagesContainer}>
            {messages && messages.map ? messages.map((message, index) => renderMessage(message, index)) : null}
          </View>
        )}
        
        {/* UPDATED: Use the new TypingIndicator component */}
        {renderTypingIndicator()}
      </ScrollView>

      {/* Dislike Feedback Modal */}
      <DislikeFeedbackModal
        visible={showFeedbackModal}
        onClose={handleFeedbackModalClose}
        onSubmit={handleFeedbackSubmit}
        messageId={feedbackMessageId}
        messageContent={feedbackMessageContent}
        isMobile={isMobile}
      />
    </>
  );
}

// StyleSheet with all message-related styles including new meme styles
const styles = StyleSheet.create({
  /* Messages Wrapper */
  mobileMessagesWrapper: {
    flex: 1,
  },
  mobileMessagesContent: {
    paddingTop: 12,
    alignItems: 'center',
    minHeight: '100%',
    paddingBottom: 20,
  },
  messagesWrapper: {
    flex: 1,
    paddingTop: 12,
  },
  messagesContent: {
    paddingBottom: 5,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  
  /* Welcome Screen */
  mobileWelcomeWrapper: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mobileLogoImage: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  desktopWelcomeWrapper: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  logoImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  
  /* Mobile Suggestion Cards */
  mobileSuggestionsContainer: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 16,
  },
  mobileSuggestionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    width: '100%',
  },
  mobileSuggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  mobileSuggestionContent: {
    flex: 1,
  },
  mobileSuggestionTitle: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
  },
  mobileSuggestionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
  },
  
  /* Desktop Suggestion Cards */
  desktopSuggestionsContainer: {
    marginTop: 80,
    marginBottom: 15,
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  desktopSuggestionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingRight: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    minHeight: 64,
    minWidth: 300,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
      },
    }),
  },
  desktopSuggestionCardHovered: {
    ...Platform.select({
      web: {
        shadowOpacity: 0.12,
        borderColor: '#D1D5DB',
      },
    }),
  },
  desktopSuggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  desktopSuggestionContent: {
    flex: 1,
    minWidth: 0,
  },
  desktopSuggestionTitle: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 2,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
      },
    }),
  },
  desktopSuggestionDescription: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 16,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
      },
    }),
  },
  desktopSuggestionArrow: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -10,
    opacity: 0.7,
    ...Platform.select({
      web: {
        transition: 'opacity 0.2s ease',
      },
    }),
  },

  /* Messages Container */
  mobileMessagesContainer: {
    width: '100%',
    paddingHorizontal: 16,
    alignSelf: 'center',
    paddingBottom: 8,
  },
  desktopMessagesContainer: {
    width: '100%',
    maxWidth: 768,
    paddingHorizontal: 24,
    alignSelf: 'center',
    paddingBottom: 2,
  },
  
  /* Message Spacing */
  messageContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  userMessageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  assistantMessageContainer: {
    marginBottom: 32,
    position: 'relative',
  },
  
  messageRow: {
    flexDirection: 'row',
  },
  messageUser: {
    justifyContent: 'flex-end',
    paddingLeft: 60,
    paddingRight: 0,
  },
  messageAssistant: {
    justifyContent: 'flex-start',
    paddingRight: 60,
  },
  
  messageBubble: {
    maxWidth: '100%',
    padding: 12,
    borderRadius: 12,
    position: 'relative',
  },
  
  messageContent: {
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      },
      default: {},
    }),
  },
  userBubble: {
    backgroundColor: '#000',
    borderTopRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E5E7EB',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#111827',
  },
  messageImage: {
    width: 200,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  
  /* 🎭 Meme-specific styles */
  memeContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  
  memeContainerMobile: {
    marginHorizontal: 0,
    width: '100%',
  },
  
  memeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  memeTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  
  moodEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  
  moodLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  
  memeImage: {
    width: '100%',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  
  memeImageMobile: {
    height: 200,
  },
  
  memeImageDesktop: {
    height: 250,
    maxWidth: 350,
    alignSelf: 'center',
  },
  
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  
  imageActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 70,
    justifyContent: 'center',
  },
  
  downloadButton: {
    backgroundColor: '#3B82F6',
  },
  
  shareImageButton: {
    backgroundColor: '#10B981',
  },
  
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  
  asciiContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  
  asciiText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 14,
    color: '#374151',
    textAlign: 'center',
  },
  
  generationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  
  generationText: {
    fontSize: 11,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  
  /* Attachment display styles for messages */
  messageAttachments: {
    marginBottom: Platform.OS === 'web' ? 0 : 8,
  },
  messageAttachment: {
    marginBottom: 6,
  },
  messageDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageDocumentName: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  
  /* Mobile-specific attachment styles */
  mobileMessageAttachments: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  mobileMessageAttachment: {
    width: 90,
    height: 70,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginRight: 6,
    marginBottom: 6,
  },
  mobileMessageImage: {
    width: '100%',
    height: '100%',
    borderRadius: 7,
    backgroundColor: '#F3F4F6',
  },
  mobileMessageDocument: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 6,
    height: '100%',
  },
  mobileMessageDocumentName: {
    fontSize: 9,
    lineHeight: 10,
    marginTop: 3,
    color: '#374151',
    fontWeight: '500',
    textAlign: 'center',
  },
  
  /* Web-specific attachment styles */
  webMessageAttachments: {
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '12px',
      },
    }),
  },
  webMessageAttachment: {
    ...Platform.select({
      web: {
        width: '100px',
        height: '80px',
        backgroundColor: '#F8F9FA',
        borderRadius: '6px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        flexShrink: 0,
      },
    }),
  },
  webMessageImage: {
    ...Platform.select({
      web: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: '7px',
        backgroundColor: '#F3F4F6',
      },
    }),
  },
  webMessageDocument: {
    ...Platform.select({
      web: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        height: '100%',
        padding: '8px',
        boxSizing: 'border-box',
        textAlign: 'center',
      },
    }),
  },
  webMessageDocumentName: {
    ...Platform.select({
      web: {
        fontSize: 10,
        lineHeight: '11px',
        marginTop: '4px',
        marginLeft: 0,
        color: '#374151',
        fontWeight: '500',
        textAlign: 'center',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        wordBreak: 'break-word',
        maxWidth: '100%',
      },
    }),
  },
  
  /* Message Actions */
  messageActionsExternal: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 0,
    marginBottom: 2,
    overflow: 'visible',
    paddingHorizontal: 0,
    minHeight: 32,
  },
  userActionsExternal: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 0,
    marginRight: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'visible',
    alignSelf: 'flex-end',
    position: 'relative',
  },
  assistantActionsExternal: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingLeft: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButtonExternal: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'transparent',
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: 'rgba(55, 65, 81, 0.1)',
        },
      },
    }),
  },
  
  /* 🎭 NEW: Meme-only actions styling */
  memeOnlyActions: {
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  
  /* Edited indicator */
  editedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginLeft: -4,
    marginRight: 2,
    alignSelf: 'center',
    textAlign: 'left',
    minWidth: 40,
  },

  /* Editing Styles */
  editingBubble: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 200,
    width: '100%',
  },
  editingBubbleMobile: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    minWidth: 200,
    width: '100%',
  },
  
  inPlaceEditContainer: {
    minHeight: 'auto',
    width: '100%',
  },
  
  editableMessageText: {
    minHeight: 60,
    maxHeight: 300,
    backgroundColor: 'transparent',
    borderWidth: 0,
    outline: 'none',
    outlineStyle: 'none',
    padding: 0,
    margin: 0,
    width: '100%',
    flex: 1,
    textAlign: 'left',
    textAlignVertical: 'top',
    ...Platform.select({
      web: {
        resize: 'none',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        '&:focus': {
          outline: 'none',
          boxShadow: 'none',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(55, 65, 81, 0.5) transparent',
        '&::-webkit-scrollbar': {
          width: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(55, 65, 81, 0.5)',
          borderRadius: '3px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(55, 65, 81, 0.7)',
        },
      },
    }),
  },
  
  editableMessageTextMobile: {
    minHeight: 60,
    maxHeight: 250,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
    margin: 0,
    width: '100%',
    flex: 1,
    textAlign: 'left',
    textAlignVertical: 'top',
  },
  
  /* Edit Actions */
  editActionsExternal: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  
  userEditActionsExternal: {
    justifyContent: 'flex-end',
    paddingRight: 8,
    minHeight: 44,
  },
  
  assistantEditActionsExternal: {
    justifyContent: 'flex-start',
    paddingLeft: 8,
    minHeight: 44,
  },
  
  editActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
        },
      },
    }),
  },
  
  editActionButtonMobile: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  
  cancelEditButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
          borderColor: '#9CA3AF',
        },
      },
    }),
  },
  
  cancelEditButtonMobile: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  
  saveEditButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#1F2937',
          borderColor: '#1F2937',
        },
      },
    }),
  },
  
  saveEditButtonMobile: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  
  cancelEditButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  
  cancelEditButtonTextMobile: {
    color: '#374151',
    fontSize: 15,
    fontWeight: '500',
  },
  
  saveEditButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  saveEditButtonTextMobile: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  
  saveEditButtonTextDisabled: {
    opacity: 0.5,
  },
  
  /* Fallback Typing Indicator (for backward compatibility) */
  typingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
    opacity: 0.8,
  },
});
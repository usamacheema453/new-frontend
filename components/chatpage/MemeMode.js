// components/chatpage/MemeMode.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { 
  Smile, 
  Frown, 
  Meh, 
  Send,
  X,
  Sparkles
} from 'lucide-react-native';

export default function MemeMode({ 
  isMobile, 
  onMemeSelect, 
  onClose, 
  isLoading = false 
}) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [scaleAnim] = useState(new Animated.Value(1));

  const moodOptions = [
    {
      id: 'happy',
      label: 'Happy',
      icon: Smile,
      color: '#22C55E',
      bgColor: '#DCFCE7',
      description: 'Generate funny and upbeat memes'
    },
    {
      id: 'sad',
      label: 'Sad',
      icon: Frown,
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      description: 'Create melancholic or dramatic memes'
    },
    {
      id: 'neutral',
      label: 'Neutral',
      icon: Meh,
      color: '#6B7280',
      bgColor: '#F3F4F6',
      description: 'Make balanced or sarcastic memes'
    }
  ];

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood.id);
    
    // Add a small animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSendMeme = () => {
    if (selectedMood && onMemeSelect) {
      const selectedMoodData = moodOptions.find(m => m.id === selectedMood);
      onMemeSelect({
        mood: selectedMood,
        label: selectedMoodData.label,
        description: selectedMoodData.description
      });
      setSelectedMood(null);
    }
  };

  const renderMoodButton = (mood) => {
    const IconComponent = mood.icon;
    const isSelected = selectedMood === mood.id;
    
    return (
      <Animated.View
        key={mood.id}
        style={[
          { transform: [{ scale: isSelected ? scaleAnim : 1 }] }
        ]}
      >
        <TouchableOpacity
          style={[
            styles.moodButton,
            isMobile ? styles.moodButtonMobile : styles.moodButtonDesktop,
            isSelected && [
              styles.moodButtonSelected,
              { borderColor: mood.color, backgroundColor: mood.bgColor }
            ]
          ]}
          onPress={() => handleMoodSelect(mood)}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={[
            styles.moodIconContainer,
            isSelected && { backgroundColor: mood.color }
          ]}>
            <IconComponent 
              size={isMobile ? 24 : 20} 
              color={isSelected ? '#FFFFFF' : mood.color} 
            />
          </View>
          
          <View style={styles.moodContent}>
            <Text style={[
              styles.moodLabel,
              isSelected && { color: mood.color, fontWeight: '600' }
            ]}>
              {mood.label}
            </Text>
            <Text style={[
              styles.moodDescription,
              isSelected && { color: mood.color }
            ]}>
              {mood.description}
            </Text>
          </View>
          
          {isSelected && (
            <View style={styles.selectedIndicator}>
              <Sparkles size={16} color={mood.color} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={[
      styles.container,
      isMobile ? styles.containerMobile : styles.containerDesktop
    ]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.memeIcon}>
            <Sparkles size={20} color="#8B5CF6" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Meme Mode</Text>
            <Text style={styles.headerSubtitle}>Choose your meme mood</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          disabled={isLoading}
        >
          <X size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Mood Selection */}
      <View style={styles.moodGrid}>
        {moodOptions.map(renderMoodButton)}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cancelButton,
            isMobile ? styles.actionButtonMobile : styles.actionButtonDesktop
          ]}
          onPress={onClose}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.sendButton,
            isMobile ? styles.actionButtonMobile : styles.actionButtonDesktop,
            !selectedMood && styles.sendButtonDisabled,
            isLoading && styles.sendButtonLoading
          ]}
          onPress={handleSendMeme}
          disabled={!selectedMood || isLoading}
        >
          {isLoading ? (
            <Text style={styles.sendButtonText}>Creating Meme...</Text>
          ) : (
            <>
              <Send size={16} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Generate Meme</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Helper Text */}
      <Text style={styles.helperText}>
        Select a mood to generate contextual memes based on your conversation
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  containerMobile: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  
  containerDesktop: {
    marginHorizontal: 24,
    marginBottom: 16,
    maxWidth: 600,
    alignSelf: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  memeIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3E8FF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },

  moodGrid: {
    marginBottom: 24,
  },

  moodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },

  moodButtonMobile: {
    padding: 16,
  },

  moodButtonDesktop: {
    padding: 14,
  },

  moodButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  moodIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  moodContent: {
    flex: 1,
  },

  moodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },

  moodDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  selectedIndicator: {
    marginLeft: 12,
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  actionButton: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },

  actionButtonMobile: {
    paddingVertical: 14,
    flex: 1,
    marginHorizontal: 6,
  },

  actionButtonDesktop: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
  },

  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },

  sendButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
  },

  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      },
    }),
  },

  sendButtonLoading: {
    backgroundColor: '#A78BFA',
  },

  sendButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },

  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
// components/DislikeFeedbackModal.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';

// Icon imports
import {
  X,
  Check,
  ThumbsDown,
  Send,
} from 'lucide-react-native';

export default function DislikeFeedbackModal({
  visible,
  onClose,
  onSubmit,
  messageId,
  messageContent,
  isMobile = false,
}) {
  const [selectedReasons, setSelectedReasons] = useState(new Set());
  const [otherReason, setOtherReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined dislike reasons
  const dislikeReasons = [
    {
      id: 'incorrect',
      label: 'Incorrect or inaccurate information',
      description: 'The response contains wrong facts or data'
    },
    {
      id: 'unhelpful',
      label: 'Not helpful or relevant',
      description: 'The response doesn\'t answer my question'
    },
    {
      id: 'incomplete',
      label: 'Incomplete response',
      description: 'Missing important details or context'
    },
    {
      id: 'unclear',
      label: 'Confusing or unclear',
      description: 'Hard to understand or poorly explained'
    },
    {
      id: 'inappropriate',
      label: 'Inappropriate content',
      description: 'Content is offensive or unsuitable'
    },
    {
      id: 'technical',
      label: 'Technical issues',
      description: 'Formatting problems or broken features'
    },
    {
      id: 'bias',
      label: 'Biased or unfair',
      description: 'Shows unfair bias or discrimination'
    },
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedReasons(new Set());
      setOtherReason('');
      setIsSubmitting(false);
    }
  }, [visible]);

  // Handle reason selection
  const toggleReason = (reasonId) => {
    setSelectedReasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reasonId)) {
        newSet.delete(reasonId);
      } else {
        newSet.add(reasonId);
      }
      return newSet;
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate that at least one reason is selected or other reason is provided
    if (selectedReasons.size === 0 && !otherReason.trim()) {
      Alert.alert(
        'Feedback Required',
        'Please select at least one reason or provide your own feedback.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const feedbackData = {
        messageId,
        messageContent: messageContent ? messageContent.substring(0, 100) : '', // First 100 chars for context
        selectedReasons: Array.from(selectedReasons),
        otherReason: otherReason.trim(),
        timestamp: new Date().toISOString(),
        platform: Platform.OS,
      };

      // Call the onSubmit callback with feedback data
      if (onSubmit) {
        await onSubmit(feedbackData);
      }

      // Show success message
      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted and will help us improve our responses.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsSubmitting(false);
              onClose();
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Submission Failed',
        'There was an error submitting your feedback. Please try again.',
        [{ text: 'OK' }]
      );
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.modalContainer,
          isMobile ? styles.mobileModalContainer : styles.desktopModalContainer
        ]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <ThumbsDown size={20} color="#EF4444" />
              </View>
              <Text style={styles.modalTitle}>Feedback</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.description}>
              Help us improve by telling us what went wrong with this response:
            </Text>

            {/* Reasons List */}
            <View style={styles.reasonsList}>
              {dislikeReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonItem,
                    selectedReasons.has(reason.id) && styles.reasonItemSelected
                  ]}
                  onPress={() => toggleReason(reason.id)}
                  activeOpacity={0.7}
                  disabled={isSubmitting}
                >
                  <View style={styles.reasonContent}>
                    <View style={[
                      styles.checkbox,
                      selectedReasons.has(reason.id) && styles.checkboxSelected
                    ]}>
                      {selectedReasons.has(reason.id) && (
                        <Check size={14} color="#FFFFFF" />
                      )}
                    </View>
                    <View style={styles.reasonText}>
                      <Text style={[
                        styles.reasonLabel,
                        selectedReasons.has(reason.id) && styles.reasonLabelSelected
                      ]}>
                        {reason.label}
                      </Text>
                      <Text style={styles.reasonDescription}>
                        {reason.description}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* Other Reason Input */}
            <View style={styles.otherReasonSection}>
              <Text style={styles.otherReasonLabel}>Other (please specify):</Text>
              <TextInput
                style={[
                  styles.otherReasonInput,
                  isMobile && styles.mobileOtherReasonInput
                ]}
                value={otherReason}
                onChangeText={setOtherReason}
                placeholder="Tell us what specific issue you encountered..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={isMobile ? 3 : 4}
                textAlignVertical="top"
                editable={!isSubmitting}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {otherReason.length}/500 characters
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Text style={styles.submitButtonText}>Submitting...</Text>
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" style={styles.submitIcon} />
                  <Text style={styles.submitButtonText}>Submit Feedback</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '90%',
  },

  mobileModalContainer: {
    width: '100%',
    maxWidth: '100%',
    margin: 16,
  },

  desktopModalContainer: {
    width: '100%',
    maxWidth: 500,
    minWidth: 400,
  },

  /* Header */
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  closeButton: {
    padding: 4,
    borderRadius: 6,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: '#F3F4F6',
        },
      },
    }),
  },

  /* Content */
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 400,
  },

  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },

  /* Reasons List */
  reasonsList: {
    marginBottom: 24,
  },

  reasonItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#D1D5DB',
          backgroundColor: '#F9FAFB',
        },
      },
    }),
  },

  reasonItemSelected: {
    borderColor: '#000000',
    backgroundColor: '#F9FAFB',
  },

  reasonContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },

  checkboxSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },

  reasonText: {
    flex: 1,
  },

  reasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
    lineHeight: 18,
  },

  reasonLabelSelected: {
    color: '#111827',
  },

  reasonDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },

  /* Other Reason */
  otherReasonSection: {
    marginBottom: 20,
  },

  otherReasonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },

  otherReasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 80,
    ...Platform.select({
      web: {
        outline: 'none',
        fontFamily: 'system-ui',
        '&:focus': {
          borderColor: '#000000',
          boxShadow: '0 0 0 1px #000000',
        },
      },
    }),
  },

  mobileOtherReasonInput: {
    minHeight: 60,
  },

  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },

  /* Footer */
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },

  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },

  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#E5E7EB',
        },
      },
    }),
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  submitButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#1F2937',
        },
      },
    }),
  },

  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
        '&:hover': {
          backgroundColor: '#9CA3AF',
        },
      },
    }),
  },

  submitButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },

  submitIcon: {
    marginRight: 6,
  },
});
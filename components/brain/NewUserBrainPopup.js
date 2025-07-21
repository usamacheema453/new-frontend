// components/brain/NewUserBrainPopup.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Brain,
  Clock,
  UserPlus,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const NewUserBrainPopup = ({
  visible,
  onClose,
  onBrainRequested,
  userInfo = null, // Optional user info for personalization
  hasAlreadyRequested = false, // Whether user has already submitted a request
}) => {
  const [brainRequested, setBrainRequested] = useState(hasAlreadyRequested);
  const [isLoading, setIsLoading] = useState(false);

  // Set initial state based on whether user has already requested
  useEffect(() => {
    if (visible) {
      setBrainRequested(hasAlreadyRequested);
      setIsLoading(false);
    }
  }, [visible, hasAlreadyRequested]);

  // Handle brain request
  const handleBrainRequest = async () => {
    // Prevent duplicate requests
    if (hasAlreadyRequested) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call for brain setup request
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setBrainRequested(true);
      
      // Call parent callback to handle the request
      if (onBrainRequested) {
        await onBrainRequested();
      }
      
      console.log('✅ Brain request submitted successfully');
      
      // In a real app, you would make an API call here:
      // const response = await api.requestBrainSetup(userInfo?.id);
      // if (response.success) {
      //   setBrainRequested(true);
      //   onBrainRequested(response.data);
      // }
      
    } catch (error) {
      Alert.alert('Error', 'Failed to submit brain request. Please try again.');
      console.error('Brain request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle popup close
  const handleClose = () => {
    console.log('🔄 NewUserBrainPopup: handleClose called');
    console.log('🔄 brainRequested:', brainRequested);
    console.log('🔄 hasAlreadyRequested:', hasAlreadyRequested);
    
    // Pass true if brain was requested (either in this session or previously)
    const brainWasRequested = brainRequested || hasAlreadyRequested;
    console.log('🔄 Calling onClose with brainWasRequested:', brainWasRequested);
    
    onClose(brainWasRequested);
  };

  // Handle "Maybe Later" action
  const handleMaybeLater = () => {
    console.log('🔄 NewUserBrainPopup: handleMaybeLater called');
    onClose(false);
  };

  // Handle "Got it" specifically
  const handleGotIt = () => {
    console.log('🎯 NewUserBrainPopup: "Got it" button clicked');
    console.log('🎯 Current state - brainRequested:', brainRequested, 'hasAlreadyRequested:', hasAlreadyRequested);
    
    // This should always be true when "Got it" is shown
    const brainWasRequested = true;
    console.log('🎯 Calling onClose with brainWasRequested:', brainWasRequested);
    
    onClose(brainWasRequested);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={20} color="#666666" />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                {(brainRequested || hasAlreadyRequested) ? (
                  <Clock size={24} color="#FFFFFF" />
                ) : (
                  <UserPlus size={24} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.title}>
                {(brainRequested || hasAlreadyRequested) ? 'Brain Request Pending' : 'Welcome to Brain'}
              </Text>
              {userInfo?.name && (
                <Text style={styles.subtitle}>
                  Hi {userInfo.name}! 👋
                </Text>
              )}
            </View>

            {/* Body */}
            <View style={styles.body}>
              {(!brainRequested && !hasAlreadyRequested) ? (
                <>
                  <Text style={styles.description}>
                    To start building your knowledge base, you'll need to request access to your personal Brain storage.
                  </Text>
                  
                  <View style={styles.features}>
                    <View style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>Secure personal storage space</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>AI-powered search capabilities</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>Team collaboration features</Text>
                    </View>
                    <View style={styles.featureItem}>
                      <View style={styles.featureBullet} />
                      <Text style={styles.featureText}>Advanced content organization</Text>
                    </View>
                  </View>

                  <View style={styles.infoBox}>
                    <AlertCircle size={16} color="#2563EB" />
                    <Text style={styles.infoText}>
                      We’ll set up your dedicated storage space to ensure top-level security and seamless performance for your data
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.description}>
                    {hasAlreadyRequested 
                      ? 'Your Brain request is being processed. Our team is setting up your dedicated storage space.'
                      : 'Your Brain request has been submitted successfully! Our team is setting up your dedicated storage space.'
                    }
                  </Text>
                  
                  <View style={styles.waitingInfo}>
                    <View style={styles.waitingIcon}>
                      <Clock size={20} color="#666666" />
                    </View>
                    <View style={styles.waitingText}>
                      <Text style={styles.waitingTitle}>Expected Setup Time</Text>
                      <Text style={styles.waitingSubtitle}>4 - 6 hours</Text>
                    </View>
                  </View>
                  
                  <Text style={styles.waitingNote}>
                    You'll receive a notification once your Brain is ready to use. Thank you for your patience!
                  </Text>

                  <View style={styles.nextStepsBox}>
                    <Text style={styles.nextStepsTitle}>What happens next:</Text>
                    <Text style={styles.nextStepsText}>
                      1. You’ve been allotted a dedicated, secure storage space for your files and manuals{'\n'}
                      2. You’ll receive a notification as soon as your storage is ready{'\n'}
                      3. Upload your content, including images, manuals, and other documents.{'\n'}
                      4. Upload content (requires Super Engineer approval){'\n'}
                      5. Start building and organizing your personalized knowledge base!
                    </Text>
                  </View>

                  <View style={styles.reminderBox}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.reminderText}>
                      Brain features will be unavailable until your request is approved by our team.
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {(!brainRequested && !hasAlreadyRequested) ? (
                <>
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleMaybeLater}
                    disabled={isLoading}
                  >
                    <Text style={styles.secondaryText}>Maybe Later</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    onPress={handleBrainRequest}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Text style={styles.primaryText}>Requesting...</Text>
                    ) : (
                      <>
                        <Brain size={18} color="#FFFFFF" />
                        <Text style={styles.primaryText}>Request Brain</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleGotIt}
                >
                  <Check size={18} color="#FFFFFF" />
                  <Text style={styles.primaryText}>Got it</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 40, // More space for status bar elements
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, // Space for home indicator
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 480,
    // Content-sized container with max height for very small screens
    maxHeight: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 110 : 60),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scrollContainer: {
    // Let ScrollView be content-sized, no flex
  },
  scrollContent: {
    padding: Platform.OS === 'web' ? 24 : 20, // Slightly reduced padding for mobile
    paddingTop: Platform.OS === 'web' ? 32 : 28, // Reduced top padding for mobile
  },
  header: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 24 : 16, // Reduced margin for mobile
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'web' ? 24 : 16, // Reduced padding for mobile
  },
  iconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: Platform.OS === 'web' ? 20 : 18, // Slightly smaller on mobile
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: Platform.OS === 'web' ? 16 : 14, // Slightly smaller on mobile
    color: '#666666',
    textAlign: 'center',
  },
  body: {
    marginBottom: Platform.OS === 'web' ? 24 : 16, // Reduced margin for mobile
  },
  description: {
    fontSize: Platform.OS === 'web' ? 16 : 15, // Slightly smaller on mobile
    color: '#666666',
    lineHeight: Platform.OS === 'web' ? 22 : 20, // Adjusted line height
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 20 : 16, // Reduced margin for mobile
  },
  features: {
    marginBottom: Platform.OS === 'web' ? 20 : 16, // Reduced margin for mobile
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 12 : 8, // Reduced margin for mobile
  },
  featureBullet: {
    width: Platform.OS === 'web' ? 6 : 5, // Smaller bullet for mobile
    height: Platform.OS === 'web' ? 6 : 5, // Smaller bullet for mobile
    backgroundColor: '#000000',
    borderRadius: Platform.OS === 'web' ? 3 : 2.5, // Adjusted border radius
    marginRight: 12,
  },
  featureText: {
    fontSize: Platform.OS === 'web' ? 14 : 13, // Slightly smaller on mobile
    color: '#666666',
    lineHeight: Platform.OS === 'web' ? 20 : 18, // Adjusted line height
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 10, // Reduced padding for mobile
    gap: 8,
  },
  infoText: {
    fontSize: Platform.OS === 'web' ? 12 : 11, // Slightly smaller on mobile
    color: '#2563EB',
    lineHeight: Platform.OS === 'web' ? 16 : 15, // Adjusted line height
    flex: 1,
  },
  waitingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: Platform.OS === 'web' ? 16 : 12, // Reduced padding for mobile
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced margin for mobile
  },
  waitingIcon: {
    width: Platform.OS === 'web' ? 40 : 36, // Smaller on mobile
    height: Platform.OS === 'web' ? 40 : 36, // Smaller on mobile
    backgroundColor: '#FFFFFF',
    borderRadius: Platform.OS === 'web' ? 20 : 18, // Adjusted radius
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  waitingText: {
    flex: 1,
  },
  waitingTitle: {
    fontSize: Platform.OS === 'web' ? 14 : 13, // Slightly smaller on mobile
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  waitingSubtitle: {
    fontSize: Platform.OS === 'web' ? 16 : 15, // Slightly smaller on mobile
    fontWeight: '700',
    color: '#666666',
  },
  waitingNote: {
    fontSize: Platform.OS === 'web' ? 14 : 13, // Slightly smaller on mobile
    color: '#666666',
    lineHeight: Platform.OS === 'web' ? 20 : 18, // Adjusted line height
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced margin for mobile
  },
  nextStepsBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 10, // Reduced padding for mobile
    marginBottom: Platform.OS === 'web' ? 8 : 6, // Reduced margin for mobile
  },
  nextStepsTitle: {
    fontSize: Platform.OS === 'web' ? 13 : 12, // Slightly smaller on mobile
    fontWeight: '600',
    color: '#166534',
    marginBottom: 6,
  },
  nextStepsText: {
    fontSize: Platform.OS === 'web' ? 12 : 11, // Slightly smaller on mobile
    color: '#15803D',
    lineHeight: Platform.OS === 'web' ? 16 : 15, // Adjusted line height
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: Platform.OS === 'web' ? 12 : 10, // Reduced padding for mobile
    gap: 8,
  },
  reminderText: {
    fontSize: Platform.OS === 'web' ? 12 : 11, // Slightly smaller on mobile
    color: '#DC2626',
    lineHeight: Platform.OS === 'web' ? 16 : 15, // Adjusted line height
    flex: 1,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'web' ? 14 : 12, // Reduced padding for mobile
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    fontSize: Platform.OS === 'web' ? 16 : 15, // Slightly smaller on mobile
    fontWeight: '600',
    color: '#666666',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'web' ? 14 : 12, // Reduced padding for mobile
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  primaryText: {
    fontSize: Platform.OS === 'web' ? 16 : 15, // Slightly smaller on mobile
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default NewUserBrainPopup;
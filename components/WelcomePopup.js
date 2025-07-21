// components/WelcomePopup.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Settings,
  MessageCircle,
  X,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomePopup({ 
  visible, 
  onPersonalize, 
  onStartChatting, 
  onClose,
  userName = "Engineer",
  navigation // Navigation prop
}) {
  const isMobile = Dimensions.get('window').width < 768;
  
  // Enhanced handle personalization click with correct route order
  const handlePersonalizeClick = () => {
    console.log('🎯 WelcomePopup: Personalize clicked');
    console.log('🎯 onPersonalize function available:', !!onPersonalize);
    console.log('🎯 navigation object available:', !!navigation);
    
    onClose(); // Close the popup first
    
    // Small delay to ensure popup closes smoothly
    setTimeout(() => {
      // First try: Use the onPersonalize function passed from ChatPage
      if (onPersonalize && typeof onPersonalize === 'function') {
        console.log('🎯 Using onPersonalize function from ChatPage');
        try {
          onPersonalize();
          return;
        } catch (error) {
          console.warn('🎯 onPersonalize function failed:', error);
        }
      }
      
      // Second try: Direct navigation if navigation object is available
      if (navigation && typeof navigation.navigate === 'function') {
        console.log('🎯 Attempting direct navigation to settings');
        
        // FIXED: Try "Settings" first since that's what exists in the navigation stack
        const possibleRoutes = [
          'Settings',        // ✅ This is the correct route name from the logs
          'SettingsPage',    // Keep as fallback
          'SettingsScreen',
          'UserSettings',
          'ProfileSettings'
        ];
        
        let navigationSuccessful = false;
        
        for (const routeName of possibleRoutes) {
          try {
            console.log(`🎯 Trying to navigate to: ${routeName}`);
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
              console.log(`🎯 Trying to navigate to ${routeName} without params`);
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
          // Show user-friendly error
          Alert.alert(
            'Navigation Error',
            'Unable to open personalization settings. The Settings route exists but navigation failed.',
            [
              { text: 'OK' },
              { 
                text: 'Debug Info', 
                onPress: () => {
                  const debugInfo = `
Available navigation methods: ${navigation ? Object.keys(navigation).join(', ') : 'None'}

Your navigation stack has these routes:
- Settings ✓ (exists)
- Chat ✓ (exists)  
- Admin ✓ (exists)

Attempted routes: ${possibleRoutes.join(', ')}

The route "Settings" should work - please check your SettingsPage component.`;
                  
                  Alert.alert('Debug Information', debugInfo);
                }
              }
            ]
          );
        }
      } else {
        console.warn('🎯 No valid navigation method available');
        Alert.alert(
          'Configuration Error',
          'Navigation is not properly configured. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    }, 150);
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#666666" />
          </TouchableOpacity>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header with Logo and Sparkles */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/SuperEngineer_Logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <View style={styles.sparkleIcon}>
                  <Sparkles size={24} color="#FFD700" fill="#FFD700" />
                </View>
              </View>
            </View>

            {/* Welcome Content */}
            <View style={styles.content}>
              <Text style={styles.welcomeTitle}>
                Welcome to Super Engineer!
              </Text>
              <Text style={styles.welcomeSubtitle}>
                Hey {userName}! 👋
              </Text>
              <Text style={styles.welcomeDescription}>
                Your Super Engineer is ready to help you instantly resolve your technical queries, 
                troubleshoot onsite issues, and simplify complex problems with precise Solutions. 
              </Text>

              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet} />
                  <Text style={styles.featureText}>
                    AI-powered engineering assistance
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet} />
                  <Text style={styles.featureText}>
                    Personalized responses based on your expertise
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.featureBullet} />
                  <Text style={styles.featureText}>
                    Low-cost, high-impact engineering solutions
                  </Text>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              {/* Personalize Button (Black) */}
              <TouchableOpacity 
                style={styles.personalizeButton}
                onPress={handlePersonalizeClick}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#000000', '#333333']}
                  style={styles.buttonGradient}
                >
                  <Settings size={18} color="#FFFFFF" />
                  <Text style={styles.personalizeButtonText}>
                    Personalize Experience
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Start Chatting Button (White) */}
              <TouchableOpacity 
                style={styles.startChattingButton}
                onPress={onStartChatting}
                activeOpacity={0.8}
              >
                <MessageCircle size={18} color="#000000" />
                <Text style={styles.startChattingButtonText}>
                  Start Chatting
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              You can always customize your preferences later in Settings
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

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
    maxWidth: 400,
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
  },
  logoContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'web' ? 0 : -8, // Reduce space between logo and title on mobile
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  sparkleIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 50,
    zIndex: 50,
  },
  content: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 32 : 20, // Reduced margin for mobile
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 8 : 6, // Reduced margin for mobile
    marginTop: Platform.OS === 'web' ? 0 : 8, // Add small top margin for mobile
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced margin for mobile
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Platform.OS === 'web' ? 24 : 16, // Reduced margin for mobile
  },
  featuresList: {
    width: '100%',
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 12 : 8, // Reduced margin for mobile
    paddingHorizontal: 8,
  },
  featureBullet: {
    width: Platform.OS === 'web' ? 6 : 5, // Smaller bullet for mobile
    height: Platform.OS === 'web' ? 6 : 5, // Smaller bullet for mobile
    borderRadius: Platform.OS === 'web' ? 3 : 2.5, // Adjusted border radius
    backgroundColor: '#000000',
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#555555',
    flex: 1,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: Platform.OS === 'web' ? 16 : 12, // Reduced margin for mobile
  },
  personalizeButton: {
    marginBottom: Platform.OS === 'web' ? 12 : 8, // Reduced margin for mobile
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  personalizeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  startChattingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  startChattingButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footerNote: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
// screens/PaymentSuccessScreen.js - Fixed with better error handling

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight,
  RefreshCw,
  AlertCircle 
} from 'lucide-react-native';

const API_BASE_URL = __DEV__ 
  ? "http://localhost:8000" 
  : "https://your-production-api.com";

export default function PaymentSuccessScreen() {
  const [paymentStatus, setPaymentStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const navigation = useNavigation();
  const route = useRoute();

  // ✅ Get session ID from route params or URL params
  const getSessionId = () => {
    // From route params (deep linking)
    if (route?.params?.session_id) {
      return route.params.session_id;
    }

    // From URL search params (web fallback)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      if (sessionId) {
        return sessionId;
      }
    }

    return null;
  };

  const sessionId = getSessionId();

  useEffect(() => {
    console.log('💳 PaymentSuccessScreen mounted');
    console.log('🔍 Session ID:', sessionId);
    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 Route params:', route?.params);
    
    if (sessionId) {
      handlePaymentVerification();
    } else {
      console.error('❌ No session ID found');
      setPaymentStatus('failed');
      setErrorMessage('Payment session ID not found. Please try again.');
    }
  }, [sessionId]);

  const handlePaymentVerification = async () => {
    try {
      console.log('🔍 Verifying payment for session:', sessionId);
      setErrorMessage(''); // Clear previous errors
      
      // ✅ Enhanced API call with better error handling
      const response = await fetch(`${API_BASE_URL}/subscriptions/payment-status/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for network requests
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      console.log('📋 Payment status response status:', response.status);
      
      if (!response.ok) {
        // Handle different HTTP status codes
        if (response.status === 404) {
          throw new Error('Payment session not found. This may be a test payment.');
        } else if (response.status === 500) {
          throw new Error('Server error. Please try again or contact support.');
        } else {
          throw new Error(`Payment verification failed (Status: ${response.status})`);
        }
      }

      const paymentData = await response.json();
      console.log('📋 Payment data:', paymentData);
      
      setPaymentDetails(paymentData);

      if (paymentData.status === 'succeeded') {
        // Payment successful - get user subscription status
        await updateSubscriptionStatus(paymentData);
        setPaymentStatus('success');
      } else if (paymentData.status === 'pending') {
        setPaymentStatus('pending');
        // Retry after delay (max 5 attempts)
        if (retryCount < 5) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            handlePaymentVerification();
          }, 3000);
        } else {
          setPaymentStatus('failed');
          setErrorMessage('Payment verification timed out. Please check your email or contact support.');
        }
      } else {
        setPaymentStatus('failed');
        setErrorMessage('Payment was not successful. Please try again.');
      }

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        setErrorMessage('Request timed out. Please check your internet connection and try again.');
      } else if (error.message.includes('fetch')) {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage(error.message || 'Payment verification failed. Please try again.');
      }
      
      setPaymentStatus('failed');
    }
  };

  const updateSubscriptionStatus = async (paymentData) => {
    try {
      // Get user email
      const userEmail = await AsyncStorage.getItem('userEmail');
      if (!userEmail) {
        console.warn('⚠️ No user email found');
        return;
      }

      console.log('🔄 Updating subscription status for:', userEmail);

      // Get updated subscription from backend
      const subResponse = await fetch(`${API_BASE_URL}/subscriptions/current/${userEmail}`);
      if (subResponse.ok) {
        const subData = await subResponse.json();
        console.log('📋 Updated subscription:', subData);
        
        setSubscriptionData(subData);
        
        // Update local storage
        await AsyncStorage.multiSet([
          ['userPlan', subData.plan || 'free'],
          ['subscriptionActive', subData.has_subscription ? 'true' : 'false'],
        ]);
      } else {
        console.warn('⚠️ Could not fetch updated subscription data');
      }
    } catch (error) {
      console.error('Error updating subscription status:', error);
    }
  };

  const handleContinue = async () => {
    try {
      // Ensure user is authenticated
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      
      if (isAuthenticated === 'true') {
        // Navigate to main app
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
      } else {
        // Navigate to login
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      navigation.navigate('Home');
    }
  };

  const handleRetry = () => {
    setPaymentStatus('loading');
    setRetryCount(0);
    setErrorMessage('');
    handlePaymentVerification();
  };

  const handleContactSupport = () => {
    // You can implement email client opening or navigation to support page
    console.log('Contact support clicked');
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <View style={styles.contentContainer}>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color="#000" />
            </View>
            <Text style={styles.title}>Verifying Payment</Text>
            <Text style={styles.description}>
              Please wait while we confirm your payment...
            </Text>
            {retryCount > 0 && (
              <Text style={styles.retryText}>
                Attempt {retryCount + 1} of 6
              </Text>
            )}
          </View>
        );

      case 'success':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, styles.successContainer]}>
              <CheckCircle size={80} color="#16A34A" />
            </View>
            <Text style={[styles.title, styles.successTitle]}>Payment Successful! 🎉</Text>
            <Text style={styles.description}>
              Your subscription has been activated successfully.
            </Text>
            
            {subscriptionData && (
              <View style={styles.subscriptionDetails}>
                <Text style={styles.detailsTitle}>Subscription Details:</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Plan:</Text>
                  <Text style={styles.detailValue}>{subscriptionData.plan_display || subscriptionData.plan}</Text>
                </View>
                {subscriptionData.billing_cycle && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Billing:</Text>
                    <Text style={styles.detailValue}>{subscriptionData.billing_cycle}</Text>
                  </View>
                )}
                {subscriptionData.expiry_date && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Next Renewal:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(subscriptionData.expiry_date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.continueButtonText}>Continue to App</Text>
              <ArrowRight size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        );

      case 'pending':
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, styles.pendingContainer]}>
              <Clock size={80} color="#F59E0B" />
            </View>
            <Text style={[styles.title, styles.pendingTitle]}>Payment Processing</Text>
            <Text style={styles.description}>
              Your payment is being processed. This may take a few minutes.
            </Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <RefreshCw size={20} color="#000" style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Check Again</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
              <Text style={styles.skipButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        );

      case 'failed':
      default:
        return (
          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, styles.errorContainer]}>
              <XCircle size={80} color="#DC2626" />
            </View>
            <Text style={[styles.title, styles.errorTitle]}>Payment Failed</Text>
            <Text style={styles.description}>
              {errorMessage || 'We couldn\'t process your payment. Please try again or contact support.'}
            </Text>

            {/* Show different options based on error type */}
            <View style={styles.actionContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <RefreshCw size={16} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryButton} 
                onPress={() => navigation.navigate('Pricing')}
              >
                <Text style={styles.secondaryButtonText}>Back to Pricing</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.skipButton} onPress={handleContinue}>
                <Text style={styles.skipButtonText}>Continue to App</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <LinearGradient
      colors={['#F9FAFB', '#FFFFFF']}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Payment Status</Text>
        </View>



        {/* Content */}
        {renderContent()}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help? Contact support@superengineer.com
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  debugInfo: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    margin: 10,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#92400E',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginBottom: 2,
  },
  debugError: {
    color: '#DC2626',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
  },
  successContainer: {
    backgroundColor: '#DCFCE7',
  },
  pendingContainer: {
    backgroundColor: '#FEF3C7',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  successTitle: {
    color: '#16A34A',
  },
  pendingTitle: {
    color: '#F59E0B',
  },
  errorTitle: {
    color: '#DC2626',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8,
  },
  subscriptionDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
    maxWidth: 400,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  actionContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 200,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#F3F4F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 160,
  },
  retryButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
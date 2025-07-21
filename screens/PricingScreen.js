// screens/PricingScreen.js - Updated for Expo with Web-only Stripe

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Switch as RNSwitch,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  Check,
  Heart,
  User,
  Users,
  Server,
  Star,
  ArrowLeft,
  Crown,
  CreditCard,
  ExternalLink,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ API Configuration for Expo
const API_BASE_URL = __DEV__ 
  ? "http://localhost:8000" 
  : "https://your-production-api.com"; // Replace with your production URL

export default function PricingScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // ✅ Check if this is a signup flow
  const isSignupFlow = route?.params?.isSignupFlow || false;

  // ✅ API Service with proper error handling
  const apiService = {
    // Get user email from storage
    getUserEmail: async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail') || 
                     await AsyncStorage.getItem('signupUserEmail');
        console.log('📧 Retrieved user email:', email);
        return email;
      } catch (error) {
        console.error('Error getting user email:', error);
        return null;
      }
    },

    // Create payment intent for WEB
    createPaymentForWeb: async (email, planId, billingCycle) => {
      try {
        console.log('🌐 Creating web payment:', { email, planId, billingCycle });
        
        const response = await fetch(`${API_BASE_URL}/subscriptions/create-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            plan_id: planId,
            billing_cycle: billingCycle,
          }),
        });

        const data = await response.json();
        console.log('📋 Web payment response:', data);

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to create payment');
        }

        return data;
      } catch (error) {
        console.error('❌ Web payment error:', error);
        throw error;
      }
    },

    // Create checkout session for WEB
    createCheckoutSessionForWeb: async (email, planId, billingCycle) => {
      try {
        console.log('🌐 Creating checkout session for web:', { email, planId, billingCycle });
        
        const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            plan_id: planId,
            billing_cycle: billingCycle,
            success_url: Platform.OS === 'web' 
              ? `${window.location.origin}/payment-success` 
              : 'superengineer://payment-success',
            cancel_url: Platform.OS === 'web' 
              ? `${window.location.origin}/pricing` 
              : 'superengineer://pricing',
          }),
        });

        const data = await response.json();
        console.log('📋 Checkout session response:', data);

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to create checkout session');
        }

        return data;
      } catch (error) {
        console.error('❌ Checkout session error:', error);
        throw error;
      }
    },

    // Activate free plan
    activateFreePlan: async (email) => {
      try {
        console.log('🆓 Activating free plan for:', email);
        
        const response = await fetch(`${API_BASE_URL}/subscriptions/activate-free`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();
        console.log('📋 Free plan response:', data);

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to activate free plan');
        }

        return data;
      } catch (error) {
        console.error('❌ Free plan error:', error);
        throw error;
      }
    },

    // Get current subscription
    getCurrentSubscription: async (email) => {
      try {
        console.log('📋 Getting subscription for:', email);
        
        const response = await fetch(`${API_BASE_URL}/subscriptions/current/${email}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to get subscription');
        }

        console.log('📋 Current subscription:', data);
        return data;
      } catch (error) {
        console.error('❌ Get subscription error:', error);
        throw error;
      }
    },

    // Get subscription plans
    getPlans: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/subscriptions/plans`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.detail || 'Failed to get plans');
        }

        return data;
      } catch (error) {
        console.error('❌ Get plans error:', error);
        throw error;
      }
    }
  };

  // ✅ Initialize data on component mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Get user email
        const email = await apiService.getUserEmail();
        if (email) {
          setUserEmail(email);
          console.log('👤 User email loaded:', email);
        } else {
          console.warn('⚠️ No user email found');
        }

        if (isSignupFlow) {
          // For signup flow, user doesn't have a current plan yet
          setCurrentPlan(null);
          console.log('🆕 Signup flow detected');
        } else {
          // Get current subscription from backend
          if (email) {
            try {
              const subscription = await apiService.getCurrentSubscription(email);
              const plan = subscription.plan || 'free';
              setCurrentPlan(plan);
              console.log('📋 Current plan loaded:', plan);
            } catch (error) {
              console.log('⚠️ Could not get subscription, defaulting to free');
              setCurrentPlan('free');
            }
          }
        }

        // Optionally load plans from backend (you can remove this if using static plans)
        try {
          const plansData = await apiService.getPlans();
          if (plansData?.plans) {
            setPlans(plansData.plans);
            console.log('📋 Loaded plans from backend:', plansData.plans.length);
          }
        } catch (error) {
          console.log('⚠️ Using static plans');
        }

      } catch (error) {
        console.error('Error initializing data:', error);
        setCurrentPlan('free');
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [route?.params, isSignupFlow]);

  // ✅ Plan data (matching your backend structure)
  const allPlans = [
    {
      id: 'free',
      backendId: 1, // Free plan ID from backend
      name: 'Free',
      icon: Heart,
      monthlyPrice: 0,
      yearlyPrice: 0,
      queries: '10 prompts/week',
      users: '1 user account',
      features: [
        'Personalized Responses',
        'Basic Knowledge Base Development',
        'Essential AI Interaction',
      ],
      description: 'Perfect for getting started',
    },
    {
      id: 'solo',
      backendId: 2, // Solo plan ID from backend
      name: 'Solo',
      icon: User,
      monthlyPrice: 10,
      yearlyPrice: 100,
      queries: '250 queries/month',
      users: '1 user account',
      features: [
        'Personalized Responses',
        'Ninja Mode (Advanced Problem Solver)',
        'Meme Mode (Interactive Humor)',
        'Secure Personal Storage Space',
        'Advanced Knowledge Base Building',
      ],
      description: 'Ideal for individual power users',
    },
    {
      id: 'team',
      backendId: 3, // Team plan ID from backend
      name: 'Team',
      icon: Users,
      monthlyPrice: 30,
      yearlyPrice: 300,
      queries: 'Unlimited queries',
      users: '1 Admin + up to 10 Team Members',
      features: [
        'Fully Personalized AI Responses',
        'Ninja Mode (Advanced Problem Solver)',
        'Meme Mode (Interactive Humor)',
        'Location Mode (Site Equipment Manager)',
        'Dedicated Secure Personal Storage Space',
        'Robust Admin Panel',
        'Integrated Document Management System',
        'Real-Time Team Monitoring & Insights',
        'Expanded Team Knowledge Base',
      ],
      description: 'Built for growing teams',
      popular: true,
    },
    {
      id: 'enterprise',
      backendId: 4, // Enterprise plan ID from backend
      name: 'Enterprise',
      icon: Server,
      monthlyPrice: null,
      yearlyPrice: null,
      queries: 'Unlimited queries & Full Customization',
      users: 'Customizable based on your requirements',
      features: [
        'All features from Team, plus:',
        'Custom AI Model Training',
        'Dedicated Support Manager',
        'SLA Guarantees',
        'Custom Integration Solutions',
        'Advanced Analytics Dashboard',
      ],
      description: 'Enterprise-grade solution',
      custom: true,
    },
  ];

  // ✅ Handle payments differently for Web vs Native
  const handlePayment = async (planId, amount, billingCycle) => {
    setPaymentLoading(true);

    try {
      if (!userEmail) {
        throw new Error('User email not found. Please log in again.');
      }

      const plan = allPlans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Invalid plan selected');
      }

      console.log('💳 Processing payment:', { 
        planId, 
        backendPlanId: plan.backendId, 
        amount, 
        billingCycle,
        platform: Platform.OS 
      });

      if (Platform.OS === 'web') {
        // ✅ For WEB: Use Stripe Checkout (redirect to Stripe)
        const checkoutData = await apiService.createCheckoutSessionForWeb(
          userEmail,
          plan.backendId,
          billingCycle === 'year' ? 'yearly' : 'monthly'
        );

        if (checkoutData.success && checkoutData.checkout_url) {
          console.log('🌐 Redirecting to Stripe Checkout:', checkoutData.checkout_url);
          
          // Redirect to Stripe Checkout
          window.location.href = checkoutData.checkout_url;
          
          return {
            success: true,
            paymentId: checkoutData.session_id,
            redirected: true
          };
        } else {
          throw new Error('Failed to create checkout session');
        }

      } else {
        // ✅ For NATIVE: Redirect to web version or show alternative
        Alert.alert(
          'Payment Required',
          'To complete your purchase, we\'ll redirect you to our secure web payment page.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setPaymentLoading(false);
                setSelectedPlan(null);
              }
            },
            {
              text: 'Continue to Web',
              onPress: async () => {
                try {
                  // Create checkout session for native redirect
                  const checkoutData = await apiService.createCheckoutSessionForWeb(
                    userEmail,
                    plan.backendId,
                    billingCycle === 'year' ? 'yearly' : 'monthly'
                  );

                  if (checkoutData.success && checkoutData.checkout_url) {
                    console.log('📱 Opening web checkout in browser:', checkoutData.checkout_url);
                    
                    // Open in device browser
                    const supported = await Linking.canOpenURL(checkoutData.checkout_url);
                    
                    if (supported) {
                      await Linking.openURL(checkoutData.checkout_url);
                      
                      // Show message to user
                      Alert.alert(
                        'Payment in Progress',
                        'Please complete your payment in the browser. Return to the app when done.',
                        [
                          {
                            text: 'I completed payment',
                            onPress: () => {
                              // You could check payment status here
                              setPaymentLoading(false);
                              setSelectedPlan(null);
                              
                              // Optionally refresh subscription status
                              setTimeout(() => {
                                initializeData();
                              }, 2000);
                            }
                          },
                          {
                            text: 'Cancel',
                            style: 'cancel',
                            onPress: () => {
                              setPaymentLoading(false);
                              setSelectedPlan(null);
                            }
                          }
                        ]
                      );
                      
                      return {
                        success: true,
                        paymentId: checkoutData.session_id,
                        redirected: true
                      };
                    } else {
                      throw new Error('Cannot open payment page');
                    }
                  } else {
                    throw new Error('Failed to create payment session');
                  }
                } catch (error) {
                  console.error('❌ Native payment redirect error:', error);
                  setPaymentLoading(false);
                  setSelectedPlan(null);
                  throw error;
                }
              }
            }
          ]
        );
        
        // Return pending state for native
        return {
          success: false,
          pending: true
        };
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentLoading(false);
      throw error;
    }
  };

  // ✅ Complete signup process
  const completeSignup = async (planId) => {
    try {
      console.log('🎯 Completing signup with plan:', planId);

      // Get signup data
      const signupData = {
        userEmail: await AsyncStorage.getItem('signupUserEmail'),
        userName: await AsyncStorage.getItem('signupUserName'),
        has2FA: await AsyncStorage.getItem('signupHas2FA'),
        userRole: await AsyncStorage.getItem('signupUserRole'),
      };

      if (!signupData.userEmail) {
        throw new Error('User email not found during signup');
      }

      // Set permanent user data
      await AsyncStorage.multiSet([
        ['userEmail', signupData.userEmail],
        ['userName', signupData.userName || ''],
        ['has2FA', signupData.has2FA || 'false'],
        ['userRole', signupData.userRole || 'user'],
        ['userPlan', planId],
        ['isAuthenticated', 'true'],
        ['hasCompletedOnboarding', 'true'], // ✅ Mark onboarding as complete
      ]);

      // Set query limits based on plan
      let queryLimit;
      switch (planId) {
        case 'free': queryLimit = '10'; break;
        case 'solo': queryLimit = '250'; break;
        case 'team':
        case 'enterprise': queryLimit = '999'; break;
        default: queryLimit = '10';
      }
      await AsyncStorage.setItem('freeQueries', queryLimit);

      // Clean up temporary signup data
      await AsyncStorage.multiRemove([
        'signupUserEmail',
        'signupUserName', 
        'signupHas2FA',
        'signupUserRole'
      ]);

      console.log('✅ Signup completed successfully');

      // ✅ Navigate to main app (not back to pricing)
      if (signupData.has2FA === 'true') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Setup2FA' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat' }], // Or your main screen
        });
      }
    } catch (error) {
      console.error('Error completing signup:', error);
      Alert.alert('Error', 'Failed to complete signup. Please try again.');
    }
  };

  // ✅ Handle plan selection
  const handleSelectPlan = async (planId) => {
    if (!isSignupFlow && planId === currentPlan) {
      Alert.alert('Current Plan', 'You are already on this plan.');
      return;
    }

    console.log('🎯 Plan selected:', planId);

    // Handle Free plan
    if (planId === 'free') {
      if (isSignupFlow) {
        try {
          // Activate free plan on backend
          if (userEmail) {
            await apiService.activateFreePlan(userEmail);
            console.log('✅ Free plan activated on backend');
          }
          completeSignup(planId);
          return;
        } catch (error) {
          console.error('Error activating free plan:', error);
          // Still proceed with signup even if backend call fails
          completeSignup(planId);
          return;
        }
      } else {
        // For existing users switching to free
        Alert.alert(
          'Switch to Free Plan',
          'Are you sure you want to switch to the Free plan?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Switch Plan',
              onPress: async () => {
                try {
                  if (userEmail) {
                    await apiService.activateFreePlan(userEmail);
                  }
                  await AsyncStorage.multiSet([
                    ['userPlan', planId],
                    ['freeQueries', '10']
                  ]);
                  setCurrentPlan(planId);
                  Alert.alert('Success!', 'You have switched to the Free plan.');
                } catch (error) {
                  console.error('Error switching to free plan:', error);
                  Alert.alert('Error', 'Failed to update your plan. Please try again.');
                }
              },
            },
          ]
        );
        return;
      }
    }

    // Handle Enterprise plan
    if (planId === 'enterprise') {
      Alert.alert(
        'Enterprise Plan',
        'Contact our sales team for enterprise pricing and features.',
        [
          {
            text: 'Contact Sales',
            onPress: () => {
              setSelectedPlan(null);
              if (isSignupFlow) {
                completeSignup('enterprise');
              }
              // Here you could open email client or website
              const emailUrl = 'mailto:sales@superengineer.com?subject=Enterprise Plan Inquiry';
              Linking.canOpenURL(emailUrl).then(supported => {
                if (supported) {
                  Linking.openURL(emailUrl);
                }
              });
            },
          },
          { text: 'Cancel', style: 'cancel', onPress: () => setSelectedPlan(null) },
        ]
      );
      return;
    }

    // Handle Paid plans
    setSelectedPlan(planId);
    const plan = allPlans.find(p => p.id === planId);
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const billingCycle = isYearly ? 'year' : 'month';

    const platformMessage = Platform.OS === 'web' 
      ? '' 
      : '\n\nYou will be redirected to our secure web payment page.';

    Alert.alert(
      isSignupFlow ? 'Complete Registration' : 'Upgrade Plan',
      `${isSignupFlow ? 'Complete registration with' : 'Upgrade to'} ${plan.name} plan for £${price}/${billingCycle}?${platformMessage}`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setSelectedPlan(null) },
        {
          text: 'Continue',
          onPress: async () => {
            try {
              const paymentResult = await handlePayment(planId, price, billingCycle);
              
              if (paymentResult.success) {
                if (Platform.OS === 'web') {
                  // For web, payment will be handled by Stripe redirect
                  console.log('🌐 Payment redirected to Stripe');
                } else {
                  // For native, payment is handled in browser
                  console.log('📱 Payment redirected to browser');
                }
              } else if (paymentResult.pending) {
                // Native app - payment is being handled externally
                console.log('📱 Payment pending in browser');
              }
            } catch (error) {
              setSelectedPlan(null);
              Alert.alert(
                'Payment Error',
                error.message || 'Payment could not be processed. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  // Rest of your component rendering code remains the same...
  const isWide = width >= 768;
  const horizontalPadding = 20;
  const innerWidth = width - horizontalPadding * 2;
  const maxCardWidth = 300;
  const cardMargin = 16;
  const count = allPlans.length;

  const isNative = Platform.OS !== 'web';
  const topPadding = isNative ? Math.max(insets.top + 20, 40) : 0;
  const bottomPadding = isNative ? Math.max(insets.bottom + 20, 20) : 0;

  let cardWidth;
  let columns;
  
  if (isWide) {
    columns = count >= 4 ? 2 : count;
    const totalMargin = cardMargin * (columns - 1);
    const per = (innerWidth - totalMargin) / columns;
    cardWidth = Math.min(per, maxCardWidth);
  } else {
    columns = 1;
    cardWidth = innerWidth;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#000" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Payment Loading Overlay */}
      {paymentLoading && (
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentModal}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.paymentTitle}>
              {Platform.OS === 'web' ? 'Redirecting to Payment...' : 'Opening Payment Page...'}
            </Text>
            <Text style={styles.paymentDescription}>
              {Platform.OS === 'web' 
                ? 'Please wait while we redirect you to Stripe...' 
                : 'Opening secure payment page in your browser...'}
            </Text>
          </View>
        </View>
      )}
      
      {/* Header - Only show on web or when there's navigation */}
      {(Platform.OS === 'web' || navigation?.goBack) && (
        <View style={styles.header}>
          {navigation?.goBack && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>Unlock Your Potential</Text>
          <Text style={styles.subtitle}>
            Choose the perfect plan for your engineering needs and start building amazing things today.
          </Text>
        </View>

        {/* Billing Toggle */}
        <View style={styles.toggleRow}>
          <Text style={[styles.toggleLabel, !isYearly && styles.toggleLabelActive]}>
            Monthly
          </Text>
          <RNSwitch
            value={isYearly}
            onValueChange={setIsYearly}
            trackColor={{ true: '#000', false: '#E5E7EB' }}
            thumbColor="#FFF"
            ios_backgroundColor="#E5E7EB"
            style={styles.toggleSwitch}
          />
          <Text style={[styles.toggleLabel, isYearly && styles.toggleLabelActive]}>
            Yearly
          </Text>
          {isYearly && (
            <View style={styles.saveBadge}>
              <Text style={styles.saveBadgeText}>Save 10%</Text>
            </View>
          )}
        </View>

        {/* Plans Grid */}
        <View style={[styles.plansContainer, isWide ? styles.plansGrid : styles.plansColumn]}>
          {allPlans.map((plan) => {
            const Icon = plan.icon;
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isCurrentPlan = currentPlan === plan.id;
            const isProcessing = selectedPlan === plan.id;
            
            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  plan.popular && styles.popularBorder,
                  isCurrentPlan && styles.currentPlanBorder,
                  { 
                    width: cardWidth,
                    marginBottom: 20,
                    marginHorizontal: isWide ? cardMargin / 2 : 0,
                  },
                ]}
              >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                  <View style={styles.currentPlanBadge}>
                    <Crown size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.currentPlanBadgeText}>Current Plan</Text>
                  </View>
                )}

                {/* Popular Badge */}
                {plan.popular && !isCurrentPlan && (
                  <View style={styles.popularBadge}>
                    <Star size={12} color="#FFF" style={{ marginRight: 4 }} />
                    <Text style={styles.popularBadgeText}>Most Popular</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={[styles.iconWrapper, plan.popular && styles.iconWrapperPopular]}>
                    <Icon size={32} color={plan.popular ? "#FFF" : "#000"} />
                  </View>

                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                  
                  {plan.custom ? (
                    <Text style={styles.customText}>Custom Pricing</Text>
                  ) : (
                    <>
                      <Text style={styles.planPrice}>
                        {price === 0 ? 'Free' : `£${price}`}
                      </Text>
                      {price > 0 && (
                        <Text style={styles.pricePeriod}>
                          per {isYearly ? 'year' : 'month'}
                        </Text>
                      )}
                    </>
                  )}
                  
                  <Text style={styles.planQueries}>{plan.queries}</Text>
                  <Text style={styles.planUsers}>{plan.users}</Text>
                </View>

                <View style={styles.featuresList}>
                  {plan.features.map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Check size={16} color="#16A34A" style={styles.checkIcon} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.selectButton,
                    plan.popular && !isCurrentPlan ? styles.selectButtonPopular : styles.selectButtonDefault,
                    isCurrentPlan && styles.selectButtonCurrent,
                    isProcessing && styles.buttonDisabled,
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                  disabled={isProcessing}
                >
                  {/* Show external link icon for paid plans on native */}
                  {Platform.OS !== 'web' && !plan.custom && plan.id !== 'free' && !isCurrentPlan && (
                    <ExternalLink size={16} color={plan.popular ? "#FFF" : "#000"} style={{ marginRight: 8 }} />
                  )}
                  
                  <Text
                    style={[
                      plan.popular && !isCurrentPlan ? styles.selectButtonTextPopular : styles.selectButtonTextDefault,
                      isCurrentPlan && styles.selectButtonTextCurrent,
                    ]}
                  >
                    {isProcessing
                      ? 'Processing…'
                      : isCurrentPlan
                      ? 'Current Plan'
                      : plan.custom
                      ? 'Contact Sales'
                      : plan.id === 'free'
                      ? 'Start Free'
                      : Platform.OS === 'web'
                      ? 'Choose Plan'
                      : 'Choose Plan (Web)'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Platform-specific payment note */}
        {Platform.OS !== 'web' && (
          <View style={styles.paymentNote}>
            <Text style={styles.paymentNoteText}>
              💳 Secure payments are processed via web browser for your safety
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Need help choosing? Contact our support team.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: isNative ? 20 : 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Your existing styles remain the same, with these additions...
const styles = StyleSheet.create({
  // ... your existing styles ...
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  paymentOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  paymentModal: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginHorizontal: 24,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
    textAlign: 'center',
  },
  paymentDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  paymentNote: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  paymentNoteText: {
    fontSize: 14,
    color: '#0284C7',
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    paddingVertical: 12,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 400,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginHorizontal: 12,
  },
  toggleLabelActive: { 
    color: '#000', 
    fontWeight: '600' 
  },
  toggleSwitch: {
    transform: Platform.OS === 'android' ? [{ scale: 1.2 }] : undefined,
  },
  saveBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 12,
  },
  saveBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  plansContainer: {
    justifyContent: 'center',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  plansColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  popularBorder: { 
    borderColor: '#000',
    borderWidth: 2,
  },
  currentPlanBorder: {
    borderColor: '#059669',
    borderWidth: 2,
  },
  currentPlanBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
  currentPlanBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconWrapperPopular: {
    backgroundColor: '#000',
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  customText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  planQueries: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '500',
  },
  planUsers: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  featuresList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  checkIcon: { 
    marginRight: 10, 
    marginTop: 2 
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flexShrink: 1,
    lineHeight: 20,
  },
  selectButton: {
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectButtonDefault: { 
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectButtonPopular: { 
    backgroundColor: '#000' 
  },
  selectButtonCurrent: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#059669',
  },
  selectButtonTextDefault: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextPopular: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButtonTextCurrent: {
    color: '#059669',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  footer: {
    alignItems: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
});
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
import CustomPopup from '../components/CustomPopup';
import PaymentMethodPopup from '../components/PaymentMethodPopup';

// ✅ API Configuration for Expo
const API_BASE_URL = __DEV__ 
  ? "http://localhost:8000" 
  : "https://your-production-api.com"; // Replace with your production URL

export default function PricingScreen({ navigation, route }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentPlan, setCurrentPlan] = useState('');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [processingMessage, setProcessingMessage] = useState('');
  // ✅ Check if this is a signup flow
  const isSignupFlow = route?.params?.isSignupFlow || false;
  const isFirstLogin = route?.params?.isFirstLogin || false;

  const [showCustomPopup, setShowCustomPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({});
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentPopupData, setPaymentPopupData] = useState({});

  // Replace showStatus function
  const showCustomStatus = (title, message, type = 'info') => {
    setPopupConfig({
      title,
      message,
      type,
      buttons: [{ text: 'OK', style: 'primary' }]
    });
    setShowCustomPopup(true);
  };
  
  // ✅ API Service
  const apiService = {
  getUserEmail: async () => {
    try {
      // ✅ ONLY use the actual logged-in user's email
      const userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!userEmail) {
        console.error('❌ No authenticated user email found');
        throw new Error('Please log in again');
      }
      
      console.log('📧 Using authenticated user email:', userEmail);
      return userEmail;
    } catch (error) {
      console.error('Error getting user email:', error);
      throw error;
    }
  },

  createCheckoutSessionForWeb: async (email, planId, billingCycle) => {
    try {
      console.log('🌐 Creating checkout session with REAL data:', { email, planId, billingCycle });
      
      // ✅ VALIDATE: Ensure we have a real email
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }

      let successUrl, cancelUrl;
      
      if (Platform.OS === 'web') {
        successUrl = `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
        cancelUrl = `${window.location.origin}/pricing`;
      } else {
        successUrl = 'superengineer://payment-success?session_id={CHECKOUT_SESSION_ID}';
        cancelUrl = 'superengineer://pricing';
      }

      const response = await fetch(`${API_BASE_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email, // ✅ Use REAL authenticated user email
          plan_id: planId,
          billing_cycle: billingCycle,
          success_url: successUrl,
          cancel_url: cancelUrl,
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

  activateFreePlan: async (email) => {
    try {
      console.log('🆓 Activating free plan for REAL user:', email);
      
      // ✅ VALIDATE: Ensure we have a real email
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }
      
      const response = await fetch(`${API_BASE_URL}/subscriptions/activate-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }), // ✅ Use REAL email
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

  getCurrentSubscription: async (email) => {
    try {
      console.log('📋 Getting subscription for REAL user:', email);
      
      // ✅ VALIDATE: Ensure we have a real email
      if (!email || !email.includes('@')) {
        throw new Error('Invalid email address');
      }
      
      const response = await fetch(`${API_BASE_URL}/subscriptions/current/${encodeURIComponent(email)}`);
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


  useEffect(() => {
  const initializeData = async () => {
    try {
      setLoading(true);
      
      // ✅ VALIDATE: Get REAL authenticated user email
      const email = await apiService.getUserEmail();
      if (!email) {
        console.error('⚠️ No authenticated user found');
        // Redirect to login
        navigation.navigate('Login');
        return;
      }
      
      setUserEmail(email);
      console.log('👤 Authenticated user email loaded:', email);

      if (isSignupFlow || isFirstLogin) {
        setCurrentPlan(null);
        console.log('🆕 First-time user detected');
      } else {
        try {
          const subscription = await apiService.getCurrentSubscription(email);
          const plan = subscription.plan || 'none';
          setCurrentPlan(plan);
          console.log('📋 Current plan loaded:', plan);
        } catch (error) {
          console.log('⚠️ Could not get subscription, user needs to select plan');
          setCurrentPlan(null);
        }
      }

    } catch (error) {
      console.error('Error initializing data:', error);
      // Redirect to login if no valid user
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  initializeData();
}, [route?.params, isSignupFlow, isFirstLogin]);


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

    // ✅ Show processing status without alerts
  const showStatus = (message, isError = false) => {
    setProcessingMessage(message);
    setTimeout(() => setProcessingMessage(''), 3000);
    if (isError) {
      console.error('❌', message);
    } else {
      console.log('✅', message);
    }
  };




 
  // ✅ Handle payment processing
  const handlePayment = async (planId, amount, billingCycle) => {
    setPaymentLoading(true);
    setProcessingMessage('Processing payment...');

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
        // ✅ For WEB: Direct Stripe Checkout redirect
        setProcessingMessage('Redirecting to payment...');
        
        const checkoutData = await apiService.createCheckoutSessionForWeb(
          userEmail,
          plan.backendId,
          billingCycle === 'year' ? 'yearly' : 'monthly'
        );

        if (checkoutData.success && checkoutData.checkout_url) {
          console.log('🌐 Redirecting to Stripe Checkout:', checkoutData.checkout_url);
          
          // Direct redirect for web
          window.location.href = checkoutData.checkout_url;
          
          return { success: true, redirected: true };
        } else {
          throw new Error('Failed to create checkout session');
        }

      } else {
        // ✅ For NATIVE: Open browser directly
        setProcessingMessage('Opening payment page...');
        
        const checkoutData = await apiService.createCheckoutSessionForWeb(
          userEmail,
          plan.backendId,
          billingCycle === 'year' ? 'yearly' : 'monthly'
        );

        if (checkoutData.success && checkoutData.checkout_url) {
          console.log('📱 Opening web checkout:', checkoutData.checkout_url);
          
          const supported = await Linking.canOpenURL(checkoutData.checkout_url);
          
          if (supported) {
            await Linking.openURL(checkoutData.checkout_url);
            
            // Show completion message
            setProcessingMessage('Payment opened in browser. Return when complete.');
            
            // Auto-clear processing state
            setTimeout(() => {
              setPaymentLoading(false);
              setSelectedPlan(null);
              setProcessingMessage('');
            }, 3000);
            
            return { success: true, redirected: true };
          } else {
            throw new Error('Cannot open payment page');
          }
        } else {
          throw new Error('Failed to create payment session');
        }
      }

    } catch (error) {
      console.error('❌ Payment error:', error);
      setPaymentLoading(false);
      setSelectedPlan(null);
      showStatus(error.message || 'Payment failed. Please try again.', true);
      throw error;
    }
  };



  // ✅ Complete signup process without alerts
  const completeSignup = async (planId) => {
    try {
      console.log('🎯 Completing signup with plan:', planId);

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
        ['hasCompletedOnboarding', 'true'],
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

      // Navigate based on 2FA setting
      if (signupData.has2FA === 'true') {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Setup2FA' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
      }
    } catch (error) {
      console.error('Error completing signup:', error);
      showStatus('Failed to complete signup. Please try again.', true);
    }
  };


  // ✅ Handle plan selection without alerts
  const handleSelectPlan = async (planId) => {
    // Check if user is already on this plan
    if (!isSignupFlow && !isFirstLogin && planId === currentPlan) {
      console.log('User is already on this plan:', planId);
      showStatus('You are already on this plan');
      return;
    }

    console.log('🎯 Plan selected:', planId);

    

    // ✅ Handle Free plan - Direct execution
    if (planId === 'free') {
      setSelectedPlan(planId);
      setProcessingMessage('Activating free plan...');
      
      try {
        // Activate free plan on backend
        if (userEmail) {
          await apiService.activateFreePlan(userEmail);
          console.log('✅ Free plan activated on backend');
          showStatus('Free plan activated successfully!');
        }

        if (isSignupFlow) {
          completeSignup(planId);
        } else {
          // For existing users switching to free
          await AsyncStorage.multiSet([
            ['userPlan', planId],
            ['freeQueries', '10']
          ]);
          setCurrentPlan(planId);
          
          // Navigate to main app
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Chat' }],
            });
          }, 1500);
        }
        return;
      } catch (error) {
        console.error('Error activating free plan:', error);
        showStatus('Free plan activation failed, but proceeding...', true);
        
        // Still proceed with signup even if backend call fails
        if (isSignupFlow) {
          completeSignup(planId);
        }
        return;
      } finally {
        setSelectedPlan(null);
        setProcessingMessage('');
      }
    }

    // ✅ Handle Enterprise plan - Direct contact
    if (planId === 'enterprise') {
      setSelectedPlan(planId);
      setProcessingMessage('Opening contact...');
      
      if (isSignupFlow) {
        completeSignup('enterprise');
      }
      
      // Open email client directly
      const emailUrl = 'mailto:sales@superengineer.com?subject=Enterprise Plan Inquiry';
      try {
        const supported = await Linking.canOpenURL(emailUrl);
        if (supported) {
          await Linking.openURL(emailUrl);
          showStatus('Contact email opened');
        } else {
          showStatus('Contact: sales@superengineer.com');
        }
      } catch (error) {
        console.error('Error opening email client:', error);
        showStatus('Contact: sales@superengineer.com');
      }
      
      setTimeout(() => {
        setSelectedPlan(null);
        setProcessingMessage('');
      }, 2000);
      
      return;
    }

    // ✅ Handle Paid plans - Direct payment processing
    setSelectedPlan(planId);
    const plan = allPlans.find(p => p.id === planId);
    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
    const billingCycle = isYearly ? 'year' : 'month';

    if(planId !== 'free' && planId !== 'enterprise'){
      setSelectedPlan(planId);

      try{
                const token = await AsyncStorage.getItem('accessToken');

        if(token){
          const savedMethodsResponse = await fetch(`${API_BASE_URL}/payment-methods/`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if(savedMethodsResponse.ok){
            const methods = await savedMethodsResponse.json();

            if(methods.length > 0){
                setPaymentPopupData({
                  planName: plan.name,
                  price: `£${price}/${billingCycle}`,
                  savedMethods: methods,
                  planId: planId,
                  backendPlanId: plan.backendId,
                  billingCycle: billingCycle
                });
              setShowPaymentPopup(true);
              setSelectedPlan(null);
              return;
            }
          }

        }
        await handlePaymentWithSaving(planId, price, billingCycle);

      }catch(error){
        console.error('Error checking payment methods:', error);
        await handlePayment(planId, price, billingCycle);
      }
    }

    console.log(`Processing payment for ${plan.name} plan: £${price}/${billingCycle}`);

    // try {
    //   await handlePayment(planId, price, billingCycle);
    // } catch (error) {
    //   setSelectedPlan(null);
    //   // Error already handled in handlePayment
    //   console.log('error occur during handle select plan:', error);
    // }
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

            {/* Status Message */}
      {processingMessage && (
        <View style={styles.statusBar}>
          <Text style={styles.statusText}>{processingMessage}</Text>
        </View>
      )}
      
      {/* Header */}
      {(Platform.OS === 'web' || navigation?.goBack) && (
        <View style={styles.header}>
          {navigation?.goBack && (
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <ArrowLeft size={24} color="#000" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>
            {isFirstLogin ? 'Welcome! Choose Your Plan' : 'Choose Your Plan'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      )}



      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.title}>
            {isFirstLogin ? 'Welcome to SuperEngineer!' : 'Unlock Your Potential'}
          </Text>
          <Text style={styles.subtitle}>
            {isFirstLogin 
              ? 'Choose your plan to get started with AI-powered engineering assistance.'
              : 'Choose the perfect plan for your engineering needs and start building amazing things today.'
            }
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

      <CustomPopup
        visible={showCustomPopup}
        onClose={()=> setShowCustomPopup(false)}
        {...popupConfig}
      />

          <PaymentMethodPopup
                visible={showPaymentPopup}
                onClose={() => setShowPaymentPopup(false)}
                {...paymentPopupData}
                onUseSavedCard={(method) => {
                  chargeWithSavedMethod(
                    paymentPopupData.backendPlanId, 
                    paymentPopupData.billingCycle,
                    method
                  );
                }}
                onAddNewCard={() => {
                  handlePaymentWithSaving(
                    paymentPopupData.planId, 
                    paymentPopupData.price, 
                    paymentPopupData.billingCycle
                  );
                }}
          />
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
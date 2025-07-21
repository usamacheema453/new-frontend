// screens/TwoFactorPage.js

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  Image,
  Alert,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { Shield, ArrowLeft } from 'lucide-react-native'

export default function TwoFactorPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const [contactMethod, setContactMethod] = useState('email')
  const [contactValue, setContactValue] = useState('')
  const inputRefs = useRef([])
  const navigation = useNavigation()

  //add new state
  const [isSignupFlow, setIsSignupFlow] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [isLoginFlow, setIsLoginFlow] = useState(false);


  useEffect(() => {
    ;(async () => {
      //check the last page come from signup or login
      const signupFlow = route?.params?.isSignupFlow || false;
          const loginFlow = route?.params?.isLoginFlow || false;
    const method = route?.params?.method || (await AsyncStorage.getItem('2faMethod')) || 'email';
    const contact = route?.params?.contact || 
      (await AsyncStorage.getItem('2faContact')) ||
      (await AsyncStorage.getItem('userEmail')) || '';

          const email = signupFlow ? 
      (route?.params?.userEmail || await AsyncStorage.getItem('signupUserEmail')) :
      (route?.params?.userEmail || await AsyncStorage.getItem('loginUserEmail') || await AsyncStorage.getItem('userEmail'));

    console.log('TwoFactor flow - signup:', signupFlow, 'login:', loginFlow, 'method:', method, 'email:', email);


      setIsSignupFlow(signupFlow);
      setIsLoginFlow(loginFlow);
      setUserEmail(email);
      setContactMethod(method);
      setContactValue(contact);

      // Focus first OTP input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus()
      }
    })()
  }, [])

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus()
    }
  }

  const handleKeyPress = (index, key) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpCode = otp.join('')
    if (otpCode.length !== 6) {
      alert('Please enter all 6 digits')
      return
    }
    setIsLoading(true)

    try{
      let response;
      if(isLoginFlow){
       // For login flow, use complete-login endpoint
      response = await fetch(`${API_BASE_URL}/auth/complete-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          otp_code: otpCode,
          auth_method: contactMethod,
        }),
      });
      }else{
        response = await fetch(`${API_BASE_URL}/auth/verify-2fa-otp`,{
          method: 'POST',
          headers:{
             'Content-Type': 'application/json',
          },
          body:  JSON.stringify({
                      email: userEmail,
          otp_code: otpCode,
          auth_method: contactMethod,
          })
        })
      }
      const data = await response.json();

          if (!response.ok) {
      throw new Error(data.detail || 'Verification failed');
    }

        // Handle success based on flow type
    if (isSignupFlow) {
      // For signup flow: mark 2FA as complete and redirect to login
      await AsyncStorage.setItem('2faSetupComplete', 'true');
      
       navigation.navigate('Login', {
          message: 'Account created and 2FA setup complete! Please verify your email and sign in.'
        });


      // Alert.alert(
      //   '2FA Setup Complete!',
      //   'Your account is now secured with two-factor authentication. Please verify your email and sign in.',
      //   [
      //     {
      //       text: 'Continue to Login',
      //       onPress: () => {
      //         navigation.navigate('Login', {
      //           message: 'Account created and 2FA setup complete! Please verify your email and sign in.'
      //         });
      //       }
      //     }
      //   ]
      // );
    } else if (isLoginFlow) {
      // For login flow: complete authentication and store tokens
      await AsyncStorage.setItem('accessToken', data.access_token);
      await AsyncStorage.setItem('refreshToken', data.refresh_token);
      await AsyncStorage.setItem('userEmail', data.user.email);
      await AsyncStorage.setItem('userName', data.user.full_name);
      await AsyncStorage.setItem('userId', data.user.id.toString());
      await AsyncStorage.setItem('has2FA', data.user.is_2fa_enabled ? 'true' : 'false');
      await AsyncStorage.setItem('isAuthenticated', 'true');

      // Get user's current subscription
      try {
        const subResponse = await fetch(`${API_BASE_URL}/subscriptions/current/${data.user.email}`);
        if (subResponse.ok) {
          const subData = await subResponse.json();
          await AsyncStorage.setItem('userPlan', subData.plan);
        }
      } catch (error) {
        console.warn('Failed to load subscription:', error);
        await AsyncStorage.setItem('userPlan', 'free');
      }

      // Clean up login email
      await AsyncStorage.removeItem('loginUserEmail');

      // Check if user has a paid plan
      const userPlan = await AsyncStorage.getItem('userPlan') || 'free';
      
      if (userPlan === 'free') {
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'Pricing', 
            params: { 
              isFirstLogin: true,
              userEmail: data.user.email,
              userName: data.user.full_name
            } 
          }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
      }
    }

    }catch(error){
      console.error('2FA verification error:', error);
      // Clear OTP inputs on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }finally{
      setIsLoading(false);
    }
  }

  const handleResend = async () => {
   try{
    setResendTimer(45);

    let endpoint;
    if (isLoginFlow) {
      // For login flow, trigger OTP resend via login attempt
      endpoint = `${API_BASE_URL}/auth/resend-login-otp`;
    } else {
      // For signup flow, use existing resend endpoint
      endpoint = `${API_BASE_URL}/auth/resend-2fa-otp`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers:{
        'Content-Type': 'application/json',
      },
      body:JSON.stringify({
        email: userEmail,
        auth_method: contactMethod,
        contact: contactValue,
      }),
    });

    if(response.ok){
        Alert.alert('Code Sent', `A new verification code has been sent to your ${contactMethod}.`);
    }else{
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to resend code');
    }
   }catch(error){
            console.error('Resend error:', error);
            Alert.alert('Error', error.message || 'Failed to resend code. Please try again.');
            setResendTimer(0); // Reset timer on error
   }
  }

  const formatContact = (value, method) => {
    if (method === 'email') {
      const [username, domain] = value.split('@')
      if (username && domain) {
        const maskedUsername = username.slice(0, 2) + '***' + username.slice(-2)
        return `${maskedUsername}@${domain}`
      }
      return value
    } else {
      if (value.length > 4) {
        return '***-***-' + value.slice(-4)
      }
      return value
    }
  }

  return (
    <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.container}>
      <View style={styles.innerWrapper}>
        {/* Logo */}
        <TouchableOpacity
          style={styles.logoContainer}
          onPress={() => navigation.navigate('Home')}
        >
          <View style={styles.logoBox}>
            <Image 
              source={require('../assets/SuperEngineer_Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconCircle}>
              <Shield size={32} color="#000000" />
            </View>
            <Text style={styles.cardTitle}>Two-Factor Authentication</Text>
            <Text style={styles.cardDescription}>
              We've sent a 6-digit code to your{' '}
              {contactMethod === 'email' ? 'email' : 'phone'}{' '}
              {formatContact(contactValue, contactMethod)}. Enter it below to secure your account.
            </Text>
          </View>

          {/* OTP Inputs */}
          <View style={styles.otpWrapper}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                style={styles.otpInput}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(val) => handleOtpChange(index, val)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(index, nativeEvent.key)
                }
              />
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (isLoading || otp.join('').length !== 6) && styles.submitButtonDisabled,
            ]}
            onPress={handleVerify}
            disabled={isLoading || otp.join('').length !== 6}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <View style={styles.resendWrapper}>
            <Text style={styles.resendLabel}>Didn't receive the code?</Text>
            {resendTimer > 0 ? (
              <Text style={styles.resendTimer}>
                Resend in {resendTimer} seconds
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendButton}>Resend Code</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.backWrapper}
            onPress={() => navigation.navigate('Login')}
          >
            <ArrowLeft size={16} color="#6B7280" />
            <Text style={styles.backText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}

const { width } = Dimensions.get('window')
const CARD_MAX_WIDTH = 360

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 140,
    height: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    padding: 24,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  otpWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  otpInput: {
    // Responsive sizing: larger for desktop/web, smaller for mobile
    width: Platform.OS === 'web' ? 48 : 40,
    height: Platform.OS === 'web' ? 48 : 40,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    textAlign: 'center',
    fontSize: Platform.OS === 'web' ? 18 : 16,
    marginHorizontal: Platform.OS === 'web' ? 4 : 3,
    color: '#000000',
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resendWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  resendLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  resendTimer: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  resendButton: {
    fontSize: 14,
    color: '#000000',
    textDecorationLine: 'underline',
    marginTop: 4,
  },
  backWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  backText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    textDecorationLine: 'underline',
  },
})
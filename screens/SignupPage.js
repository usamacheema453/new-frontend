// screens/SignupPage.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Switch as RNSwitch,
  Pressable,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';

console.log('🚀 SignupPage rendered');

const BACKEND_URL= "http://localhost:8000"
export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [enable2FA, setEnable2FA] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (!acceptTerms) {
      alert('Please accept the terms and conditions');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/auth/signup`,{
          method:'POST',
          headers:{
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            full_name: formData.name,
            email:formData.email,
            password:formData.password,
            is_2fa_enabled: enable2FA,
            auth_method: enable2FA ? 'email': null,
          }),
        });
         const data = await response.json();
          if(!response.ok){
            throw new Error(data.details || "Signup failed");
          }

        // Store user data temporarily during signup flow
        await AsyncStorage.setItem('signupUserEmail', formData.email);
        await AsyncStorage.setItem('signupUserName', formData.name);
        await AsyncStorage.setItem('signupHas2FA', enable2FA ? 'true' : 'false');
        
        // Determine user role based on email
       await AsyncStorage.setItem('signupUserId', data.id.toString());
        
        setIsLoading(false);
        console.log('Signup successful, 2fa enable')

        // Handle navigation based on 2FA setting
        if (enable2FA) {
          // If 2FA is enabled, go to Setup2FA page
          console.log('Navigating to Setup2FA'); // Debug log
          navigation.navigate('Setup2FA', {
            isSignupFlow: true,
            userEmail: formData.email
          });

        } else {
          // If 2FA is disabled, go directly to login
          console.log('Navigating to Login'); // Debug log
          navigation.navigate('Login', {
            message: 'Account created! Please verify your email and sign in.'
          });
        }
        
      } catch (error) {
        console.error('Signup error:', error);
        setIsLoading(false);
        alert('An error occurred during signup. Please try again.');
      }
    }, 1500);
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    
    setTimeout(async () => {
      try {
        const googleEmail = 'admin@gmail.com';
        const googleName = 'Google Admin';
        
        // Store user data temporarily during signup flow
        await AsyncStorage.setItem('signupUserEmail', googleEmail);
        await AsyncStorage.setItem('signupUserName', googleName);
        await AsyncStorage.setItem('signupHas2FA', enable2FA ? 'true' : 'false');
        await AsyncStorage.setItem('signupUserRole', 'team_admin');
        
        // Mark as new user for welcome popup
        await AsyncStorage.setItem('isNewUser', 'true');
        
        setIsLoading(false);
        
        // Navigate to pricing screen
        navigation.navigate('Pricing', {
          isSignupFlow: true,
          userEmail: googleEmail,
          userName: googleName,
          enable2FA: enable2FA,
          userRole: 'team_admin',
          isGoogleSignup: true,
        });
      } catch (error) {
        console.error('Google signup error:', error);
        setIsLoading(false);
        alert('An error occurred with Google signup. Please try again.');
      }
    }, 1000);
  };



  return (
    <LinearGradient
      colors={['#F9FAFB', '#FFFFFF']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          {/* Logo only (no text) */}
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
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardDescription}>
                Join thousands of engineers using AI assistance
              </Text>
            </View>

            <View style={styles.cardContent}>
              {/* Google Signup */}
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.buttonDisabled]}
                onPress={handleGoogleSignup}
                disabled={isLoading}
              >
                <View style={styles.googleIconWrapper}>
                  <Svg width={20} height={20} viewBox="0 0 24 24">
                    <Path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <Path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </Svg>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Separator */}
              <View style={styles.separatorWrapper}>
                <View style={styles.separatorLine} />
                <View style={styles.separatorTextWrapper}>
                  <Text style={styles.separatorText}>
                    Or continue with email
                  </Text>
                </View>
              </View>

              {/* Signup Form */}
              <View style={styles.form}>
                {/* Full Name Field */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={16} color="#9CA3AF" style={styles.iconInline} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChangeText={(text) =>
                        handleInputChange('name', text)
                      }
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Email Field */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={16} color="#9CA3AF" style={styles.iconInline} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChangeText={(text) =>
                        handleInputChange('email', text)
                      }
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </View>

                {/* Password Field */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#9CA3AF" style={styles.iconInline} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="Create a password"
                      value={formData.password}
                      onChangeText={(text) =>
                        handleInputChange('password', text)
                      }
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.toggleIconWrapper}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color="#6B7280" />
                      ) : (
                        <Eye size={16} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Field */}
                <View style={styles.fieldWrapper}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={16} color="#9CA3AF" style={styles.iconInline} />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChangeText={(text) =>
                        handleInputChange('confirmPassword', text)
                      }
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.toggleIconWrapper}
                      activeOpacity={0.6}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={16} color="#6B7280" />
                      ) : (
                        <Eye size={16} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2FA Option */}
                <View style={styles.twoFaWrapper}>
                  <View style={styles.twoFaInfo}>
                    <Shield size={20} color="#9CA3AF" />
                    <View style={styles.twoFaTextWrapper}>
                      <Text style={styles.twoFaLabel}>
                        Enable Two-Factor Authentication
                      </Text>
                      <Text style={styles.twoFaSubtext}>
                        Add an extra layer of security to your account
                      </Text>
                    </View>
                  </View>
                  <RNSwitch
                    value={enable2FA}
                    onValueChange={setEnable2FA}
                    trackColor={{ true: '#000000', false: '#E5E7EB' }}
                    thumbColor={'#FFFFFF'}
                    ios_backgroundColor="#E5E7EB"
                    disabled={isLoading}
                  />
                </View>

                {/* Terms & Conditions */}
                <TouchableOpacity
                  onPress={() => setAcceptTerms(!acceptTerms)}
                  style={styles.termsWrapper}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxContainer}>
                    <Text style={styles.checkboxText}>
                      {acceptTerms ? '☑️' : '⬜'}
                    </Text>
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text style={styles.linkText}>
                      Terms of Service
                    </Text>{' '}
                    and{' '}
                    <Text style={styles.linkText}>
                      Privacy Policy
                    </Text>
                  </Text>
                </TouchableOpacity>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isLoading && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Sign-in Link */}
              <View style={styles.signinWrapper}>
                <Text style={styles.signinPrompt}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.signinLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const { width } = Dimensions.get('window');
const CARD_MAX_WIDTH = 360;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  card: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  cardHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  cardContent: {
    padding: 24,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 6,
    justifyContent: 'center',
    marginBottom: 24,
  },
  googleIconWrapper: {
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  separatorWrapper: {
    marginBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  separatorLine: {
    position: 'absolute',
    top: '50%',
    width: '100%',
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  separatorTextWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
  },
  separatorText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  form: {
    width: '100%',
  },
  fieldWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconInline: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 40,
    fontSize: 14,
    color: '#000000',
  },
  passwordInput: {
    paddingRight: 40,
  },
  toggleIconWrapper: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  twoFaWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  twoFaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  twoFaTextWrapper: {
    marginLeft: 8,
    flexShrink: 1,
  },
  twoFaLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  twoFaSubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  termsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
  },
  checkboxContainer: {
    marginRight: 8,
  },
  checkboxText: {
    fontSize: 18,
  },
  termsText: {
    fontSize: 12,
    color: '#4B5563',
    flex: 1,
    lineHeight: 18,
  },
  linkText: {
    color: '#000000',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signinWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signinPrompt: {
    fontSize: 14,
    color: '#6B7280',
  },
  signinLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textDecorationLine: 'underline',
  },
});
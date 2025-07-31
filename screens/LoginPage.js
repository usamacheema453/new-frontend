// screens/LoginPage.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { Svg, Path } from 'react-native-svg';
import { Alert } from 'react-native';

const BACKEND_URL="http://localhost:8000"

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ Check subscription status and navigate accordingly
  const checkSubscriptionAndNavigate = async (userData) => {
    try {
      console.log('📋 Checking subscription status for:', userData.user.email);
      
      const response = await fetch(`${BACKEND_URL}/subscriptions/current/${userData.user.email}`);
      const subscriptionData = await response.json();
      
      console.log('📋 Subscription data:', subscriptionData);
      
      if (subscriptionData.has_subscription) {
        // User has active subscription - go to main app
        await AsyncStorage.setItem('userPlan', subscriptionData.plan);
        navigation.reset({
          index: 0,
          routes: [{ name: 'Chat' }],
        });
      } else {
        // No subscription - show pricing screen
        await AsyncStorage.setItem('userPlan', 'none');
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Pricing',
            params: {
              isFirstLogin: false,
              requiresPlanSelection: subscriptionData.requires_plan_selection,
              message: subscriptionData.message,
              userEmail: userData.user.email,
              userName: userData.user.full_name
            }
          }],
        });
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
      // Fallback to pricing screen
      navigation.reset({
        index: 0,
        routes: [{
          name: 'Pricing',
          params: {
            isFirstLogin: false,
            userEmail: userData.user.email,
            userName: userData.user.full_name
          }
        }],
      });
    }
  };




  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      if (data.requires_2fa) {
        setIsLoading(false);
        await AsyncStorage.setItem('loginUserEmail', formData.email);

        navigation.navigate('TwoFactor', {
          isSignupFlow: false,
          isLoginFlow: true,
          userEmail: formData.email,
          method: data.auth_method,
          contact: data.contact
        });
        return;
      }

      // ✅ Handle login success with first-time login detection
      await completeLogin(data);
      
    } catch (error) {
      console.error('❌ Login error:', error);
      setIsLoading(false);
      // You can implement toast notification here instead of Alert.alert
      console.error('Login failed:', error.message);
    }
  };



  const completeLogin = async (userData) => {
    try {
      // Store authentication data
      await AsyncStorage.setItem('accessToken', userData.access_token);
      await AsyncStorage.setItem('refreshToken', userData.refresh_token);
      await AsyncStorage.setItem('userEmail', userData.user.email);
      await AsyncStorage.setItem('userName', userData.user.full_name);
      await AsyncStorage.setItem('userId', userData.user.id.toString());
      await AsyncStorage.setItem('has2FA', userData.user.is_2fa_enabled ? 'true' : 'false');
      await AsyncStorage.setItem('isAuthenticated', 'true');

      setIsLoading(false);

      // ✅ Check if this is first-time login
      if (userData.is_first_login) {
        console.log('🆕 First-time login detected');
        
        navigation.reset({
          index: 0,
          routes: [{
            name: 'Pricing',
            params: {
              isFirstLogin: true,
              userEmail: userData.user.email,
              userName: userData.user.full_name,
              loginCount: userData.login_count
            }
          }],
        });
      } else {
        console.log('🔄 Returning user login');
        
        // Check subscription status for returning users
        await checkSubscriptionAndNavigate(userData);
      }

    } catch (error) {
      console.error('❌ Error completing login:', error);
      setIsLoading(false);
      console.error('Failed to complete login. Please try again.');
    }
  };




  const handleGoogleLogin = async () => {
    // const googleEmail = 'admin@gmail.com';
    // await AsyncStorage.setItem('userEmail', googleEmail);
    // await AsyncStorage.setItem('userRole', 'team_admin');
    // await AsyncStorage.setItem('userPlan', 'team');
    // const has2FA = (await AsyncStorage.getItem('has2FA')) === 'true';
    // if (has2FA) {
    //   navigation.navigate('TwoFactor');
    // } else {
    //   await AsyncStorage.setItem('isAuthenticated', 'true');
    //   navigation.navigate('Chat');
    // }
  };

  return (
    <LinearGradient
      colors={['#F9FAFB', '#FFFFFF']}
      style={styles.gradientContainer}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
                <Text style={styles.cardTitle}>Welcome Back</Text>
                <Text style={styles.cardDescription}>
                  Sign in to your account to continue
                </Text>
              </View>
              <View style={styles.cardContent}>
                {/* Google Login */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleLogin}
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

                {/* Email Login Form */}
                <View style={styles.form}>
                  {/* Email Field */}
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.inputWrapper}>
                      <Mail
                        size={16}
                        color="#9CA3AF"
                        style={styles.iconInline}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        value={formData.email}
                        onChangeText={(text) => handleInputChange('email', text)}
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
                      <Lock
                        size={16}
                        color="#9CA3AF"
                        style={styles.iconInline}
                      />
                      <TextInput
                        style={[styles.textInput, styles.passwordInput]}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.toggleIconWrapper}
                      >
                        {showPassword ? (
                          <EyeOff size={16} color="#6B7280" />
                        ) : (
                          <Eye size={16} color="#6B7280" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Forgot Password */}
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleLogin}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Sign In</Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Sign up link */}
                <View style={styles.signupWrapper}>
                  <Text style={styles.signupPrompt}>
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Signup')}
                  >
                    <Text style={styles.signupLink}>Sign up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const CARD_MAX_WIDTH = 360;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    minHeight: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Dimensions.get('window').height,
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  innerWrapper: {
    width: '100%',
    maxWidth: CARD_MAX_WIDTH,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 40,
    height: 44,
    // no backgroundColor or borderRadius so it's transparent
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoImage: {
    width: 120,
    height: 120,
    marginTop: 14,
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
    right: 12,
    zIndex: 1,
  },
  forgotText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 24,
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
  signupWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupPrompt: {
    fontSize: 14,
    color: '#6B7280',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textDecorationLine: 'underline',
  },
});

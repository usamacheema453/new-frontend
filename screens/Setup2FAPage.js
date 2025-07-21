// screens/Setup2FAPage.js

import React, { useState, useEffect } from 'react';
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
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Mail, Phone } from 'lucide-react-native';

console.log('🚀 Setup2FAPage rendered');

export default function Setup2FAPage() {
  const [contactMethod, setContactMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const storedEmail = await AsyncStorage.getItem('userEmail');
      if (storedEmail) setEmail(storedEmail);
    })();
  }, []);

  const loadUserEmail = async()=>{
    try{ 
      const routeEmail = route?.params?.userEmail;
      if(routeEmail){
        setEmail(routeEmail);
      }else{
        // Fallback to stored email
      const storedEmail = await AsyncStorage.getItem('signupUserEmail') || 
                          await AsyncStorage.getItem('userEmail');
      if (storedEmail) {
        setEmail(storedEmail);
      }
      }
    }catch(error){
      console.error('Error loading user email:', error);
    }
  }

  const handleSetup2FA = async () => {
    

    if (contactMethod === 'email' && !email) {
      alert('Please enter your email address');
      setIsLoading(false);
      return;
    }
    if (contactMethod === 'phone' && !phone) {
      alert('Please enter your phone number');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try{
      await AsyncStorage.setItem('2faMethod', contactMethod);
      await AsyncStorage.setItem('2faContact', contactMethod === 'email'? email: phone);

          // Send OTP to chosen method
      const userEmail = route?.params?.userEmail || await AsyncStorage.getItem('signupUserEmail');
      const response = await fetch(`${API_BASE_URL}/auth/send-2fa-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          auth_method: contactMethod,
          contact: contactMethod === 'email' ? email : phone
        })
      });

      if (response.ok) {
      // Navigate to OTP verification with signup flow flag
        navigation.navigate('TwoFactor', {
        method: contactMethod,
        contact: contactMethod === 'email' ? email : phone,
        isSignupFlow: true,
        userEmail: userEmail
        });
    } else {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to send OTP');
    }

    }catch(error){
      console.error('2FA setup error:', error);
    }finally{
      setIsLoading(true);
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#FFFFFF']}
      style={styles.container}
    >
      {/* KeyboardAvoidingView keeps inputs visible above keyboard */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
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
            {/* Header */}
            <View style={styles.cardHeader}>
              <View style={styles.iconCircle}>
                <Shield size={32} color="#000000" />
              </View>
              <Text style={styles.cardTitle}>
                Set Up Two-Factor Authentication
              </Text>
              <Text style={styles.cardDescription}>
                Choose how you want to receive your verification codes
              </Text>
            </View>

            {/* Tabs */}
            <View style={styles.tabsList}>
              <TouchableOpacity
                style={[
                  styles.tabTrigger,
                  contactMethod === 'email' && styles.tabActive,
                ]}
                onPress={() => setContactMethod('email')}
              >
                <View style={styles.tabIconWrapper}>
                  <Mail
                    size={16}
                    color={contactMethod === 'email' ? '#000000' : '#6B7280'}
                  />
                </View>
                <Text
                  style={[
                    styles.tabText,
                    contactMethod === 'email' && styles.tabTextActive,
                  ]}
                >
                  Email
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tabTrigger,
                  contactMethod === 'phone' && styles.tabActive,
                ]}
                onPress={() => setContactMethod('phone')}
              >
                <View style={styles.tabIconWrapper}>
                  <Phone
                    size={16}
                    color={contactMethod === 'phone' ? '#000000' : '#6B7280'}
                  />
                </View>
                <Text
                  style={[
                    styles.tabText,
                    contactMethod === 'phone' && styles.tabTextActive,
                  ]}
                >
                  Phone
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <View style={styles.tabContent}>
              {contactMethod === 'email' ? (
                <View style={styles.form}>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Mail
                        size={16}
                        color="#9CA3AF"
                        style={styles.iconInline}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      We'll send a verification code to this email each time you log in
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSetup2FA}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.form}>
                  <View style={styles.fieldWrapper}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                      <Phone
                        size={16}
                        color="#9CA3AF"
                        style={styles.iconInline}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your phone number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        editable={!isLoading}
                      />
                    </View>
                    <Text style={styles.helperText}>
                      We'll send a verification code to this phone number each time you log in
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      isLoading && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSetup2FA}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>Continue</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Skip Link */}
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat')}
              style={styles.skipWrapper}
            >
              <Text style={styles.skipText}>Skip for now (not recommended)</Text>
            </TouchableOpacity>
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
    flex: 1, // Fill entire screen
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  tabsList: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabTrigger: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  tabIconWrapper: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000000',
  },
  tabContent: {
    padding: 24,
  },
  form: {
    width: '100%',
  },
  fieldWrapper: {
    marginBottom: 24,
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
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#6B7280',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  skipWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 12,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
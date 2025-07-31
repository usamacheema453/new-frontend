// App.js

import 'react-native-gesture-handler';  // ← must be first
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';

// ─── Add expo-speech import ───
import * as Speech from 'expo-speech';

// ✅ Deep linking configuration for React Navigation
const linking = {
  prefixes: [
    'http://localhost:8081', // Your development server
    'https://yourapp.com',   // Production URL
    'superengineer://',      // Custom scheme for native
  ],
  config: {
    screens: {
      Home: '',
      Login: 'login',
      Signup: 'signup', 
      Pricing: 'pricing',
      // ✅ This is the key - map payment-success URL to PaymentSuccess screen
      PaymentSuccess: {
        path: 'payment-success',
        parse: {
          session_id: (session_id) => session_id,
        },
      },
      Chat: 'chat',
      Settings: 'settings',
    },
  },
};


export default function App() {
  // ─── Speak a welcome message when the app loads ───
  useEffect(() => {
    Speech.speak('Welcome to Super Engineer', {
      language: 'en-US',
      pitch: 1.0,
      rate: 1.0,
    });
  }, []);

  return (
    <>
      <NavigationContainer linking={linking}>
        <AppNavigator />
      </NavigationContainer>
      <Toast />
    </>
  );
}

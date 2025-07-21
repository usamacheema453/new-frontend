// App.js

import 'react-native-gesture-handler';  // ← must be first
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import AppNavigator from './navigation/AppNavigator';

// ─── Add expo-speech import ───
import * as Speech from 'expo-speech';

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
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <Toast />
    </>
  );
}

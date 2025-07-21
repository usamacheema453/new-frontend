// src/screens/TextToSpeechExample.js

import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import * as Speech from 'expo-speech';
import { Mic, X } from 'lucide-react-native';

export default function TextToSpeechExample() {
  const [text, setText] = useState('');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    const subscription = Speech.addEventListener('tts-finish', () => {
      setSpeaking(false);
    });
    return () => subscription.remove();
  }, []);

  const onSpeakPress = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    if (text.trim() === '') return;
    setSpeaking(true);
    Speech.speak(text, {
      language: 'en-US',
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type a message..."
        value={text}
        onChangeText={setText}
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.micButton, speaking && styles.micButtonActive]}
          onPress={onSpeakPress}
        >
          {speaking ? (
            <X size={20} color="#FFF" />
          ) : (
            <Mic size={20} color="#6B7280" />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => {
            /* Your “send chat message” logic here */
            console.log('Sent:', text);
          }}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  input: {
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  micButton: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 24,
    marginRight: 12,
  },
  micButtonActive: {
    backgroundColor: '#EF4444',
  },
  sendButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

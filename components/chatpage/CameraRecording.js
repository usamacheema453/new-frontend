// components/chatpage/CameraRecording.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Mic, Camera, Square, X } from 'lucide-react-native';
import { transcribeAudio } from '../../utils/transcribe';

const BAR_COUNT = 7;

export default function CameraRecording({
  setInput,
  attachments, // Updated: now receives attachments array
  setAttachments, // Updated: now receives setAttachments function
  isMobile,
}) {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const waveAnim = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0))
  ).current;
  const waveInterval = useRef(null);

  // Timer
  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } else {
      clearInterval(timer);
      setRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // Waveform animation
  const startWaveAnimation = () => {
    if (waveInterval.current) return;
    waveInterval.current = setInterval(() => {
      waveAnim.forEach(anim => {
        Animated.timing(anim, {
          toValue: Math.random(),
          duration: 100,
          useNativeDriver: false,
        }).start();
      });
    }, 100);
  };
  const stopWaveAnimation = () => {
    clearInterval(waveInterval.current);
    waveInterval.current = null;
    waveAnim.forEach(anim => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    });
  };

  // Start recording
  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Microphone access is needed.');
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      await rec.startAsync();
      setRecording(rec);
      setIsRecording(true);
      startWaveAnimation();
    } catch (e) {
      console.warn('Recording error:', e);
      Alert.alert('Recording failed', 'Try on a real device.');
    }
  };

  // Stop recording and transcribe
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
    } catch {}
    setIsRecording(false);
    stopWaveAnimation();

    const uri = recording.getURI();
    try {
      const text = await transcribeAudio(uri);
      setInput(text);
    } catch (e) {
      console.error('Transcription error:', e);
      Alert.alert('Transcription error', e.message);
    }

    setRecording(null);
  };

  const onMicPress = () =>
    isRecording ? stopRecording() : startRecording();

  // Updated: Camera capture now adds to attachments
  const handleCameraCapture = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Camera not available', 'Camera is not available on web.');
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Camera access is needed.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      const imageAsset = result.assets[0];
      const attachment = {
        uri: imageAsset.uri,
        type: 'image',
        mimeType: 'image/jpeg',
        fileName: 'camera_photo.jpg',
        size: imageAsset.fileSize,
        width: imageAsset.width,
        height: imageAsset.height,
      };
      
      // Add to attachments array
      setAttachments(prev => [...prev, attachment]);
      
      if (isRecording) stopRecording();
    }
  };

  // Updated: Remove function now works with attachments array
  const handleRemoveImage = (attachmentIndex) => {
    setAttachments(prev => prev.filter((_, index) => index !== attachmentIndex));
  };

  // UPDATED: Enhanced renderMicButton with proper mobile/desktop styling and active/inactive states
  const renderMicButton = (inputText = '', hasAttachments = false) => {
    const hasInput = inputText.trim().length > 0;
    
    if (isMobile) {
      // Mobile: Black mic when active, replaced by send button when typing
      return (
        <TouchableOpacity style={styles.mobileMicButton} onPress={onMicPress}>
          <Mic size={20} color="#000000" />
        </TouchableOpacity>
      );
    } else {
      // Desktop: Active state (white bg, black mic) when no input, inactive state (gray bg, gray mic) when typing
      const isActive = !hasInput && !hasAttachments;
      return (
        <TouchableOpacity 
          style={[
            styles.desktopMicButton,
            isActive ? styles.desktopMicButtonActive : styles.desktopMicButtonInactive
          ]} 
          onPress={onMicPress}
        >
          <Mic 
            size={20} 
            color={isActive ? "#000000" : "#6B7280"} 
          />
        </TouchableOpacity>
      );
    }
  };

  const renderRecordingBar = () => {
    if (!isRecording) return null;
    const mins = Math.floor(recordingTime / 60);
    const secs = recordingTime % 60;
    const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

    if (isMobile) {
      return (
        <View style={styles.mobileRecordingBar}>
          <View style={styles.recordingContent}>
            <View style={styles.mobileWaveContainer}>
              {waveAnim.slice(0, 5).map((anim, idx) => {
                const height = anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 30],
                });
                return (
                  <Animated.View
                    key={idx}
                    style={[styles.mobileWaveBar, { height }]}
                  />
                );
              })}
            </View>
            <Text style={styles.recordingText}>
              Recording… {formatted}
            </Text>
            <TouchableOpacity style={styles.stopButton} onPress={onMicPress}>
              <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    } else {
      return (
        <View style={styles.desktopRecordingBar}>
          <View style={styles.recordingContent}>
            <View style={styles.recordingLeft}>
              <View style={styles.desktopWaveContainer}>
                {waveAnim.map((anim, idx) => {
                  const height = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 32],
                  });
                  return (
                    <Animated.View
                      key={idx}
                      style={[styles.desktopWaveBar, { height }]}
                    />
                  );
                })}
              </View>
              <Text style={styles.recordingText}>
                Recording… {formatted}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stopRecordingButton}
              onPress={onMicPress}
            >
              <Square size={16} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.stopText}>Stop</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
  };

  const renderCameraButton = () =>
    isMobile && (
      <TouchableOpacity
        style={styles.mobileToolButton}
        onPress={handleCameraCapture}
      >
        <Camera size={16} color="#374151" />
      </TouchableOpacity>
    );

  // Updated: This function is no longer needed since we're using AttachmentDisplay component
  // But keeping it for backward compatibility - it will return null
  const renderCapturedImage = () => null;

  return {
    renderMicButton,
    renderRecordingBar,
    renderCameraButton,
    renderCapturedImage, // Deprecated but kept for compatibility
    isRecording,
  };
}

const styles = StyleSheet.create({
  // Mobile Mic Button (Updated: Black color for consistency)
  mobileMicButton: {
    backgroundColor: '#E5E7EB',
    borderRadius: 24,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },

  // NEW: Desktop Mic Button Styles
  desktopMicButton: {
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  desktopMicButtonActive: {
    // Active state: white background, black mic icon (similar to + button)
    backgroundColor: '#FFFFFF',
  },
  desktopMicButtonInactive: {
    // Inactive state: light gray background, gray mic icon
    backgroundColor: '#F3F4F6',
  },

  // Mobile Recording Bar
  mobileRecordingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 8,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  mobileWaveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 8,
    height: 30,
  },
  mobileWaveBar: {
    width: 3,
    marginHorizontal: 1,
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },
  recordingText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
    marginLeft: 8,
  },
  stopButton: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    padding: 8,
    marginLeft: 8,
  },

  // Desktop Recording Bar
  desktopRecordingBar: {
    backgroundColor: '#FEE2E2',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  recordingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  desktopWaveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginRight: 16,
    height: 32,
  },
  desktopWaveBar: {
    width: 4,
    marginHorizontal: 2,
    backgroundColor: '#DC2626',
    borderRadius: 2,
  },
  stopRecordingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  stopText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Mobile Camera Button
  mobileToolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },

  // These styles are kept for compatibility but no longer used
  capturedImageContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  capturedImageWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    padding: 4,
  },
  capturedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
});
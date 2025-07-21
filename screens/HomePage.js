// screens/HomePage.js

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,              // <-- pull in Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
// import { Zap } from 'lucide-react-native';  <-- removed

console.log('🏠 HomePage rendered');

export default function HomePage() {
  const navigation = useNavigation();

  return (
    <LinearGradient
      colors={['#F9FAFB', '#FFFFFF']}
      style={styles.container}
    >
      <View style={styles.innerWrapper}>
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('../assets/SuperEngineer_Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.title}>Super Engineer</Text>
          <Text style={styles.subtitle}>Your Pocket Super Power</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Welcome</Text>
            <Text style={styles.cardDescription}>
              Choose an option to get started with your Pocket Super Power
            </Text>
          </View>
          <View style={styles.cardContent}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.primaryButtonText}>Login to Your Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.outlineButtonText}>Create New Account</Text>
            </TouchableOpacity>

            <View style={styles.noteWrapper}>
              <Text style={styles.noteText}>
                New users get 3 free queries to try our SPE assistant
              </Text>
            </View>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MAX_WIDTH = 360;

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
  logoSection: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logoImage: {
    width: 150,
    height: 150,
    marginBottom: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
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
  primaryButton: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 16,
  },
  outlineButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  noteWrapper: {
    alignItems: 'center',
    paddingTop: 16,
  },
  noteText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});

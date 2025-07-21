import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Settings as SettingsIcon,
  LogOut as LogOutIcon,
  UserCircle2,
} from 'lucide-react-native';

export default function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [storedEmail, setStoredEmail] = useState('');
  const [storedName, setStoredName] = useState('');
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      try {
        const email = await AsyncStorage.getItem('userEmail');
        const name = await AsyncStorage.getItem('userName');
        if (email) setStoredEmail(email);
        if (name) setStoredName(name);
      } catch (err) {
        console.warn('Error loading user data:', err);
      }
    })();
  }, []);

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isMenuOpen ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  if (!storedEmail) return null;

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await AsyncStorage.multiRemove([
      'isAuthenticated',
      'userEmail',
      'userName',
      'userRole',
      'freeQueries',
    ]);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const goToSettings = () => {
    setIsMenuOpen(false);
    navigation.navigate('Settings');
  };

  return (
    <View style={styles.wrapper}>
      {isMenuOpen && (
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.fullscreenOverlay} />
        </TouchableWithoutFeedback>
      )}

      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setIsMenuOpen((prev) => !prev)}
      >
        <UserCircle2 size={32} color="#333" />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {storedName || 'User'}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {storedEmail}
          </Text>
        </View>
        <SettingsIcon size={20} color="#333" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {isMenuOpen && (
        <Animated.View
          style={[
            styles.dropdown,
            {
              transform: [{ scale: scaleAnim }],
              opacity: scaleAnim,
            },
          ]}
        >
          <TouchableOpacity style={styles.dropdownItem} onPress={goToSettings}>
            <SettingsIcon size={18} color="#333" style={styles.dropdownIcon} />
            <Text style={styles.dropdownText}>Settings</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
            <LogOutIcon size={18} color="#E53935" style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: '#E53935' }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      android: { elevation: 8 },
      ios: { zIndex: 99 },
      default: { zIndex: 99 },
    }),
  },
  fullscreenOverlay: {
    position: 'fixed', // for web, ensures it overlays the whole viewport
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    backgroundColor: 'transparent',
    zIndex: 101,
  },
  userInfo: {
    marginLeft: 6,
    maxWidth: 120,
  },
  userName: {
    color: '#222',
    fontWeight: '600',
    fontSize: 14,
  },
  userEmail: {
    color: '#555',
    fontSize: 12,
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    right: 0,
    width: 170,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 4,
    zIndex: 9999,
    // iOS shadow
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    // Android elevation
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownIcon: {
    marginRight: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
});

// components/chatpage/UserAccount.js

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  LogOut,
  Settings,
  User,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AvatarDisplay } from '../AvatarSelector';

const { width: screenWidth } = Dimensions.get('window');

const UserAccount = ({
  userName,
  userEmail,
  navigation,
  openSidebar,
  isMobile,
  initialAvatar = 'default',
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(initialAvatar);
  const avatarButtonRef = useRef(null);

  // Load saved avatar on mount
  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const savedAvatar = await AsyncStorage.getItem('userAvatar');
        if (savedAvatar) {
          setSelectedAvatar(savedAvatar);
        }
      } catch (error) {
        console.error('Error loading avatar:', error);
      }
    };
    loadAvatar();
  }, []);

  // Handle logout with web fallback
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to logout?');
      if (!confirmed) return;
      try {
        await AsyncStorage.clear();
        navigation.navigate('Login');
      } catch (error) {
        console.error('Error during logout:', error);
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.clear();
                navigation.navigate('Login');
              } catch (error) {
                console.error('Error during logout:', error);
              }
            },
          },
        ]
      );
    }
  };

  const handleAvatarPress = () => {
    if (isMobile) {
      // On mobile, directly open the sidebar
      openSidebar?.();
    } else {
      // On desktop/web, toggle the dropdown menu
      setIsMenuOpen(!isMenuOpen);
    }
  };

  // Handle personalization navigation
  const handlePersonalizationPress = () => {
    console.log('Personalization pressed'); // Debug log
    setIsMenuOpen(false);
    
    try {
      // Try to navigate to Settings with personalization section active
      navigation.navigate('Settings', { 
        initialSection: 'personalization' 
      });
    } catch (error) {
      console.log('Failed to navigate with params, falling back to Settings');
      // Fallback to just Settings if the above doesn't work
      navigation.navigate('Settings');
    }
  };

  const renderAvatar = () => {
    return (
      <AvatarDisplay
        avatarId={selectedAvatar}
        size={36}
        onPress={handleAvatarPress}
        showBorder={true}
      />
    );
  };

  const renderDropdown = () => {
    if (!isMenuOpen || isMobile) return null;

    return (
      <>
        <TouchableOpacity
          style={styles.dropdownOverlay}
          onPress={() => setIsMenuOpen(false)}
          activeOpacity={1}
        />
        <View style={[styles.dropdownContainer, styles.desktopDropdown]}>
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              console.log('Settings pressed'); // Debug log
              setIsMenuOpen(false);
              navigation.navigate('Settings');
            }}
            activeOpacity={0.7}
          >
            <Settings size={18} color="#374151" />
            <Text style={styles.dropdownText}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={handlePersonalizationPress}
            activeOpacity={0.7}
          >
            <User size={18} color="#374151" />
            <Text style={styles.dropdownText}>Personalization</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dropdownItem, styles.logoutItem]}
            onPress={() => {
              console.log('Logout pressed'); // Debug log
              setIsMenuOpen(false);
              handleLogout();
            }}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#DC2626" />
            <Text style={[styles.dropdownText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  };

  // Keep renderAvatarModal for backward compatibility, but return null since we removed the modal
  const renderAvatarModal = () => null;

  return {
    renderAvatar,
    renderDropdown,
    renderAvatarModal,
    isMenuOpen,
    selectedAvatar,
  };
};

const styles = StyleSheet.create({
  dropdownOverlay: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    zIndex: 1000,
  },
  desktopDropdown: {
    position: 'absolute',
    top: 50,
    right: 12,
    minWidth: 180,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  logoutText: {
    color: '#DC2626',
  },
});

export default UserAccount;
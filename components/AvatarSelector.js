// components/AvatarSelector.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Camera,
  Edit3,
  X,
  Check,
  Zap,
} from 'lucide-react-native';

// Centralized Avatar options with Engineer themed names - Single source of truth
export const AVATAR_OPTIONS = [
  { id: 'default', name: 'Engineer Lumina', image: require('../assets/avatars/SuperEngineer_1.png'), color: '#F1C40F' },
  { id: 'avatar1', name: 'Engineer Ignitron', image: require('../assets/avatars/SuperEngineer_2.png'), color: '#F1C40F' },
  { id: 'avatar2', name: 'Engineer Voltora', image: require('../assets/avatars/SuperEngineer_3.png'), color: '#8B5CF6' },
  { id: 'avatar3', name: 'Engineer FerroStar', image: require('../assets/avatars/SuperEngineer_4.png'), color: '#F1C40F' },
  { id: 'avatar4', name: 'Engineer EcoNova', image: require('../assets/avatars/SuperEngineer_5.png'), color: '#8B5CF6' },
  { id: 'avatar5', name: 'Engineer AquaPulse', image: require('../assets/avatars/SuperEngineer_6.png'), color: '#17A2B8' },
  { id: 'avatar6', name: 'Engineer Aurion', image: require('../assets/avatars/SuperEngineer_7.png'), color: '#F1C40F' },
  { id: 'avatar7', name: 'Engineer ObsidianX', image: require('../assets/avatars/SuperEngineer_8.png'), color: '#2C3E50' },
  { id: 'avatar8', name: 'Engineer TerraBolt', image: require('../assets/avatars/SuperEngineer_9.png'), color: '#E74C3C' },
];

// Exported helper functions for other components to use
export const getAvatarById = (avatarId) => {
  return AVATAR_OPTIONS.find(a => a.id === avatarId) || AVATAR_OPTIONS[0];
};

export const getAvatarImage = (avatarId) => {
  const avatar = getAvatarById(avatarId);
  return avatar.image;
};

export const getAvatarColor = (avatarId) => {
  const avatar = getAvatarById(avatarId);
  return avatar.color;
};

export const getAvatarName = (avatarId) => {
  const avatar = getAvatarById(avatarId);
  return avatar.name;
};

// Avatar Selection Modal Component - can be used independently
export const AvatarSelectionModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  currentAvatar = 'default',
  title = "Choose Your Engineer",
  subtitle = "Select your digital persona"
}) => {
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState(currentAvatar);

  React.useEffect(() => {
    setTempSelectedAvatar(currentAvatar);
  }, [visible, currentAvatar]);

  const handleAvatarSelect = (avatarId) => {
    setTempSelectedAvatar(avatarId);
  };

  const handleConfirm = async () => {
    try {
      await AsyncStorage.setItem('userAvatar', tempSelectedAvatar);
      
      // Also update personalization settings if they exist
      const personalizationSettings = await AsyncStorage.getItem('personalizationSettings');
      if (personalizationSettings) {
        const settings = JSON.parse(personalizationSettings);
        settings.selectedAvatar = tempSelectedAvatar;
        await AsyncStorage.setItem('personalizationSettings', JSON.stringify(settings));
      }
      
      onConfirm?.(tempSelectedAvatar);
      
      // Show success message
      if (Platform.OS === 'web') {
        window.alert && window.alert('Avatar updated successfully!');
      } else {
        Alert.alert('Success', 'Avatar updated successfully!');
      }
    } catch (error) {
      console.error('Error saving avatar:', error);
      
      if (Platform.OS === 'web') {
        window.alert && window.alert('Failed to update avatar. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to update avatar. Please try again.');
      }
    }
  };

  const handleClose = () => {
    setTempSelectedAvatar(currentAvatar);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.avatarModalOverlay}>
        <View style={styles.avatarModalContainer}>
          {/* Header */}
          <View style={styles.avatarModalHeader}>
            <View style={styles.avatarHeaderContent}>
              <View style={styles.avatarHeaderIconContainer}>
                <Zap size={24} color="#FFFFFF" />
              </View>
              <View style={styles.avatarHeaderTextContainer}>
                <Text style={styles.avatarModalTitle}>{title}</Text>
                <Text style={styles.avatarModalSubtitle}>{subtitle}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.avatarModalClose}
              onPress={handleClose}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Avatar Grid */}
          <ScrollView 
            style={styles.avatarScrollContainer} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarScrollContent}
          >
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarCard,
                    tempSelectedAvatar === avatar.id && styles.avatarCardSelected
                  ]}
                  onPress={() => handleAvatarSelect(avatar.id)}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.avatarImageContainer,
                    { borderColor: avatar.color },
                    tempSelectedAvatar === avatar.id && { borderColor: avatar.color, borderWidth: 3 }
                  ]}>
                    <Image
                      source={avatar.image}
                      style={styles.avatarCardImage}
                      resizeMode="cover"
                    />
                    
                    {tempSelectedAvatar === avatar.id && (
                      <View style={[styles.avatarSelectedBadge, { backgroundColor: avatar.color }]}>
                        <Check size={14} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={styles.avatarNameContainer}>
                    <Text style={[
                      styles.avatarCardName,
                      tempSelectedAvatar === avatar.id && { color: avatar.color }
                    ]}>
                      {avatar.name}
                    </Text>
                    <View style={[styles.colorIndicator, { backgroundColor: avatar.color }]} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.avatarModalFooter}>
            <View style={styles.avatarFooterButtonContainer}>
              <TouchableOpacity
                style={styles.avatarCancelButton}
                onPress={handleClose}
              >
                <Text style={styles.avatarCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.avatarConfirmButton}
                onPress={handleConfirm}
              >
                <Text style={styles.avatarConfirmButtonText}>Update Avatar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Simple Avatar Display Component
export const AvatarDisplay = ({ 
  avatarId = 'default', 
  size = 48, 
  onPress,
  showBorder = true,
  style 
}) => {
  const avatar = getAvatarById(avatarId);
  
  return (
    <TouchableOpacity
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: 'hidden',
          borderWidth: showBorder ? 2 : 0,
          borderColor: avatar.color,
        },
        style
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Image
        source={avatar.image}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );
};

// Main AvatarSelector Component (for settings/personalization pages)
export default function AvatarSelector({ 
  selectedAvatar = 'default', 
  onAvatarChange, 
  isMobile = false 
}) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const getCurrentAvatar = () => getAvatarById(selectedAvatar);

  const handleOpenAvatarModal = () => {
    setShowAvatarModal(true);
  };

  const handleConfirmAvatarSelection = (newAvatarId) => {
    onAvatarChange?.(newAvatarId);
    setShowAvatarModal(false);
  };

  const handleCloseAvatarModal = () => {
    setShowAvatarModal(false);
  };

  const currentAvatar = getCurrentAvatar();

  return (
    <View>
      <TouchableOpacity 
        style={styles.avatarSelector}
        onPress={handleOpenAvatarModal}
        activeOpacity={0.7}
      >
        <View style={styles.currentAvatarContainer}>
          <View style={[styles.currentAvatarImageContainer, { borderColor: currentAvatar.color }]}>
            <Image
              source={currentAvatar.image}
              style={styles.currentAvatarImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.currentAvatarInfo}>
            <Text style={styles.currentAvatarName}>{currentAvatar.name}</Text>
            <Text style={styles.currentAvatarLabel}>Current Avatar</Text>
          </View>
        </View>
        <View style={styles.changeAvatarIconButton}>
          <Edit3 size={18} color="#000000" />
        </View>
      </TouchableOpacity>
      
      <AvatarSelectionModal
        visible={showAvatarModal}
        onClose={handleCloseAvatarModal}
        onConfirm={handleConfirmAvatarSelection}
        currentAvatar={selectedAvatar}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Avatar Selector Styles
  avatarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 280,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  currentAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentAvatarImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  currentAvatarImage: {
    width: '100%',
    height: '100%',
  },
  currentAvatarInfo: {
    flex: 1,
  },
  currentAvatarName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  currentAvatarLabel: {
    fontSize: 12,
    color: '#666666',
  },
  changeAvatarIconButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Avatar Modal Styles
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  avatarModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 450,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
    overflow: 'hidden',
  },
  avatarModalHeader: {
    backgroundColor: '#000000',
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarHeaderIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarHeaderTextContainer: {
    flex: 1,
  },
  avatarModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  avatarModalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '400',
  },
  avatarModalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Avatar Grid
  avatarScrollContainer: {
    flex: 1,
  },
  avatarScrollContent: {
    padding: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  avatarCard: {
    width: '30%',
    minWidth: 110,
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    marginBottom: 20,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCardSelected: {
    backgroundColor: '#F8FAFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarImageContainer: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarCardImage: {
    width: '100%',
    height: '100%',
  },
  avatarSelectedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarNameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  avatarCardName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 8,
  },
  colorIndicator: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },

  // Avatar Modal Footer
  avatarModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FAFAFA',
  },
  avatarFooterButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  avatarCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarCancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  avatarConfirmButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarConfirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
// components/chatpage/PlusButton.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Plus, Image as ImageIcon, Paperclip } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function PlusButton({ isMobile, onImagePicked, onFilePicked }) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [btnHeight, setBtnHeight] = useState(0);

  const toggleMenu = () => {
    console.log('🔵 PlusButton: toggleMenu →', !menuVisible);
    setMenuVisible(v => !v);
  };

  const handleImagePress = () => {
    console.log('🟢 PlusButton: Image button touched!');
    setMenuVisible(false);
    
    // Add small delay to ensure menu closes first
    setTimeout(() => {
      // Try image picker first, with document picker as fallback
      pickImageWithFallback();
    }, 100);
  };

  const handleDocumentPress = () => {
    console.log('🟡 PlusButton: Document button touched!');
    setMenuVisible(false);
    
    setTimeout(() => {
      pickDocument();
    }, 100);
  };

  const pickImageWithFallback = async () => {
    console.log('📸 PlusButton: Trying image picker first...');
    
    try {
      // First attempt: Use dedicated image picker
      const imageResult = await attemptImagePicker();
      
      if (imageResult && !imageResult.canceled && imageResult.assets?.length > 0) {
        console.log('✅ Image picker succeeded!');
        const asset = imageResult.assets[0];
        onImagePicked?.(asset);
        return;
      }
      
      console.log('⚠️ Image picker failed/canceled, trying document picker for images...');
      
      // Fallback: Use document picker with image filter
      const docResult = await DocumentPicker.getDocumentAsync({
        type: 'image/*', // Only allow images
        copyToCacheDirectory: true,
        multiple: false,
      });
      
      console.log('📄 Document picker (image) result:', docResult);

      if (docResult.canceled) {
        console.log('🚫 User canceled document picker too');
        return;
      }

      // Handle both new and old DocumentPicker formats
      const doc = docResult.assets?.[0] || docResult;
      
      if (!doc.uri) {
        console.log('❌ No valid image selected');
        Alert.alert('Error', 'No image was selected');
        return;
      }

      // Convert document picker result to image picker format
      const imageAsset = {
        uri: doc.uri,
        width: null, // Document picker doesn't provide dimensions
        height: null,
        type: 'image',
        fileName: doc.name,
        fileSize: doc.size,
        mimeType: doc.mimeType,
      };

      console.log('📤 Using document picker result as image:', imageAsset);
      onImagePicked?.(imageAsset);
      
    } catch (error) {
      console.error('💥 Error in pickImageWithFallback:', error);
      Alert.alert('Error', `Failed to pick image: ${error.message}`);
    }
  };

  const attemptImagePicker = async () => {
    try {
      console.log('📱 Platform:', Platform.OS);
      
      // Request permission
      console.log('🔐 Requesting camera roll permission...');
      
      if (Platform.OS === 'android') {
        const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('🔐 Media Library Permission:', mediaLibraryStatus);
        
        if (mediaLibraryStatus.status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your photo library.');
          return null;
        }
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('🔐 Permission result:', permissionResult);
        
        if (permissionResult.status !== 'granted') {
          Alert.alert('Permission Required', 'Please allow access to your photo library.');
          return null;
        }
      }

      console.log('✅ Permission granted, launching image picker...');
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
      });
      
      console.log('📸 Image picker result:', {
        canceled: result.canceled,
        hasAssets: !!result.assets,
        assetsLength: result.assets?.length || 0
      });

      return result;
      
    } catch (error) {
      console.error('💥 Error in attemptImagePicker:', error);
      return null;
    }
  };

  const pickDocument = async () => {
    console.log('📄 PlusButton: Starting document picker...');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });
      
      console.log('📄 Document picker result:', result);

      if (result.canceled) {
        console.log('🚫 User canceled document picker');
        return;
      }

      // Handle both new and old DocumentPicker formats
      const doc = result.assets?.[0] || result;
      
      if (onFilePicked) {
        console.log('📤 Calling onFilePicked callback...');
        onFilePicked(doc);
      } else {
        console.log('⚠️ No onFilePicked callback provided');
      }
      
    } catch (error) {
      console.error('💥 Error in pickDocument:', error);
      Alert.alert('Error', `Failed to pick document: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Plus Button */}
      <TouchableOpacity
        onPress={toggleMenu}
        onLayout={e => setBtnHeight(e.nativeEvent.layout.height)}
        style={[
          styles.mainButton,
          isMobile ? styles.mobileButton : styles.desktopButton
        ]}
        activeOpacity={0.7}
      >
        <Plus size={16} color="#374151" />
      </TouchableOpacity>

      {/* Menu */}
      {menuVisible && (
        <>
          {/* Background overlay */}
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => {
              console.log('🔵 Overlay pressed, closing menu');
              setMenuVisible(false);
            }}
            activeOpacity={1}
          />
          
          {/* Menu container */}
          <View style={[styles.menu, { bottom: btnHeight + 8 }]}>
            {/* Image option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleImagePress}
              activeOpacity={0.6}
            >
              <ImageIcon size={18} color="#374151" style={styles.icon} />
              <Text style={styles.menuText}>Upload Image</Text>
            </TouchableOpacity>
            
            {/* Document option */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDocumentPress}
              activeOpacity={0.6}
            >
              <Paperclip size={18} color="#374151" style={styles.icon} />
              <Text style={styles.menuText}>Attach File</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  
  mainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  
  mobileButton: {
    width: 48,
    height: 48,
    marginRight: 8,
  },
  
  desktopButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
  },
  
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 1001,
  },
  
  menu: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1002,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#E5E7EB',
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 50,
  },
  
  icon: {
    marginRight: 12,
  },
  
  menuText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});
// components/brain/UploadPhoto.js

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Camera, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Crown,
} from 'lucide-react-native';

// Import plan access control components
import {
  hasFeatureAccess,
  getBrainUploadAccess,
  FEATURES,
  PLAN_INFO,
} from '../../frontend/utils/planAccessManager';
import UpgradePrompt from '../UpgradePrompt';
import BrainSharingOptions from './BrainSharingOptions';

// Import expo-image-picker for mobile
let ImagePicker;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  // expo-image-picker not installed
  ImagePicker = null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function UploadPhoto({ 
  navigation, 
  userPlan: propUserPlan, 
  onUpgrade, 
  currentUploads = 0,
  userInfo = null 
}) {
  const insets = useSafeAreaInsets();
  const [selectedImages, setSelectedImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // User plan state - load from storage if not provided as prop
  const [userPlan, setUserPlan] = useState(propUserPlan || 'free');
  const [planLoading, setPlanLoading] = useState(!propUserPlan);
  
  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [addToCommunity, setAddToCommunity] = useState(true); // Default checked
  
  // Tooltip state
  const [showSharingTooltip, setShowSharingTooltip] = useState(false);

  // Teams data (in real app, this would come from props or context)
  const teams = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Design' },
  ];

  // Get plan info and access levels
  const planInfo = PLAN_INFO[userPlan] || PLAN_INFO.free;
  const uploadAccess = getBrainUploadAccess(userPlan);

  // Load user plan from storage if not provided as prop
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!propUserPlan) {
        try {
          setPlanLoading(true);
          const storedPlan = await AsyncStorage.getItem('userPlan');
          const finalPlan = storedPlan || 'free';
          setUserPlan(finalPlan);
          console.log('📸 UploadPhoto: Loaded user plan from storage:', finalPlan);
        } catch (error) {
          console.error('📸 UploadPhoto: Error loading user plan:', error);
          setUserPlan('free');
        } finally {
          setPlanLoading(false);
        }
      } else {
        setUserPlan(propUserPlan);
        setPlanLoading(false);
        console.log('📸 UploadPhoto: Using prop user plan:', propUserPlan);
      }
    };
    
    loadUserPlan();
  }, [propUserPlan]);

  // Check if user has access to photo uploads
  useEffect(() => {
    if (!planLoading) {
      const hasUploadAccess = hasFeatureAccess(userPlan, FEATURES.UPLOAD_PHOTOS);
      if (!hasUploadAccess) {
        setRestrictedFeature(FEATURES.UPLOAD_PHOTOS);
        setShowUpgradePrompt(true);
      }
    }
  }, [userPlan, planLoading]);

  // Handle upgrade action
  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradePrompt(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    } else {
      // Fallback navigation or action
      Alert.alert('Upgrade', `Please upgrade to ${PLAN_INFO[targetPlan].displayName} plan to access this feature.`);
    }
  };

  const requestPermissions = async () => {
    if (!ImagePicker) {
      Alert.alert(
        'Package Not Found',
        'expo-image-picker is not properly installed. Please run:\n\nnpm install expo-image-picker\n\nand restart your app.',
        [
          { text: 'OK' },
          { 
            text: 'Demo Mode', 
            onPress: () => addDemoImage()
          }
        ]
      );
      return false;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload images.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const pickImageFromLibrary = async () => {
    // Check upload limits for free users
    if (userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit) {
      Alert.alert(
        'Upload Limit Reached',
        `Free plan allows ${uploadAccess.uploadLimit} uploads per month. You've used ${currentUploads}/${uploadAccess.uploadLimit}. Upgrade to Solo for 100 uploads per month.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade to Solo', 
            onPress: () => handleUpgradeAction('solo')
          }
        ]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          id: Date.now() + index,
          uri: asset.uri,
          name: `image_${Date.now()}_${index}.jpg`,
          size: asset.fileSize || Math.floor(Math.random() * 1000000) + 100000,
          width: asset.width,
          height: asset.height,
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images: ' + error.message);
    }
  };

  const takePhoto = async () => {
    // Check upload limits for free users
    if (userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit) {
      Alert.alert(
        'Upload Limit Reached',
        `Free plan allows ${uploadAccess.uploadLimit} uploads per month. You've used ${currentUploads}/${uploadAccess.uploadLimit}. Upgrade to Solo for 100 uploads per month.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade to Solo', 
            onPress: () => handleUpgradeAction('solo')
          }
        ]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'We need access to your camera to take photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newImage = {
          id: Date.now(),
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize || Math.floor(Math.random() * 1000000) + 100000,
          width: asset.width,
          height: asset.height,
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const addDemoImage = () => {
    const demoImage = {
      id: Date.now(),
      uri: `https://picsum.photos/400/300?random=${Date.now()}`,
      name: `demo_image_${Date.now()}.jpg`,
      size: Math.floor(Math.random() * 1000000) + 100000,
      width: 400,
      height: 300,
    };
    setSelectedImages(prev => [...prev, demoImage]);
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const uploadImages = async () => {
    if (selectedImages.length === 0) {
      Alert.alert('No Images', 'Please select or take photos first.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your images.');
      return;
    }

    if (!addToCommunity && !isPublic && selectedTeams.length === 0) {
      Alert.alert('Sharing Required', 'Please add to community, make content public in organization, or select at least one team.');
      return;
    }

    // Check upload limits again before uploading
    if (userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit) {
      Alert.alert(
        'Upload Limit Reached',
        `Free plan allows ${uploadAccess.uploadLimit} uploads per month. Upgrade to Solo for more uploads.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade', 
            onPress: () => handleUpgradeAction('solo')
          }
        ]
      );
      return;
    }

    setIsUploading(true);
    
    try {
      // Simulate upload process
      for (let i = 0; i < selectedImages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Reset form after successful upload
      const resetForm = () => {
        setSelectedImages([]);
        setTitle('');
        setDescription('');
        setSelectedTeams([]);
        setIsPublic(false);
        setAddToCommunity(true);
        setShowSharingTooltip(false);
      };

      Alert.alert(
        'Upload Complete! 🎉',
        `Successfully uploaded ${selectedImages.length} image(s) to your brain! ${userPlan === 'free' ? `\n\nFree plan: ${currentUploads + 1}/${uploadAccess.uploadLimit} uploads used this month.` : ''}`,
        [
          { 
            text: 'Add More Photos', 
            onPress: resetForm
          },
          { 
            text: 'Done', 
            onPress: () => {
              resetForm();
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Upload Failed', 'Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return selectedImages.reduce((total, image) => total + (image.size || 0), 0);
  };

  const canUpload = selectedImages.length > 0 && title.trim() && (addToCommunity || isPublic || selectedTeams.length > 0);

  // Show loading state while plan is being determined
  if (planLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerIcon}>
              <Camera size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Upload Photos</Text>
              {/* Plan indicator */}
              <View style={styles.planIndicator}>
                <Text style={styles.planIcon}>{planInfo.icon}</Text>
                <Text style={styles.planText}>{planInfo.displayName}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.uploadButton, !canUpload && styles.uploadButtonDisabled]} 
            onPress={uploadImages}
            disabled={!canUpload || isUploading}
          >
            <Upload size={18} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: Math.max(insets.bottom + 40, 40),
            flexGrow: 1
          }}
          onScrollBeginDrag={() => setShowSharingTooltip(false)}
        >
          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your images a descriptive title..."
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                returnKeyType="next"
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Describe what these images show (optional)..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Enhanced Sharing & Visibility using BrainSharingOptions */}
            <BrainSharingOptions
              userPlan={userPlan}
              addToCommunity={addToCommunity}
              setAddToCommunity={setAddToCommunity}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
              selectedTeams={selectedTeams}
              setSelectedTeams={setSelectedTeams}
              teams={teams}
              onUpgrade={handleUpgradeAction}
              showSharingTooltip={showSharingTooltip}
              setShowSharingTooltip={setShowSharingTooltip}
              currentUploads={currentUploads}
              uploadLimit={uploadAccess.uploadLimit}
            />
          </View>

          {/* Upload Limit Info for Free Users */}
          {userPlan === 'free' && (
            <View style={styles.uploadLimitSection}>
              <View style={styles.uploadLimitHeader}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.uploadLimitTitle}>Free Plan Limit</Text>
              </View>
              <Text style={styles.uploadLimitText}>
                {currentUploads}/{uploadAccess.uploadLimit} uploads used this month
              </Text>
              <Text style={styles.uploadLimitDescription}>
                Upgrade to Solo for 100 uploads per month and private storage options.
              </Text>
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={() => handleUpgradeAction('solo')}
              >
                <Crown size={14} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>Upgrade to Solo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[
                styles.actionButton,
                userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit && styles.actionButtonDisabled
              ]} 
              onPress={takePhoto}
              disabled={userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit}
            >
              <Camera size={24} color="#000000" />
              <Text style={styles.actionButtonText}>
                {userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit 
                  ? 'Upload Limit Reached' 
                  : 'Take Photo'
                }
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.actionButton,
                userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit && styles.actionButtonDisabled
              ]} 
              onPress={pickImageFromLibrary}
              disabled={userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit}
            >
              <Plus size={24} color="#000000" />
              <Text style={styles.actionButtonText}>
                {userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit 
                  ? 'Upload Limit Reached' 
                  : 'Choose from Library'
                }
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selected Images */}
          {selectedImages.length > 0 && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <View>
                  <Text style={styles.selectedTitle}>
                    Selected Images ({selectedImages.length})
                  </Text>
                  <Text style={styles.totalSize}>
                    Total size: {formatFileSize(getTotalSize())}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedImages([])}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.imageGrid}>
                {selectedImages.map((image) => (
                  <View key={image.id} style={styles.imageItem}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={() => removeImage(image.id)}
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.imageInfo}>
                      <Text style={styles.imageName} numberOfLines={1}>
                        {image.name}
                      </Text>
                      <Text style={styles.imageSize}>
                        {formatFileSize(image.size)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Empty State */}
          {selectedImages.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Camera size={48} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyTitle}>No photos selected</Text>
              <Text style={styles.emptyDescription}>
                Take a photo or choose from your library to get started
              </Text>
              {userPlan === 'free' && (
                <Text style={styles.emptyPlanNote}>
                  Free plan: {uploadAccess.uploadLimit} uploads per month • Community sharing only
                </Text>
              )}
            </View>
          )}

          {/* Info Boxes */}
          <View style={styles.infoSection}>
            <View style={styles.infoBox}>
              <View style={styles.infoHeader}>
                <AlertCircle size={18} color="#2563EB" />
                <Text style={styles.infoTitle}>About Photo Uploads</Text>
              </View>
              <Text style={styles.infoText}>
                Photos can contain valuable information like diagrams, screenshots, equipment photos, or visual references. 
                Upload images that will help build your knowledge base and assist with future tasks.
              </Text>
            </View>

            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <Camera size={18} color="#059669" />
                <Text style={styles.tipTitle}>Tips for Better Results</Text>
              </View>
              <Text style={styles.tipText}>
                • Use clear, high-resolution images{'\n'}
                • Include diagrams and technical drawings{'\n'}
                • Capture equipment photos from multiple angles{'\n'}
                • Take screenshots of important screens{'\n'}
                • Add annotations when helpful
              </Text>
            </View>

            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <Camera size={18} color="#10B981" />
                <Text style={styles.tipTitle}>Plan Benefits</Text>
              </View>
              <Text style={styles.tipText}>
                {userPlan === 'free' && '• Free: 3 uploads/month, community sharing only\n• Solo: 100 uploads/month, private storage\n• Team: Unlimited uploads, organization sharing'}
                {userPlan === 'solo' && '• Solo: 100 uploads/month, private storage\n• Team: Unlimited uploads, organization sharing\n• Enterprise: Advanced security & analytics'}
                {(userPlan === 'team' || userPlan === 'enterprise') && '• Unlimited uploads per month\n• Organization and team sharing\n• Advanced access controls\n• Priority support'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={handleUpgradeAction}
        currentPlan={userPlan}
        feature={restrictedFeature}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  planIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  planIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  planText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  uploadButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  descriptionInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  uploadLimitSection: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  uploadLimitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadLimitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 6,
  },
  uploadLimitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 4,
  },
  uploadLimitDescription: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 12,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  upgradeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  actionSection: {
    padding: 20,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  actionButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  selectedSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  totalSize: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfo: {
    padding: 12,
  },
  imageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  imageSize: {
    fontSize: 12,
    color: '#666666',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: '#F8F9FA',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  emptyPlanNote: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 16,
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
  tipBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});
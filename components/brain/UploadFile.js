// components/brain/UploadFile.js

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  File, 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  FileText, 
  Image, 
  Video,
  Music,
  Archive,
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

// Import document picker for mobile
let DocumentPicker;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  // expo-document-picker not installed
  DocumentPicker = null;
}

export default function UploadFile({ 
  navigation, 
  userPlan: propUserPlan, 
  onUpgrade, 
  currentUploads = 0,
  userInfo = null 
}) {
  const insets = useSafeAreaInsets();
  const [selectedFiles, setSelectedFiles] = useState([]);
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
          console.log('📁 UploadFile: Loaded user plan from storage:', finalPlan);
        } catch (error) {
          console.error('📁 UploadFile: Error loading user plan:', error);
          setUserPlan('free');
        } finally {
          setPlanLoading(false);
        }
      } else {
        setUserPlan(propUserPlan);
        setPlanLoading(false);
        console.log('📁 UploadFile: Using prop user plan:', propUserPlan);
      }
    };
    
    loadUserPlan();
  }, [propUserPlan]);

  // Check if user has access to file uploads
  useEffect(() => {
    if (!planLoading) {
      const hasUploadAccess = hasFeatureAccess(userPlan, FEATURES.UPLOAD_FILES);
      if (!hasUploadAccess) {
        setRestrictedFeature(FEATURES.UPLOAD_FILES);
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

  const pickFiles = async () => {
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

    if (!DocumentPicker) {
      Alert.alert(
        'Package Not Found',
        'expo-document-picker is not properly installed. Please run:\n\nnpm install expo-document-picker\n\nand restart your app.',
        [
          { text: 'OK' },
          { 
            text: 'Demo Mode', 
            onPress: () => addDemoFiles()
          }
        ]
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Accept all file types
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map((asset, index) => ({
          id: Date.now() + index,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType,
          uri: asset.uri,
          uploadedAt: new Date().toISOString(),
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick files: ' + error.message);
    }
  };

  const addDemoFiles = () => {
    const demoFiles = [
      {
        id: Date.now() + 1,
        name: 'Project_Report.pdf',
        size: 3456789,
        type: 'application/pdf',
        uri: 'demo://project-report.pdf',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 2,
        name: 'Presentation.pptx',
        size: 8765432,
        type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        uri: 'demo://presentation.pptx',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 3,
        name: 'Data_Sheet.xlsx',
        size: 1234567,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        uri: 'demo://data-sheet.xlsx',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 4,
        name: 'Archive.zip',
        size: 9876543,
        type: 'application/zip',
        uri: 'demo://archive.zip',
        uploadedAt: new Date().toISOString(),
      },
      {
        id: Date.now() + 5,
        name: 'Demo_Video.mp4',
        size: 15432567,
        type: 'video/mp4',
        uri: 'demo://demo-video.mp4',
        uploadedAt: new Date().toISOString(),
      }
    ];
    setSelectedFiles(prev => [...prev, ...demoFiles]);
  };

  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      Alert.alert('No Files', 'Please select files first.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your files.');
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
      // Simulate upload process with progress
      for (let i = 0; i < selectedFiles.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Reset form after successful upload
      const resetForm = () => {
        setSelectedFiles([]);
        setTitle('');
        setDescription('');
        setSelectedTeams([]);
        setIsPublic(false);
        setAddToCommunity(true);
        setShowSharingTooltip(false);
      };

      Alert.alert(
        'Upload Complete! 🎉',
        `Successfully uploaded ${selectedFiles.length} file(s) to your brain! ${userPlan === 'free' ? `\n\nFree plan: ${currentUploads + 1}/${uploadAccess.uploadLimit} uploads used this month.` : ''}`,
        [
          { 
            text: 'Add More Files', 
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
      Alert.alert('Upload Failed', 'Failed to upload files. Please try again.');
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

  const getFileIcon = (mimeType, fileName) => {
    if (!mimeType && !fileName) {
      return { icon: File, color: '#666666' };
    }

    // Check by mime type first
    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        return { icon: Image, color: '#666666' };
      }
      if (mimeType.startsWith('video/')) {
        return { icon: Video, color: '#666666' };
      }
      if (mimeType.startsWith('audio/')) {
        return { icon: Music, color: '#666666' };
      }
      if (mimeType.includes('pdf')) {
        return { icon: FileText, color: '#666666' };
      }
      if (mimeType.includes('word') || mimeType.includes('document')) {
        return { icon: FileText, color: '#666666' };
      }
      if (mimeType.includes('sheet') || mimeType.includes('excel')) {
        return { icon: FileText, color: '#666666' };
      }
      if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
        return { icon: FileText, color: '#666666' };
      }
      if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) {
        return { icon: Archive, color: '#666666' };
      }
      if (mimeType.includes('text')) {
        return { icon: FileText, color: '#666666' };
      }
    }

    // Fallback to file extension
    if (fileName) {
      const ext = fileName.toLowerCase().split('.').pop();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'webp':
          return { icon: Image, color: '#666666' };
        case 'mp4':
        case 'avi':
        case 'mov':
        case 'mkv':
          return { icon: Video, color: '#666666' };
        case 'mp3':
        case 'wav':
        case 'ogg':
        case 'flac':
          return { icon: Music, color: '#666666' };
        case 'pdf':
          return { icon: FileText, color: '#666666' };
        case 'doc':
        case 'docx':
          return { icon: FileText, color: '#666666' };
        case 'xls':
        case 'xlsx':
          return { icon: FileText, color: '#666666' };
        case 'ppt':
        case 'pptx':
          return { icon: FileText, color: '#666666' };
        case 'zip':
        case 'rar':
        case '7z':
        case 'tar':
          return { icon: Archive, color: '#666666' };
        case 'txt':
        case 'md':
        case 'csv':
          return { icon: FileText, color: '#666666' };
        default:
          return { icon: File, color: '#666666' };
      }
    }

    return { icon: File, color: '#666666' };
  };

  const getFileTypeLabel = (mimeType, fileName) => {
    if (mimeType) {
      const parts = mimeType.split('/');
      if (parts.length === 2) {
        return parts[1].toUpperCase();
      }
    }
    
    if (fileName) {
      const ext = fileName.split('.').pop();
      if (ext) {
        return ext.toUpperCase();
      }
    }
    
    return 'FILE';
  };

  const renderFileItem = ({ item }) => {
    const { icon: IconComponent, color } = getFileIcon(item.type, item.name);
    const typeLabel = getFileTypeLabel(item.type, item.name);
    
    return (
      <View style={styles.fileItem}>
        <View style={[styles.fileIcon, { backgroundColor: '#F8F9FA' }]}>
          <IconComponent size={20} color={color} />
        </View>
        
        <View style={styles.fileDetails}>
          <Text style={styles.fileName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.fileSize}>
            {formatFileSize(item.size)}
          </Text>
          <Text style={styles.fileType}>
            {typeLabel}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.removeFileButton}
          onPress={() => removeFile(item.id)}
        >
          <Trash2 size={16} color="#DC2626" />
        </TouchableOpacity>
      </View>
    );
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((total, file) => total + (file.size || 0), 0);
  };

  const canUpload = selectedFiles.length > 0 && title.trim() && (addToCommunity || isPublic || selectedTeams.length > 0);

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
              <File size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Upload Files</Text>
              {/* Plan indicator */}
              <View style={styles.planIndicator}>
                <Text style={styles.planIcon}>{planInfo.icon}</Text>
                <Text style={styles.planText}>{planInfo.displayName}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.uploadButton, !canUpload && styles.uploadButtonDisabled]} 
            onPress={uploadFiles}
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
                placeholder="Give your files a descriptive title..."
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
                placeholder="Describe what these files contain (optional)..."
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

          {/* Add Files Section */}
          <View style={styles.addSection}>
            <TouchableOpacity 
              style={[
                styles.addButton,
                userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit && styles.addButtonDisabled
              ]} 
              onPress={pickFiles}
              disabled={userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit}
            >
              <Plus size={24} color="#000000" />
              <Text style={styles.addButtonText}>
                {userPlan === 'free' && currentUploads >= uploadAccess.uploadLimit 
                  ? 'Upload Limit Reached' 
                  : 'Select Files'
                }
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.supportedTypes}>
              All file types supported • Documents, Images, Videos, Archives, etc.
            </Text>
          </View>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <View style={styles.selectedSection}>
              <View style={styles.selectedHeader}>
                <View>
                  <Text style={styles.selectedTitle}>
                    Selected Files ({selectedFiles.length})
                  </Text>
                  <Text style={styles.totalSize}>
                    Total size: {formatFileSize(getTotalSize())}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFiles([])}>
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={selectedFiles}
                renderItem={renderFileItem}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          )}

          {/* Empty State */}
          {selectedFiles.length === 0 && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <File size={48} color="#CCCCCC" />
              </View>
              <Text style={styles.emptyTitle}>No files selected</Text>
              <Text style={styles.emptyDescription}>
                Select any type of file to add to your knowledge base
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
                <Text style={styles.infoTitle}>Supported File Types</Text>
              </View>
              <Text style={styles.infoText}>
                <Text style={styles.infoCategory}>Documents:</Text> PDF, DOC, DOCX, TXT, MD{'\n'}
                <Text style={styles.infoCategory}>Spreadsheets:</Text> XLS, XLSX, CSV{'\n'}
                <Text style={styles.infoCategory}>Presentations:</Text> PPT, PPTX{'\n'}
                <Text style={styles.infoCategory}>Images:</Text> JPG, PNG, GIF, WebP{'\n'}
                <Text style={styles.infoCategory}>Media:</Text> MP4, MP3, AVI, WAV{'\n'}
                <Text style={styles.infoCategory}>Archives:</Text> ZIP, RAR, 7Z{'\n'}
                <Text style={styles.infoCategory}>And many more...</Text>
              </Text>
            </View>

            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <File size={18} color="#059669" />
                <Text style={styles.tipTitle}>Best Practices</Text>
              </View>
              <Text style={styles.tipText}>
                • Use descriptive filenames{'\n'}
                • Keep file sizes reasonable{'\n'}
                • Organize files by project or topic{'\n'}
                • Include metadata when possible{'\n'}
                • Remove sensitive information before upload
              </Text>
            </View>

            <View style={styles.tipBox}>
              <View style={styles.tipHeader}>
                <File size={18} color="#10B981" />
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
  addSection: {
    padding: 20,
    paddingBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    gap: 12,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  supportedTypes: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
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
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  removeFileButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#666666',
    marginLeft: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  infoCategory: {
    fontWeight: '600',
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
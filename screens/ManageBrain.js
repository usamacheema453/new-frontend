// screens/ManageBrain.js
// Enhanced version with plan-based access control and real-time scoring system
// UPDATED: Fixed scoring integration and animation targeting

import React, { useState, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput,
  Alert,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FileText,
  BookOpen,
  Brain,
  ChevronRight,
  Lightbulb,
  Camera,
  File,
  AlertCircle,
  Check,
  Save,
  X,
  Plus,
  Trash2,
  Upload,
  Clock,
  UserCheck,
  Globe,
  Building2,
  Lock,
  Crown,
} from 'lucide-react-native';

// UPDATED: Import enhanced scoring system
import ScoringAnimationOverlay, { 
  useScoringManager, 
  ANIMATION_TYPES 
} from '../components/scoring/ScoringAnimationOverlay';

// Import the new user popup component
import NewUserBrainPopup from '../components/brain/NewUserBrainPopup';
// Import the brain access manager
import { getBrainAccessStatus, requestBrainAccess } from '../utils/brainAccessManager';

// Import plan access control components
import {
  hasFeatureAccess,
  getBrainUploadAccess,
  FEATURES,
  PLAN_INFO,
} from '../utils/planAccessManager';
import UpgradePrompt from '../components/UpgradePrompt';
import PlanLockedFeature from '../components/PlanLockedFeature';
import BrainSharingOptions from '../components/brain/BrainSharingOptions';

// Import document/image pickers
let DocumentPicker, ImagePicker;
try {
  DocumentPicker = require('expo-document-picker');
  ImagePicker = require('expo-image-picker');
} catch (e) {
  DocumentPicker = null;
  ImagePicker = null;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_DESKTOP = SCREEN_WIDTH >= 768;
const SIDEBAR_WIDTH = 280;

// Updated BRAIN_OPTIONS with correct plan requirements
const BRAIN_OPTIONS = [
  {
    id: 'write-tips',
    title: 'Write Tips/Tricks',
    description: 'Share your knowledge and insights',
    icon: Lightbulb,
    action: 'WriteTips',
    details: 'Create written tips, tricks, best practices, and knowledge sharing content',
    requiredFeature: null,
    requiredPlan: 'free',
    examples: [
      'Troubleshooting procedures',
      'Step-by-step guides',
      'Time-saving shortcuts',
      'Safety reminders',
      'Configuration tips'
    ]
  },
  {
    id: 'upload-photo',
    title: 'Upload Photos',
    description: 'Add visual content and images',
    icon: Camera,
    action: 'UploadPhoto',
    details: 'Upload images that contain valuable visual information',
    requiredFeature: FEATURES.UPLOAD_PHOTOS,
    requiredPlan: 'free',
    examples: [
      'Network diagrams',
      'Equipment photos',
      'Screenshots',
      'Technical drawings',
      'Visual references'
    ]
  },
  {
    id: 'upload-manuals',
    title: 'Upload Manuals',
    description: 'Add documentation and guides',
    icon: BookOpen,
    action: 'UploadManuals',
    details: 'Upload PDF, Word, and text files containing manuals and documentation',
    requiredFeature: FEATURES.UPLOAD_MANUALS,
    requiredPlan: 'free',
    examples: [
      'User manuals',
      'Installation guides',
      'Operating procedures',
      'Technical documentation',
      'Safety manuals'
    ]
  },
  {
    id: 'upload-file',
    title: 'Upload Documents',
    description: 'Add any type of document or file',
    icon: File,
    action: 'UploadFile',
    details: 'Upload any file type to expand your knowledge base',
    requiredFeature: FEATURES.UPLOAD_FILES,
    requiredPlan: 'free',
    examples: [
      'Spreadsheets',
      'Presentations',
      'Media files',
      'Archives',
      'Data files'
    ]
  },
];

export default function ManageBrain({ 
  navigation, 
  userInfo = null, 
  userPlan: propUserPlan, 
  onUpgrade, 
  currentUploads = 0,
  pointsScoreRef = null // Accept pointsScoreRef from parent 
}) {
  const insets = useSafeAreaInsets();
  const [selectedOption, setSelectedOption] = useState('write-tips');
  const [showForm, setShowForm] = useState(false);
  
  // User plan state - load from storage if not provided as prop
  const [userPlan, setUserPlan] = useState(propUserPlan || 'free');
  const [planLoading, setPlanLoading] = useState(!propUserPlan);
  
  // Brain Access Management
  const [brainRequestStatus, setBrainRequestStatus] = useState('none');
  const [showNewUserPopup, setShowNewUserPopup] = useState(false);
  const [hasCompletedInitialRequest, setHasCompletedInitialRequest] = useState(false);
  
  // Upgrade prompt state
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState(null);
  
  // Common form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTeams, setSelectedTeams] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [addToCommunity, setAddToCommunity] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Tooltip state
  const [showSharingTooltip, setShowSharingTooltip] = useState(false);

  // Tips specific
  const [tipContent, setTipContent] = useState('');

  // File/Image specific
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  // Teams data
  const teams = [
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Design' },
  ];

  // UPDATED: Enhanced scoring system setup
  const saveButtonRef = useRef(null);
  
  // UPDATED: Calculate target position for animations (sidebar score location)
  const getScoringTargetPosition = () => {
    if (IS_DESKTOP) {
      // Desktop sidebar score position - adjusted for actual sidebar location
      return { x: 140, y: 80 };
    } else {
      // Mobile header score position - this should target where score would be displayed
      return { x: 60, y: 100 };
    }
  };

  // UPDATED: Initialize scoring manager with proper target
  const {
    animationRef,
    awardPoints,
    handlePointsAwarded,
    ScoringOverlay,
  } = useScoringManager(pointsScoreRef, getScoringTargetPosition());

  // UPDATED: Enhanced function to get save button position for animations
  const getSaveButtonPosition = () => {
    if (!saveButtonRef?.current) {
      // Fallback to estimated position
      return IS_DESKTOP 
        ? { x: SCREEN_WIDTH - 150, y: 80 } 
        : { x: SCREEN_WIDTH - 100, y: 80 };
    }
    
    // For web, get actual button position
    if (Platform.OS === 'web' && saveButtonRef.current.getBoundingClientRect) {
      try {
        const rect = saveButtonRef.current.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      } catch (error) {
        console.warn('Could not get button position:', error);
      }
    }
    
    // For native, use measure
    if (Platform.OS !== 'web' && saveButtonRef.current.measure) {
      return new Promise((resolve) => {
        saveButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
          resolve({
            x: pageX + width / 2,
            y: pageY + height / 2,
          });
        });
      });
    }
    
    // Final fallback
    return IS_DESKTOP 
      ? { x: SCREEN_WIDTH - 150, y: 80 } 
      : { x: SCREEN_WIDTH - 100, y: 80 };
  };

  // Hidden file input refs for web
  const fileInputRefs = {
    'upload-photo': useRef(null),
    'upload-manuals': useRef(null),
    'upload-file': useRef(null),
  };

  // Get plan info - update when userPlan changes
  const planInfo = PLAN_INFO[userPlan] || PLAN_INFO.free;
  const uploadAccess = getBrainUploadAccess(userPlan);

  // Debug logging for plan detection
  useEffect(() => {
    if (!IS_DESKTOP) {
      console.log('📋 ManageBrain: Current user plan:', userPlan);
      console.log('📋 ManageBrain: Plan info:', planInfo);
      console.log('📋 ManageBrain: Upload access:', uploadAccess);
    }
  }, [userPlan, planInfo, uploadAccess]);

  // Check brain access status on mount
  useEffect(() => {
    checkBrainAccessStatus();
  }, []);

  // Load user plan from storage if not provided as prop
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!propUserPlan) {
        try {
          setPlanLoading(true);
          const storedPlan = await AsyncStorage.getItem('userPlan');
          const finalPlan = storedPlan || 'free';
          setUserPlan(finalPlan);
          
          if (!IS_DESKTOP) {
            console.log('📋 ManageBrain: Loaded user plan from storage:', finalPlan);
          }
        } catch (error) {
          if (!IS_DESKTOP) {
            console.error('📋 ManageBrain: Error loading user plan:', error);
          }
          setUserPlan('free');
        } finally {
          setPlanLoading(false);
        }
      } else {
        setUserPlan(propUserPlan);
        setPlanLoading(false);
        if (!IS_DESKTOP) {
          console.log('📋 ManageBrain: Using prop user plan:', propUserPlan);
        }
      }
    };
    
    loadUserPlan();
  }, [propUserPlan]);

  // Reset form when selectedOption changes
  useEffect(() => {
    if (showForm) {
      resetForm();
    }
  }, [selectedOption]);

  // Close tooltip when user interacts with other elements
  useEffect(() => {
    if (Platform.OS === 'web' && showSharingTooltip) {
      const handleClickOutside = () => {
        setShowSharingTooltip(false);
      };
      
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showSharingTooltip]);

  // Check if user has brain access or has requested it
  const checkBrainAccessStatus = async () => {
    try {
      // Get the actual status from storage/API
      const status = await getBrainAccessStatus(userInfo?.id || 'anonymous');
      
      if (!IS_DESKTOP) {
        console.log('Brain access status:', status);
      }
      
      setBrainRequestStatus(status.status);
      
      // Check if user has completed the initial request flow
      if (status.status !== 'none') {
        setHasCompletedInitialRequest(true);
      }
      
      // Show popup only for completely new users (never requested)
      if (status.status === 'none') {
        setShowNewUserPopup(true);
      }
      
    } catch (error) {
      if (!IS_DESKTOP) {
        console.error('Error checking brain access status:', error);
      }
      // Default to new user if status can't be determined
      setBrainRequestStatus('none');
      setShowNewUserPopup(true);
    }
  };

  // Handle brain request from popup
  const handleBrainRequested = async () => {
    try {
      // Submit the brain access request
      await requestBrainAccess(userInfo?.id || 'anonymous', userInfo);
      
      // Update local state
      setBrainRequestStatus('requested');
      setHasCompletedInitialRequest(true);
      
      if (!IS_DESKTOP) {
        console.log('Brain access requested for user:', userInfo?.id || 'anonymous');
        console.log('Brain request status set to: requested');
      }
    } catch (error) {
      if (!IS_DESKTOP) {
        console.error('Error requesting brain access:', error);
      }
      throw error; // Let the popup handle the error
    }
  };

  // Handle popup close - navigate back to chat on X click
  const handlePopupClose = (brainWasRequested) => {
    if (!IS_DESKTOP) {
      console.log('🔄 ManageBrain: handlePopupClose called');
      console.log('🔄 brainWasRequested:', brainWasRequested);
      console.log('🔄 brainRequestStatus:', brainRequestStatus);
      console.log('🔄 hasCompletedInitialRequest:', hasCompletedInitialRequest);
    }
    
    setShowNewUserPopup(false);
    
    // Navigate back to chat in these cases:
    const shouldNavigateBack = (brainWasRequested && brainRequestStatus === 'requested') || 
                              (!brainWasRequested && brainRequestStatus === 'none');
    
    if (shouldNavigateBack) {
      if (!IS_DESKTOP) {
        console.log('🚀 Navigating back to chat - either completed request or cancelled');
      }
      
      // Navigate to chat page
      if (navigation) {
        const possibleRoutes = ['Chat', 'ChatPage', 'ChatScreen', 'Home'];
        
        let navigationSuccessful = false;
        for (const routeName of possibleRoutes) {
          try {
            if (!IS_DESKTOP) {
              console.log(`🚀 Attempting navigation to: ${routeName}`);
            }
            navigation.navigate(routeName);
            if (!IS_DESKTOP) {
              console.log(`✅ Successfully navigated to ${routeName}`);
            }
            navigationSuccessful = true;
            break;
          } catch (error) {
            if (!IS_DESKTOP) {
              console.log(`❌ Failed to navigate to ${routeName}:`, error.message);
            }
          }
        }
        
        if (!navigationSuccessful) {
          try {
            navigation.goBack();
            if (!IS_DESKTOP) {
              console.log('✅ Successfully navigated back');
            }
          } catch (error) {
            if (!IS_DESKTOP) {
              console.warn('🚀 All navigation attempts failed:', error);
            }
          }
        }
      } else {
        if (!IS_DESKTOP) {
          console.error('❌ Navigation object is not available');
        }
      }
    } else {
      if (!IS_DESKTOP) {
        console.log('🔄 No navigation needed:', {
          brainWasRequested,
          brainRequestStatus,
          shouldNavigateBack
        });
      }
    }
  };

  // Enhanced reset form function
  const resetForm = () => {
    if (!IS_DESKTOP) {
      console.log('🔄 Resetting form...');
    }
    
    // Reset all text inputs
    setTitle('');
    setDescription('');
    setTipContent('');
    
    // Reset sharing/visibility settings to defaults
    setSelectedTeams([]);
    setIsPublic(false);
    setAddToCommunity(true);
    
    // Reset file/image uploads
    setSelectedFiles([]);
    setSelectedImages([]);
    
    // Reset loading state
    setIsLoading(false);
    
    // Close any open tooltips
    setShowSharingTooltip(false);
    
    // Clear web file inputs
    if (Platform.OS === 'web') {
      Object.values(fileInputRefs).forEach(ref => {
        if (ref.current) {
          ref.current.value = '';
        }
      });
    }
    
    if (!IS_DESKTOP) {
      console.log('✅ Form reset completed');
    }
  };

  // Handle restricted feature access
  const handleRestrictedFeature = (feature, option) => {
    setRestrictedFeature(feature);
    setShowUpgradePrompt(true);
  };

  // Handle upgrade action
  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradePrompt(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    }
  };

  // Handle option selection with plan restrictions
  const handleOptionSelect = (option) => {
    // Only show popup for completely new users (never requested)
    if (brainRequestStatus === 'none' && !hasCompletedInitialRequest) {
      setShowNewUserPopup(true);
      return;
    }
    
    // Check if user has access to this feature
    if (option.requiredFeature && !hasFeatureAccess(userPlan, option.requiredFeature)) {
      handleRestrictedFeature(option.requiredFeature, option);
      return;
    }
    
    // For all other cases, allow normal functionality
    if (IS_DESKTOP) {
      setSelectedOption(option.id);
      setShowForm(true);
      resetForm();
    } else {
      navigation.navigate(option.action);
    }
  };

  // Toggle team selection
  const toggleTeamSelection = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    } else {
      setSelectedTeams(prev => [...prev, teamId]);
    }
  };

  // File upload handlers
  const pickFiles = async () => {
    if (!DocumentPicker) {
      addDemoFiles();
      return;
    }

    try {
      const types = selectedOption === 'upload-manuals' 
        ? ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown']
        : '*/*';

      const result = await DocumentPicker.getDocumentAsync({
        type: types,
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
        }));
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick files: ' + error.message);
    }
  };

  const pickImages = async () => {
    if (!ImagePicker) {
      addDemoImages();
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset, index) => ({
          id: Date.now() + index,
          uri: asset.uri,
          name: `image_${Date.now()}_${index}.jpg`,
          size: asset.fileSize || Math.floor(Math.random() * 1000000) + 100000,
        }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images: ' + error.message);
    }
  };

  const takePhoto = async () => {
    if (!ImagePicker) return;

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') return;

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const newImage = {
          id: Date.now(),
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          size: asset.fileSize || Math.floor(Math.random() * 1000000) + 100000,
        };
        setSelectedImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo: ' + error.message);
    }
  };

  const addDemoFiles = () => {
    const demoFiles = [
      {
        id: Date.now() + 1,
        name: selectedOption === 'upload-manuals' ? 'User_Manual_v2.1.pdf' : 'Project_Report.pdf',
        size: 2456789,
        type: 'application/pdf',
        uri: 'demo://file.pdf',
      }
    ];
    setSelectedFiles(prev => [...prev, ...demoFiles]);
  };

  const addDemoImages = () => {
    const demoImage = {
      id: Date.now(),
      uri: `https://picsum.photos/400/300?random=${Date.now()}`,
      name: `demo_image_${Date.now()}.jpg`,
      size: Math.floor(Math.random() * 1000000) + 100000,
    };
    setSelectedImages(prev => [...prev, demoImage]);
  };

  // Handle file input change on web
  const handleFileSelection = (event, optionId) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      const newFiles = files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
      }));
      
      if (optionId === 'upload-photo') {
        setSelectedImages(prev => [...prev, ...newFiles]);
      } else {
        setSelectedFiles(prev => [...prev, ...newFiles]);
      }
    }
    event.target.value = '';
  };

  // Remove files/images
  const removeFile = (fileId) => {
    setSelectedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const removeImage = (imageId) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // UPDATED: Enhanced save handler with proper scoring integration
  const handleSave = async () => {
    if (!IS_DESKTOP) {
      console.log('🚀 Save button clicked!');
      console.log('📋 Form data:', {
        title: title.trim(),
        selectedOption,
        tipContent: tipContent.trim(),
        selectedImages: selectedImages.length,
        selectedFiles: selectedFiles.length,
        addToCommunity,
        isPublic,
        selectedTeams: selectedTeams.length
      });
    }

    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }

    if (selectedOption === 'write-tips' && !tipContent.trim()) {
      Alert.alert('Error', 'Please enter content for your tip.');
      return;
    }

    if (selectedOption === 'upload-photo' && selectedImages.length === 0) {
      Alert.alert('Error', 'Please select at least one image.');
      return;
    }

    if ((selectedOption === 'upload-manuals' || selectedOption === 'upload-file') && selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select at least one file.');
      return;
    }

    if (!addToCommunity && !isPublic && selectedTeams.length === 0) {
      Alert.alert('Error', 'Please add to community, make content public in organization, or select at least one team.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // UPDATED: Get source position for animation
      let sourcePosition;
      
      if (Platform.OS === 'web') {
        sourcePosition = getSaveButtonPosition();
      } else {
        // For mobile, use Promise-based position
        try {
          sourcePosition = await getSaveButtonPosition();
        } catch (error) {
          // Fallback position for mobile
          sourcePosition = IS_DESKTOP 
            ? { x: SCREEN_WIDTH - 150, y: 80 } 
            : { x: SCREEN_WIDTH - 100, y: 80 };
        }
      }
      
      // UPDATED: Trigger scoring animation for Upload to Brain (+3 points)
      if (awardPoints) {
        console.log('🎯 Triggering UPLOAD_BRAIN scoring animation');
        console.log('🎯 Source position:', sourcePosition);
        console.log('🎯 Target position:', getScoringTargetPosition());
        
        awardPoints(ANIMATION_TYPES.UPLOAD_BRAIN, sourcePosition);
      } else {
        console.warn('⚠️ awardPoints function not available');
      }
      
      // Reset form immediately after successful save
      resetForm();
      
      // Show success message after form is reset
      Alert.alert(
        'Success! 🎉', 
        'Your content has been saved to your Brain successfully! You earned 3 points! The form has been cleared for your next entry.',
        [
          { 
            text: 'Add More Content', 
            style: 'default',
            onPress: () => {
              if (!IS_DESKTOP) {
                console.log('🔄 User selected "Add More" - form already reset');
              }
              if (IS_DESKTOP) {
                setShowForm(false);
              }
            }
          },
          { 
            text: 'Done', 
            style: 'cancel',
            onPress: () => {
              if (!IS_DESKTOP) {
                console.log('✅ User selected "Done" - form already reset');
              }
              if (IS_DESKTOP) {
                setShowForm(false);
              }
            }
          }
        ]
      );
      
    } catch (error) {
      if (!IS_DESKTOP) {
        console.error('❌ Save error:', error);
      }
      Alert.alert('Error', 'Failed to save content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (type, name) => {
    if (type?.startsWith('image/') || name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return { icon: Camera, color: '#666666' };
    }
    if (type?.includes('pdf') || name?.endsWith('.pdf')) {
      return { icon: FileText, color: '#666666' };
    }
    return { icon: File, color: '#666666' };
  };

  // Render form content based on selected option
  const renderFormContent = () => {
    const option = BRAIN_OPTIONS.find(opt => opt.id === selectedOption);
    if (!option) return null;

    const IconComponent = option.icon;
    
    const canSave = title.trim() && 
      (selectedOption === 'write-tips' ? tipContent.trim() : 
       selectedOption === 'upload-photo' ? selectedImages.length > 0 :
       selectedFiles.length > 0) && 
      (addToCommunity || isPublic || selectedTeams.length > 0);

    return (
      <View style={styles.formContainer}>
        {/* Form Header */}
        <View style={styles.formHeader}>
          <View style={styles.formHeaderLeft}>
            <View style={styles.formHeaderIcon}>
              <IconComponent size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.formHeaderTitle}>{option.title}</Text>
          </View>
          <View style={styles.formHeaderActions}>
            <TouchableOpacity
              style={styles.formCancelButton}
              onPress={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              <X size={18} color="#666666" />
              <Text style={styles.formCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              ref={saveButtonRef}
              style={[styles.formSaveButton, (!canSave || isLoading) && styles.formSaveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSave || isLoading}
            >
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.formSaveText}>
                {isLoading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Form Body */}
        <ScrollView 
          style={styles.formBody} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          onScrollBeginDrag={() => setShowSharingTooltip(false)}
          onPress={() => setShowSharingTooltip(false)}
        >
          {/* Common Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder={`Give your ${option.title.toLowerCase()} a descriptive title...`}
                value={title}
                onChangeText={setTitle}
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a description (optional)..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Tips Content */}
            {selectedOption === 'write-tips' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Tip or Trick *</Text>
                <TextInput
                  style={styles.contentInput}
                  placeholder="Share your knowledge, insights, best practices..."
                  value={tipContent}
                  onChangeText={setTipContent}
                  multiline
                  numberOfLines={10}
                  textAlignVertical="top"
                  maxLength={2000}
                />
                <Text style={styles.charCount}>{tipContent.length}/2000</Text>
              </View>
            )}

            {/* Brain Sharing Options */}
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

          {/* File/Image Upload Sections */}
          {selectedOption === 'upload-photo' && (
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>Images</Text>
              
              <View style={styles.uploadActions}>
                <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                  <Camera size={20} color="#000000" />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadButton} onPress={pickImages}>
                  <Plus size={20} color="#000000" />
                  <Text style={styles.uploadButtonText}>Choose Images</Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => fileInputRefs['upload-photo']?.current?.click()}
                  >
                    <Upload size={20} color="#000000" />
                    <Text style={styles.uploadButtonText}>Browse Files</Text>
                  </TouchableOpacity>
                )}
              </View>

              {selectedImages.length > 0 && (
                <View style={styles.selectedContent}>
                  <View style={styles.selectedHeader}>
                    <Text style={styles.selectedTitle}>Selected Images ({selectedImages.length})</Text>
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
                          <Trash2 size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                        <View style={styles.imageInfo}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {image.name}
                          </Text>
                          <Text style={styles.fileSize}>
                            {formatFileSize(image.size)}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {(selectedOption === 'upload-manuals' || selectedOption === 'upload-file') && (
            <View style={styles.uploadSection}>
              <Text style={styles.sectionTitle}>
                {selectedOption === 'upload-manuals' ? 'Manual Files' : 'Documents'}
              </Text>
              
              <View style={styles.uploadActions}>
                <TouchableOpacity style={styles.uploadButton} onPress={pickFiles}>
                  <Plus size={20} color="#000000" />
                  <Text style={styles.uploadButtonText}>Select Files</Text>
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => fileInputRefs[selectedOption]?.current?.click()}
                  >
                    <Upload size={20} color="#000000" />
                    <Text style={styles.uploadButtonText}>Browse Files</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.supportedTypes}>
                {selectedOption === 'upload-manuals' 
                  ? 'Supported: PDF, DOC, DOCX, TXT, MD'
                  : 'All file types supported'
                }
              </Text>

              {selectedFiles.length > 0 && (
                <View style={styles.selectedContent}>
                  <View style={styles.selectedHeader}>
                    <Text style={styles.selectedTitle}>Selected Files ({selectedFiles.length})</Text>
                    <TouchableOpacity onPress={() => setSelectedFiles([])}>
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <FlatList
                    data={selectedFiles}
                    keyExtractor={item => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => {
                      const { icon: IconComponent, color } = getFileIcon(item.type, item.name);
                      return (
                        <View style={styles.fileItem}>
                          <View style={styles.fileIcon}>
                            <IconComponent size={20} color={color} />
                          </View>
                          <View style={styles.fileDetails}>
                            <Text style={styles.fileName}>{item.name}</Text>
                            <Text style={styles.fileSize}>{formatFileSize(item.size)}</Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.removeFileButton}
                            onPress={() => removeFile(item.id)}
                          >
                            <Trash2 size={16} color="#DC2626" />
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                  />
                </View>
              )}
            </View>
          )}

          {/* Content Tips Box */}
          <View style={styles.tipsBox}>
            <View style={styles.tipsHeader}>
              <AlertCircle size={16} color="#666666" />
              <Text style={styles.tipsTitle}>Content Tips</Text>
            </View>
            <Text style={styles.tipsText}>
              {selectedOption === 'write-tips' && 
                '• Be specific and actionable\n• Include step-by-step instructions\n• Mention prerequisites\n• Add warnings for pitfalls\n• Use clear, simple language'}
              {selectedOption === 'upload-photo' && 
                '• Use clear, high-resolution images\n• Include diagrams and technical drawings\n• Capture from multiple angles\n• Take screenshots of important screens'}
              {selectedOption === 'upload-manuals' && 
                '• Use descriptive filenames\n• Ensure documents are text-searchable\n• Include version numbers\n• Organize by equipment or topic'}
              {selectedOption === 'upload-file' && 
                '• Use descriptive filenames\n• Keep file sizes reasonable\n• Organize by project or topic\n• Remove sensitive information'}
            </Text>
          </View>
        </ScrollView>

        {/* Hidden web inputs */}
        {Platform.OS === 'web' && (
          <View style={styles.hiddenInputs}>
            <input
              ref={fileInputRefs['upload-photo']}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelection(e, 'upload-photo')}
            />
            <input
              ref={fileInputRefs['upload-manuals']}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.md"
              multiple
              onChange={(e) => handleFileSelection(e, 'upload-manuals')}
            />
            <input
              ref={fileInputRefs['upload-file']}
              type="file"
              multiple
              onChange={(e) => handleFileSelection(e, 'upload-file')}
            />
          </View>
        )}
      </View>
    );
  };

  // Render locked option card
  const renderLockedOptionCard = (option) => {
    const IconComponent = option.icon;
    const planInfo = PLAN_INFO[option.requiredPlan];
    
    return (
      <PlanLockedFeature
        key={option.id}
        feature={option.requiredFeature}
        userPlan={userPlan}
        onUpgrade={handleUpgradeAction}
        lockStyle="overlay"
        style={styles.lockedOptionCard}
      >
        <View style={styles.mobileOptionCard}>
          <View style={styles.mobileOptionLeft}>
            <View style={styles.mobileOptionIcon}>
              <IconComponent size={20} color="#FFFFFF" />
            </View>
            <View style={styles.mobileOptionContent}>
              <Text style={styles.mobileOptionTitle}>{option.title}</Text>
              <Text style={styles.mobileOptionDescription}>
                {option.description}
              </Text>
              <Text style={styles.mobileOptionDetails}>
                {option.details}
              </Text>
              <View style={styles.planRequirement}>
                <Crown size={12} color="#EF4444" />
                <Text style={styles.planRequirementText}>
                  Requires {planInfo.displayName}
                </Text>
              </View>
            </View>
          </View>
          <ChevronRight size={20} color="#000000" />
        </View>
      </PlanLockedFeature>
    );
  };

  // Renders the desktop main area
  const renderDesktopContent = () => {
    if (showForm) {
      return renderFormContent();
    }

    const option = BRAIN_OPTIONS.find((opt) => opt.id === selectedOption);
    if (!option) return null;
    const IconComponent = option.icon;

    // Check if user has access to this option
    const hasAccess = !option.requiredFeature || hasFeatureAccess(userPlan, option.requiredFeature);

    return (
      <View style={styles.desktopContent}>
        {/* Header */}
        <View style={styles.contentHeader}>
          <View style={styles.contentIconContainer}>
            <IconComponent size={24} color="#FFFFFF" />
          </View>
          <View style={styles.contentHeaderText}>
            <Text style={styles.contentTitle}>{option.title}</Text>
            <Text style={styles.contentDescription}>{option.description}</Text>
            {userPlan === 'free' && option.id !== 'write-tips' && (
              <View style={styles.freeUserNotice}>
                <Text style={styles.freeUserNoticeText}>
                  Free Plan: {uploadAccess.uploadLimit} uploads/month • Community sharing only
                </Text>
              </View>
            )}
            {!hasAccess && (
              <View style={styles.planRequirement}>
                <Crown size={14} color="#EF4444" />
                <Text style={styles.planRequirementText}>
                  Requires {PLAN_INFO[option.requiredPlan].displayName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Body */}
        <View style={styles.contentBody}>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 24 },
            ]}
          >
            {/* Main Action Area */}
            {hasAccess ? (
              <View style={styles.actionArea}>
                <View style={styles.actionIcon}>
                  <IconComponent size={32} color="#FFFFFF" />
                </View>

                <Text style={styles.actionTitle}>Ready to contribute?</Text>
                <Text style={styles.actionSubtitle}>
                  {option.details} Content will be added directly to your personal Brain.
                </Text>

                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={() => handleOptionSelect(option)}
                >
                  <IconComponent size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionText}>
                    {option.title}
                  </Text>
                  <ChevronRight size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <PlanLockedFeature
                feature={option.requiredFeature}
                userPlan={userPlan}
                onUpgrade={handleUpgradeAction}
                lockStyle="overlay"
              >
                <View style={[styles.actionArea, styles.lockedActionArea]}>
                  <View style={styles.actionIcon}>
                    <IconComponent size={32} color="#FFFFFF" />
                  </View>

                  <Text style={styles.actionTitle}>Ready to contribute?</Text>
                  <Text style={styles.actionSubtitle}>
                    {option.details} Content will be added directly to your personal Brain.
                  </Text>

                  <TouchableOpacity
                    style={[styles.primaryActionButton, styles.lockedActionButton]}
                    onPress={() => handleOptionSelect(option)}
                  >
                    <IconComponent size={18} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>
                      {option.title}
                    </Text>
                    <ChevronRight size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </PlanLockedFeature>
            )}

            {/* Info & Examples Sections */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoBox}>
                  <View style={styles.infoHeader}>
                    <AlertCircle size={18} color="#2563EB" />
                    <Text style={styles.infoTitle}>What you can add</Text>
                  </View>
                  <Text style={styles.infoText}>
                    {option.examples.map((example, index) => 
                      `• ${example}${index < option.examples.length - 1 ? '\n' : ''}`
                    )}
                  </Text>
                </View>

                <View style={styles.tipBox}>
                  <View style={styles.tipHeader}>
                    <UserCheck size={18} color="#666666" />
                    <Text style={styles.tipTitle}>Direct Upload</Text>
                  </View>
                  <Text style={styles.tipText}>
                    Your content will be added directly to your personal Brain storage. You can organize, search, and access it instantly once uploaded.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // Mobile interface
  const renderMobileContent = () => (
    <ScrollView
      style={styles.mobileOptionsContainer}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
    >
      {BRAIN_OPTIONS.map((option) => {
        const IconComponent = option.icon;
        const hasAccess = !option.requiredFeature || hasFeatureAccess(userPlan, option.requiredFeature);
        
        if (!hasAccess) {
          return renderLockedOptionCard(option);
        }

        return (
          <TouchableOpacity
            key={option.id}
            style={styles.mobileOptionCard}
            onPress={() => handleOptionSelect(option)}
          >
            <View style={styles.mobileOptionLeft}>
              <View style={styles.mobileOptionIcon}>
                <IconComponent size={20} color="#FFFFFF" />
              </View>
              <View style={styles.mobileOptionContent}>
                <Text style={styles.mobileOptionTitle}>{option.title}</Text>
                <Text style={styles.mobileOptionDescription}>
                  {option.description}
                </Text>
                <Text style={styles.mobileOptionDetails}>
                  {option.details}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#000000" />
          </TouchableOpacity>
        );
      })}

      {/* Info Section for Mobile */}
      <View style={styles.mobileInfoSection}>
        <View style={styles.mobileInfoBox}>
          <View style={styles.infoHeader}>
            <Brain size={18} color="#2563EB" />
            <Text style={styles.infoTitle}>Building Your Knowledge Base</Text>
          </View>
          <Text style={styles.infoText}>
            Add different types of content to create a comprehensive knowledge base that your team can search through and reference. Content is added directly to your personal Brain storage for instant access.
          </Text>
        </View>

      {/* Plan Status Box */}
      <View style={styles.planStatusBox}>
        <View style={styles.planStatusHeader}>
          <Text style={styles.planStatusIcon}>{planInfo.icon}</Text>
          <Text style={styles.planStatusTitle}>Current Plan: {planInfo.displayName}</Text>
        </View>
        
        {userPlan === 'free' && (
          <View style={styles.freeUserInfo}>
            <Text style={styles.freeUserText}>
              • All uploads go to Community automatically{'\n'}
              • {uploadAccess.uploadLimit} uploads per month limit{'\n'}
              • Upgrade to Solo for private storage & 100 pages/month
            </Text>
            <TouchableOpacity
              style={styles.upgradePromptButton}
              onPress={() => handleUpgradeAction('solo')}
            >
              <Crown size={14} color="#FFFFFF" />
              <Text style={styles.upgradePromptButtonText}>Upgrade to Solo</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {userPlan === 'solo' && (
          <View style={styles.upgradePromptBox}>
            <Text style={styles.upgradePromptText}>
              Upgrade to Team to unlock Location Mode, organization sharing, team access controls, and unlimited uploads.
            </Text>
            <TouchableOpacity
              style={styles.upgradePromptButton}
              onPress={() => handleUpgradeAction('team')}
            >
              <Crown size={14} color="#FFFFFF" />
              <Text style={styles.upgradePromptButtonText}>Upgrade to Team</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </View>
    </ScrollView>
  );

  // Show loading screen if plan is loading
  if (planLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!IS_DESKTOP) {
    return (
      <SafeAreaView style={styles.container}>
        {/* UPDATED: Scoring Animation Overlay with proper positioning */}
        <ScoringOverlay 
          isVisible={true}
          style={styles.scoringOverlay}
        />
        
        <View style={styles.mobileHeader}>
          <View style={styles.mobileHeaderIcon}>
            <Brain size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.mobileHeaderTitle}>Add to Brain</Text>
        </View>
        <View style={styles.mobileMainContainer}>
          {renderMobileContent()}
        </View>
        
        {/* New User Popup */}
        <NewUserBrainPopup
          visible={showNewUserPopup}
          onClose={handlePopupClose}
          onBrainRequested={handleBrainRequested}
          userInfo={userInfo}
          hasAlreadyRequested={brainRequestStatus === 'requested'}
        />

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

  return (
    <SafeAreaView style={styles.container}>
      {/* UPDATED: Scoring Animation Overlay with proper positioning */}
      <ScoringOverlay 
        isVisible={true}
        style={styles.scoringOverlay}
      />
      
      <KeyboardAvoidingView 
        style={styles.desktopLayout} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Sidebar */}
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarHeaderIcon}>
              <Brain size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sidebarTitle}>Add to Brain</Text>
          </View>
          <View style={styles.sidebarContent}>
            <Text style={styles.sidebarSubtitle}>
              Choose the type of content you want to add to your knowledge base
            </Text>
            
            {/* Plan Status in Sidebar */}
            <View style={styles.sidebarPlanStatus}>
              <Text style={styles.sidebarPlanIcon}>{planInfo.icon}</Text>
              <Text style={styles.sidebarPlanText}>{planInfo.displayName}</Text>
              {userPlan === 'free' && (
                <Text style={styles.sidebarUploadLimit}>
                  {uploadAccess.uploadLimit} uploads/month
                </Text>
              )}
            </View>
            
            {BRAIN_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              const isSelected = selectedOption === option.id;
              const hasAccess = !option.requiredFeature || hasFeatureAccess(userPlan, option.requiredFeature);
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sidebarOption,
                    isSelected && styles.sidebarOptionSelected,
                    !hasAccess && styles.sidebarOptionLocked,
                  ]}
                  onPress={() => setSelectedOption(option.id)}
                >
                  <View style={styles.sidebarOptionLeft}>
                    <View
                      style={[
                        styles.sidebarOptionIcon,
                        isSelected && styles.sidebarOptionIconSelected,
                        !hasAccess && styles.sidebarOptionIconLocked,
                      ]}
                    >
                      <IconComponent
                        size={18}
                        color={isSelected ? '#FFFFFF' : !hasAccess ? '#9CA3AF' : '#666666'}
                      />
                      {!hasAccess && (
                        <View style={styles.sidebarLockBadge}>
                          <Lock size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </View>
                    <View style={styles.sidebarOptionText}>
                      <Text
                        style={[
                          styles.sidebarOptionTitle,
                          isSelected && styles.sidebarOptionTitleSelected,
                          !hasAccess && styles.sidebarOptionTitleLocked,
                        ]}
                      >
                        {option.title}
                      </Text>
                      <Text
                        style={[
                          styles.sidebarOptionDesc,
                          isSelected && styles.sidebarOptionDescSelected,
                          !hasAccess && styles.sidebarOptionDescLocked,
                        ]}
                      >
                        {option.description}
                      </Text>
                      {!hasAccess && (
                        <Text style={styles.sidebarUpgradeText}>
                          Requires {PLAN_INFO[option.requiredPlan].displayName}
                        </Text>
                      )}
                    </View>
                  </View>
                  <ChevronRight
                    size={16}
                    color={isSelected ? '#FFFFFF' : !hasAccess ? '#9CA3AF' : '#CCCCCC'}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {renderDesktopContent()}
        </View>
      </KeyboardAvoidingView>
      
      {/* New User Popup */}
      <NewUserBrainPopup
        visible={showNewUserPopup}
        onClose={handlePopupClose}
        onBrainRequested={handleBrainRequested}
        userInfo={userInfo}
        hasAlreadyRequested={brainRequestStatus === 'requested'}
      />

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
    backgroundColor: '#FAFAFA',
  },

  // UPDATED: Scoring overlay positioning
  scoringOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'none',
  },

  // Loading screen
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

  // Mobile Header
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  mobileHeaderIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  mobileHeaderTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },

  // Desktop Layout
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sidebarHeaderIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  sidebarContent: {
    padding: 20,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  sidebarPlanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  sidebarPlanIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  sidebarPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
  },
  sidebarUploadLimit: {
    fontSize: 10,
    color: '#15803D',
    marginTop: 2,
  },
  sidebarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  sidebarOptionSelected: {
    backgroundColor: '#000000',
  },
  sidebarOptionLocked: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  sidebarOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sidebarOptionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    position: 'relative',
  },
  sidebarOptionIconSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sidebarOptionIconLocked: {
    backgroundColor: '#F3F4F6',
  },
  sidebarLockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarOptionText: {
    flex: 1,
  },
  sidebarOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  sidebarOptionTitleSelected: {
    color: '#FFFFFF',
  },
  sidebarOptionTitleLocked: {
    color: '#9CA3AF',
  },
  sidebarOptionDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  sidebarOptionDescSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sidebarOptionDescLocked: {
    color: '#9CA3AF',
  },
  sidebarUpgradeText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },

  // Desktop Content
  mainContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  desktopContent: {
    flex: 1,
    padding: 32,
  },
  contentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  contentIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contentHeaderText: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
    lineHeight: 22,
  },
  planRequirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  planRequirementText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  freeUserNotice: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  freeUserNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '500',
  },
  contentBody: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  actionArea: {
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    borderStyle: 'dashed',
  },
  lockedActionArea: {
    opacity: 0.6,
  },
  actionIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#000000',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  actionSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    maxWidth: 400,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  lockedActionButton: {
    opacity: 0.5,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Info Sections
  infoSection: {},
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoBox: {
    flex: 1,
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
    flex: 1,
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

  // Form Container
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formHeaderIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  formHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  formHeaderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  formCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  formCancelText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  formSaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  formSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  formSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  formBody: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },
  formSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
    zIndex: 1,
    overflow: 'visible',
  },

  // Form Inputs
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
  contentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 200,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },

  // Upload Sections
  uploadSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  supportedTypes: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 16,
  },

  // Selected Content
  selectedContent: {
    marginTop: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Image Grid
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    width: 150,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  imagePreview: {
    width: '100%',
    height: 100,
    backgroundColor: '#F3F4F6',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    backgroundColor: '#DC2626',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageInfo: {
    padding: 8,
  },

  // File List
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  fileIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    color: '#666666',
  },
  removeFileButton: {
    padding: 8,
  },

  // Tips Box
  tipsBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginLeft: 6,
  },
  tipsText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },

  // Mobile Layout
  mobileMainContainer: { 
    flex: 1, 
    backgroundColor: '#FAFAFA' 
  },
  mobileOptionsContainer: {
    flex: 1,
    padding: 20,
  },
  mobileOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedOptionCard: {
    position: 'relative',
  },
  mobileOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileOptionIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mobileOptionContent: {
    flex: 1,
  },
  mobileOptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  mobileOptionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 18,
  },
  mobileOptionDetails: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 17,
  },

  // Mobile Info Section
  mobileInfoSection: {
    marginTop: 8,
  },
  mobileInfoBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  planStatusBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  planStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planStatusIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  planStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  freeUserInfo: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
  },
  freeUserText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    marginBottom: 8,
  },
  upgradePromptBox: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    padding: 12,
  },
  upgradePromptText: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
    marginBottom: 8,
  },
  upgradePromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  upgradePromptButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },

  // Hidden inputs for web
  hiddenInputs: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
});
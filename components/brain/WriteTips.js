// components/brain/WriteTips.js

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Lightbulb, 
  Save, 
  X, 
  AlertCircle,
  Crown,
} from 'lucide-react-native';

// Import plan access control components
import {
  PLAN_INFO,
} from '../../frontend/utils/planAccessManager';
import UpgradePrompt from '../UpgradePrompt';
import BrainSharingOptions from './BrainSharingOptions';

export default function WriteTips({ 
  navigation, 
  userPlan: propUserPlan, 
  onUpgrade, 
  userInfo = null 
}) {
  const insets = useSafeAreaInsets();
  const [tipContent, setTipContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setSaveLoading] = useState(false);

  // User plan state - load from storage if not provided as prop
  const [userPlan, setUserPlan] = useState(propUserPlan || 'free');
  const [planLoading, setPlanLoading] = useState(!propUserPlan);
  
  // Upgrade prompt state (kept for potential future use)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Form fields for access control
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

  // Load user plan from storage if not provided as prop
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!propUserPlan) {
        try {
          setPlanLoading(true);
          const storedPlan = await AsyncStorage.getItem('userPlan');
          const finalPlan = storedPlan || 'free';
          setUserPlan(finalPlan);
          console.log('💡 WriteTips: Loaded user plan from storage:', finalPlan);
        } catch (error) {
          console.error('💡 WriteTips: Error loading user plan:', error);
          setUserPlan('free');
        } finally {
          setPlanLoading(false);
        }
      } else {
        setUserPlan(propUserPlan);
        setPlanLoading(false);
        console.log('💡 WriteTips: Using prop user plan:', propUserPlan);
      }
    };
    
    loadUserPlan();
  }, [propUserPlan]);

  // Writing tips are available to all plans - no access check needed
  // useEffect(() => {
  //   // WriteTips is available to all plans including free
  // }, [userPlan, planLoading]);

  // Handle upgrade action (used by BrainSharingOptions component)
  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradePrompt(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    } else {
      // Fallback navigation or action
      Alert.alert('Upgrade', `Please upgrade to ${PLAN_INFO[targetPlan].displayName} plan for additional features.`);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !tipContent.trim()) {
      Alert.alert('Error', 'Please enter both a title and content for your tip.');
      return;
    }

    if (!addToCommunity && !isPublic && selectedTeams.length === 0) {
      Alert.alert('Sharing Required', 'Please add to community, make content public in organization, or select at least one team.');
      return;
    }

    setSaveLoading(true);
    
    try {
      // Simulate save process
      await new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1500);
      });
      
      // Reset form after successful save
      const resetForm = () => {
        setTitle('');
        setTipContent('');
        setSelectedTeams([]);
        setIsPublic(false);
        setAddToCommunity(true);
        setShowSharingTooltip(false);
      };
      
      Alert.alert(
        'Success! 🎉', 
        'Your tip has been saved to your Brain successfully!',
        [
          { 
            text: 'Add Another Tip', 
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
      Alert.alert('Error', 'Failed to save tip. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || tipContent.trim()) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved changes. Are you sure you want to go back?',
        [
          { text: 'Keep Writing', style: 'cancel' },
          { text: 'Discard', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const canSave = title.trim() && tipContent.trim() && (addToCommunity || isPublic || selectedTeams.length > 0);

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
          <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
            <X size={24} color="#666666" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.headerIcon}>
              <Lightbulb size={20} color="#FFFFFF" />
            </View>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Write Tips</Text>
              {/* Plan indicator */}
              <View style={styles.planIndicator}>
                <Text style={styles.planIcon}>{planInfo.icon}</Text>
                <Text style={styles.planText}>{planInfo.displayName}</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={[styles.saveButton, (!canSave || isLoading) && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={!canSave || isLoading}
          >
            <Save size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: Math.max(insets.bottom + 40, 40),
            flexGrow: 1
          }}
          onScrollBeginDrag={() => setShowSharingTooltip(false)}
        >
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.titleInput}
                placeholder="Give your tip a descriptive title..."
                value={title}
                onChangeText={setTitle}
                maxLength={100}
                returnKeyType="next"
                blurOnSubmit={false}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Tip or Trick *</Text>
              <TextInput
                style={styles.contentInput}
                placeholder="Share your knowledge, insights, best practices, shortcuts, or any helpful information here...

Examples:
• How to troubleshoot common issues
• Step-by-step procedures
• Time-saving shortcuts
• Important safety reminders
• Configuration tips"
                value={tipContent}
                onChangeText={setTipContent}
                multiline
                numberOfLines={15}
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.charCount}>{tipContent.length}/2000</Text>
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
            />

            {/* Tips are typically unlimited for all plans, but show info if user is on free plan */}
            {userPlan === 'free' && (
              <View style={styles.freeUserInfo}>
                <View style={styles.freeUserHeader}>
                  <AlertCircle size={16} color="#2563EB" />
                  <Text style={styles.freeUserTitle}>Free Plan Benefits</Text>
                </View>
                <Text style={styles.freeUserText}>
                  ✅ Unlimited tips and knowledge sharing{'\n'}
                  ✅ Community sharing at zero cost{'\n'}
                  💡 Upgrade to Solo for private storage options
                </Text>
                <TouchableOpacity
                  style={styles.upgradeButtonSmall}
                  onPress={() => handleUpgradeAction('solo')}
                >
                  <Crown size={14} color="#FFFFFF" />
                  <Text style={styles.upgradeButtonText}>Upgrade to Solo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Writing Tips Box */}
            <View style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <Lightbulb size={16} color="#059669" />
                <Text style={styles.tipsTitle}>Writing Tips</Text>
              </View>
              <Text style={styles.tipsText}>
                • Be specific and actionable{'\n'}
                • Include step-by-step instructions when helpful{'\n'}
                • Mention any prerequisites or requirements{'\n'}
                • Add warnings for potential pitfalls{'\n'}
                • Use clear, simple language
              </Text>
            </View>

            {/* Plan Benefits Box */}
            <View style={styles.tipsBox}>
              <View style={styles.tipsHeader}>
                <Lightbulb size={16} color="#10B981" />
                <Text style={styles.tipsTitle}>Plan Benefits</Text>
              </View>
              <Text style={styles.tipsText}>
                {userPlan === 'free' && '• Free: Unlimited tips, community sharing only\n• Solo: Private storage and organization sharing\n• Team: Team access controls and advanced features'}
                {userPlan === 'solo' && '• Solo: Unlimited tips with private storage\n• Team: Organization sharing and team access\n• Enterprise: Advanced security & analytics'}
                {(userPlan === 'team' || userPlan === 'enterprise') && '• Unlimited tips and knowledge sharing\n• Organization and team sharing\n• Advanced access controls\n• Priority support'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Upgrade Prompt - typically not needed for tips but kept for consistency */}
      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        onUpgrade={handleUpgradeAction}
        currentPlan={userPlan}
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
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
  contentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 300,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  freeUserInfo: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  freeUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  freeUserTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginLeft: 6,
  },
  freeUserText: {
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
    marginBottom: 12,
  },
  upgradeButtonSmall: {
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
  tipsBox: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
});
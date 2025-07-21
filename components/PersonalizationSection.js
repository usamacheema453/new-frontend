// components/PersonalizationSection.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActionSheetIOS,
  Modal,
  Switch,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {
  Camera,
  User,
  Briefcase,
  Globe,
  MessageCircle,
  Palette,
  ChevronDown,
  X,
  Check,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react-native';
import AvatarSelector, { AVATAR_OPTIONS, getAvatarById } from '../components/AvatarSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

// Default settings values
const DEFAULT_SETTINGS = {
  speLevel: 'intermediate',
  speTone: 'professional',
};

function SettingField({ icon, title, description, children, readonly = false }) {
  return (
    <View style={[styles.settingField, readonly && styles.settingFieldReadonly]}>
      <View style={styles.fieldHeader}>
        <View style={[styles.fieldIcon, readonly && styles.fieldIconReadonly]}>
          {icon}
        </View>
        <View style={styles.fieldLabels}>
          <Text style={[styles.fieldTitle, readonly && styles.fieldTitleReadonly]}>
            {title}
          </Text>
          {description && (
            <Text style={styles.fieldDescription}>{description}</Text>
          )}
        </View>
        <View style={styles.fieldControl}>
          {children}
        </View>
      </View>
    </View>
  );
}

function Select({ value, options, onChange, placeholder = "Select an option" }) {
  const label = options.find(o => o.v === value)?.l || placeholder;
  const [open, setOpen] = useState(false);

  const showIOS = () =>
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: options.map(o => o.l).concat('Cancel'),
        cancelButtonIndex: options.length,
        title: placeholder,
      },
      idx => idx < options.length && onChange(options[idx].v),
    );

  const toggleDropdown = () => {
    if (Platform.OS === 'ios') {
      showIOS();
    } else {
      setOpen(!open);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.selectButton}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !options.find(o => o.v === value) && styles.selectPlaceholder]}>
          {label}
        </Text>
        <ChevronDown size={18} color="#666666" />
      </TouchableOpacity>
      
      {Platform.OS === 'android' && (
        <Modal
          visible={open}
          transparent
          animationType="fade"
          onRequestClose={() => setOpen(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            onPress={() => setOpen(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{placeholder}</Text>
                <TouchableOpacity onPress={() => setOpen(false)}>
                  <X size={20} color="#666666" />
                </TouchableOpacity>
              </View>
              {options.map(option => (
                <TouchableOpacity
                  key={option.v}
                  style={[
                    styles.modalOption,
                    value === option.v && styles.modalOptionSelected
                  ]}
                  onPress={() => {
                    onChange(option.v);
                    setOpen(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    value === option.v && styles.modalOptionTextSelected
                  ]}>
                    {option.l}
                  </Text>
                  {value === option.v && (
                    <Check size={16} color="#000000" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

// Mobile Avatar Selector Component
const MobileAvatarSelector = ({ selectedAvatar, onPress }) => {
  const currentAvatar = getAvatarById(selectedAvatar);
  
  return (
    <TouchableOpacity style={styles.mobileAvatarSelector} onPress={onPress}>
      <View style={styles.mobileAvatarDisplay}>
        <View style={[styles.mobileAvatarCircle, { borderColor: currentAvatar.color }]}>
          <Image
            source={currentAvatar.image}
            style={styles.mobileAvatarImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.mobileAvatarInfo}>
          <Text style={styles.mobileAvatarName}>{currentAvatar.name}</Text>
          <Text style={styles.mobileAvatarSubtext}>Tap to change</Text>
        </View>
      </View>
      <ChevronRight size={18} color="#CCCCCC" />
    </TouchableOpacity>
  );
};

// Mobile Avatar Modal Component
const MobileAvatarModal = ({ visible, onClose, selectedAvatar, onSelect }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.avatarModalOverlay}>
        <View style={styles.avatarModalContent}>
          <View style={styles.avatarModalHeader}>
            <Text style={styles.avatarModalTitle}>Choose Your Engineer</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color="#666666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.avatarModalBody} showsVerticalScrollIndicator={false}>
            {AVATAR_OPTIONS.map(avatar => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  selectedAvatar === avatar.id && styles.avatarOptionSelected
                ]}
                onPress={() => onSelect(avatar.id)}
              >
                <View style={[styles.avatarOptionCircle, { borderColor: avatar.color }]}>
                  <Image
                    source={avatar.image}
                    style={styles.avatarOptionImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.avatarOptionInfo}>
                  <Text style={[
                    styles.avatarOptionName,
                    selectedAvatar === avatar.id && styles.avatarOptionNameSelected
                  ]}>
                    {avatar.name}
                  </Text>
                  <Text style={styles.avatarOptionDesc}>Super Engineer Persona</Text>
                </View>
                {selectedAvatar === avatar.id && (
                  <View style={[styles.avatarOptionCheck, { backgroundColor: avatar.color }]}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// Toggle Options Component for Desktop
function ToggleOptions({ value, options, onChange, title, description }) {
  console.log(`Desktop ToggleOptions - ${title}:`, value);
  
  return (
    <View style={styles.toggleSection}>
      <View style={styles.toggleHeader}>
        <View style={styles.fieldIcon}>
          <MessageCircle size={20} color="#000000" />
        </View>
        <View style={styles.fieldLabels}>
          <Text style={styles.fieldTitle}>{title}</Text>
          <Text style={styles.fieldDescription}>{description}</Text>
        </View>
      </View>
      <View style={styles.toggleOptions}>
        {options.map(option => {
          const isSelected = value === option.v;
          console.log(`Desktop ${title} - ${option.l}: isSelected = ${isSelected}`);
          
          return (
            <View key={option.v} style={styles.desktopSwitchItem}>
              <Switch
                value={isSelected}
                onValueChange={(newValue) => {
                  if (newValue) {
                    console.log(`Desktop: User selected ${title}:`, option.v);
                    onChange(option.v);
                  }
                }}
                trackColor={{ true: '#000000', false: '#E5E7EB' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
              <View style={styles.desktopSwitchContent}>
                <Text style={styles.desktopSwitchTitle}>{option.l}</Text>
                <Text style={styles.desktopSwitchDesc}>{option.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function PersonalizationSection({ 
  settings, 
  onSettingChange,
  isMobile = IS_MOBILE,
  onBack = null,
  onSave = null,
  showHeader = false
}) {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Force defaults immediately and track initialization
  useEffect(() => {
    console.log('=== PersonalizationSection Mounting ===');
    console.log('Initial settings received:', settings);
    
    // Small delay to ensure parent is ready
    const applyDefaults = () => {
      let needsUpdate = false;
      
      // Force defaults regardless of what's passed in
      if (!settings.speLevel || settings.speLevel !== DEFAULT_SETTINGS.speLevel) {
        console.log('🔧 Forcing speLevel default:', DEFAULT_SETTINGS.speLevel);
        onSettingChange('speLevel', DEFAULT_SETTINGS.speLevel);
        needsUpdate = true;
      }
      
      if (!settings.speTone || settings.speTone !== DEFAULT_SETTINGS.speTone) {
        console.log('🔧 Forcing speTone default:', DEFAULT_SETTINGS.speTone);
        onSettingChange('speTone', DEFAULT_SETTINGS.speTone);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log('✅ Defaults applied, component will re-render');
      } else {
        console.log('✅ Defaults already correct');
      }
      
      setIsInitialized(true);
    };
    
    // Apply immediately and also after a small delay
    applyDefaults();
    setTimeout(applyDefaults, 100);
    
  }, []); // Only run once on mount

  // Simple avatar change handler
  const handleAvatarChange = (selectedAvatar) => {
    onSettingChange('selectedAvatar', selectedAvatar);
    if (isMobile) {
      setShowAvatarModal(false);
    }
  };

  const expertiseLevelOptions = [
    { v: 'beginner', l: 'Beginner', desc: 'Simple explanations' },
    { v: 'intermediate', l: 'Intermediate', desc: 'Balanced detail' }, // Default
    { v: 'expert', l: 'Expert', desc: 'Technical depth' },
  ];

  const communicationToneOptions = [
    { v: 'casual', l: 'Casual & Friendly', desc: 'Relaxed conversation style' },
    { v: 'professional', l: 'Professional & Formal', desc: 'Formal business tone' }, // Default
    { v: 'polite', l: 'Polite & Respectful', desc: 'Courteous approach' },
    { v: 'enthusiastic', l: 'Enthusiastic & Energetic', desc: 'Energetic responses' },
  ];

  // Force correct values regardless of what parent provides
  const currentSpeLevelValue = isInitialized ? (settings.speLevel || DEFAULT_SETTINGS.speLevel) : DEFAULT_SETTINGS.speLevel;
  const currentSpeToneValue = isInitialized ? (settings.speTone || DEFAULT_SETTINGS.speTone) : DEFAULT_SETTINGS.speTone;

  // Debug logging
  console.log('=== Render State ===');
  console.log('Initialized:', isInitialized);
  console.log('Settings from parent:', settings);
  console.log('Forced speLevel:', currentSpeLevelValue);
  console.log('Forced speTone:', currentSpeToneValue);
  console.log('Expected defaults:', DEFAULT_SETTINGS);

  const renderMobileHeader = () => {
    if (!showHeader) return null;
    
    return (
      <View style={styles.mobileHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={onBack}
        >
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>Personalization</Text>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={onSave}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderDesktopContent = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Personalization</Text>
        <Text style={styles.sectionDescription}>Customize how SPE interacts with you and responds to your queries</Text>
      </View>

      {/* Avatar Section */}
      <SettingField
        icon={<Camera size={20} color="#000000" />}
        title="Profile Avatar"
        description="Choose your digital engineer persona for a personalized experience"
      >
        <AvatarSelector
          selectedAvatar={settings.selectedAvatar}
          onAvatarChange={handleAvatarChange}
          isMobile={false}
        />
      </SettingField>

      <SettingField
        icon={<User size={20} color="#000000" />}
        title="Nickname"
        description="What should SPE call you in conversations?"
      >
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Alex, Sam, Chris"
          value={settings.nickName}
          onChangeText={v => onSettingChange('nickName', v)}
          placeholderTextColor="#CCCCCC"
        />
      </SettingField>

      <SettingField
        icon={<Briefcase size={20} color="#000000" />}
        title="Profession"
        description="Your job title or professional role"
      >
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Software Engineer, Product Designer"
          value={settings.profession}
          onChangeText={v => onSettingChange('profession', v)}
          placeholderTextColor="#CCCCCC"
        />
      </SettingField>

      <SettingField
        icon={<Globe size={20} color="#000000" />}
        title="Industry"
        description="Your field of work or business sector"
      >
        <TextInput
          style={styles.textInput}
          placeholder="e.g. Technology, Healthcare, Finance"
          value={settings.industry}
          onChangeText={v => onSettingChange('industry', v)}
          placeholderTextColor="#CCCCCC"
        />
      </SettingField>

      {/* Expertise Level with Toggle Buttons - Default: Intermediate */}
      <ToggleOptions
        value={currentSpeLevelValue}
        options={expertiseLevelOptions}
        onChange={v => onSettingChange('speLevel', v)}
        title="Expertise Level"
        description="How technical should responses be? (Default: Intermediate)"
      />

      {/* Communication Tone with Toggle Buttons - Default: Professional & Formal */}
      <ToggleOptions
        value={currentSpeToneValue}
        options={communicationToneOptions}
        onChange={v => onSettingChange('speTone', v)}
        title="Communication Tone"
        description="Preferred conversation style and approach (Default: Professional & Formal)"
      />

      <View style={styles.textAreaField}>
        <View style={styles.fieldHeader}>
          <View style={styles.fieldIcon}>
            <MessageCircle size={20} color="#000000" />
          </View>
          <View style={styles.fieldLabels}>
            <Text style={styles.fieldTitle}>Response Instructions</Text>
            <Text style={styles.fieldDescription}>
              Provide specific instructions for how you want SPE to communicate with you
            </Text>
          </View>
        </View>
        <TextInput
          style={styles.textArea}
          placeholder="Example: Please be concise and include practical examples. Focus on actionable advice and ask clarifying questions when needed. Use bullet points for complex topics..."
          multiline
          numberOfLines={4}
          value={settings.speResponse}
          onChangeText={v => onSettingChange('speResponse', v)}
          textAlignVertical="top"
          placeholderTextColor="#CCCCCC"
        />
        <Text style={styles.charCount}>
          {settings.speResponse.length}/500 characters
        </Text>
      </View>
    </View>
  );

  const renderMobileContent = () => (
    <ScrollView 
      style={styles.mobileScrollContainer} 
      contentContainerStyle={styles.mobileScrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar Section */}
      <Text style={styles.mobileSectionTitle}>Profile Avatar</Text>
      <Text style={styles.mobileSectionSubtitle}>Choose your digital engineer persona</Text>
      <MobileAvatarSelector
        selectedAvatar={settings.selectedAvatar}
        onPress={() => setShowAvatarModal(true)}
      />

      <Text style={styles.mobileSectionTitle}>Nickname</Text>
      <Text style={styles.mobileSectionSubtitle}>What should SPE call you in conversations?</Text>
      <TextInput
        style={styles.mobileDetailInput}
        placeholder="Enter your nickname"
        value={settings.nickName}
        onChangeText={v => onSettingChange('nickName', v)}
        placeholderTextColor="#CCCCCC"
      />

      <View style={{ marginTop: 20 }}>
        <Text style={styles.mobileSectionTitle}>Profession</Text>
        <Text style={styles.mobileSectionSubtitle}>Your job title or professional role</Text>
        <TextInput
          style={styles.mobileDetailInput}
          placeholder="Enter your profession"
          value={settings.profession}
          onChangeText={v => onSettingChange('profession', v)}
          placeholderTextColor="#CCCCCC"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.mobileSectionTitle}>Industry</Text>
        <Text style={styles.mobileSectionSubtitle}>Your field of work or business sector</Text>
        <TextInput
          style={styles.mobileDetailInput}
          placeholder="Enter your industry"
          value={settings.industry}
          onChangeText={v => onSettingChange('industry', v)}
          placeholderTextColor="#CCCCCC"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.mobileSectionTitle}>Expertise Level</Text>
        <Text style={styles.mobileSectionSubtitle}>How technical should responses be? (Default: Intermediate)</Text>
        {expertiseLevelOptions.map(option => {
          const isSelected = currentSpeLevelValue === option.v;
          console.log(`Switch ${option.l}: isSelected = ${isSelected} (current: ${currentSpeLevelValue}, option: ${option.v})`);
          
          return (
            <View key={option.v} style={styles.mobileSwitchItem}>
              <Switch
                value={isSelected}
                onValueChange={(newValue) => {
                  if (newValue) {
                    console.log('User selected speLevel:', option.v);
                    onSettingChange('speLevel', option.v);
                  }
                }}
                trackColor={{ true: '#000000', false: '#E5E7EB' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
              <View style={styles.mobileSwitchContent}>
                <Text style={styles.mobileSwitchTitle}>
                  {option.l} {option.v === DEFAULT_SETTINGS.speLevel && '(Default)'}
                </Text>
                <Text style={styles.mobileSwitchDesc}>{option.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.mobileSectionTitle}>Communication Tone</Text>
        <Text style={styles.mobileSectionSubtitle}>Preferred conversation style and approach (Default: Professional & Formal)</Text>
        {communicationToneOptions.map(option => {
          const isSelected = currentSpeToneValue === option.v;
          console.log(`Tone Switch ${option.l}: isSelected = ${isSelected} (current: ${currentSpeToneValue}, option: ${option.v})`);
          
          return (
            <View key={option.v} style={styles.mobileSwitchItem}>
              <Switch
                value={isSelected}
                onValueChange={(newValue) => {
                  if (newValue) {
                    console.log('User selected speTone:', option.v);
                    onSettingChange('speTone', option.v);
                  }
                }}
                trackColor={{ true: '#000000', false: '#E5E7EB' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E5E7EB"
              />
              <View style={styles.mobileSwitchContent}>
                <Text style={styles.mobileSwitchTitle}>
                  {option.l} {option.v === DEFAULT_SETTINGS.speTone && '(Default)'}
                </Text>
                <Text style={styles.mobileSwitchDesc}>{option.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ marginTop: 20 }}>
        <Text style={styles.mobileSectionTitle}>Response Instructions</Text>
        <Text style={styles.mobileSectionSubtitle}>Provide specific instructions for how you want SPE to communicate with you</Text>
        <TextInput
          style={styles.mobileTextArea}
          placeholder="Example: Please be concise and include practical examples. Focus on actionable advice..."
          multiline
          numberOfLines={4}
          value={settings.speResponse}
          onChangeText={v => onSettingChange('speResponse', v)}
          textAlignVertical="top"
          placeholderTextColor="#CCCCCC"
        />
        <Text style={styles.mobileCharCount}>
          {settings.speResponse.length}/500 characters
        </Text>
      </View>
    </ScrollView>
  );

  if (isMobile) {
    return (
      <View style={styles.mobileContainer}>
        {renderMobileHeader()}
        {renderMobileContent()}
        <MobileAvatarModal
          visible={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          selectedAvatar={settings.selectedAvatar}
          onSelect={handleAvatarChange}
        />
      </View>
    );
  }

  return renderDesktopContent();
}

const styles = StyleSheet.create({
  // ─── Desktop Styles ──────────────────────────────────────────────────────
  // Section
  section: { 
    marginBottom: 32 
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: { 
    fontSize: 22, 
    fontWeight: '700', 
    color: '#000000', 
    marginBottom: 6,
  },
  sectionDescription: { 
    fontSize: 14, 
    color: '#666666', 
    lineHeight: 20,
  },

  // Setting Fields
  settingField: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12, 
    padding: 18, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingFieldReadonly: {
    backgroundColor: '#FFF8E6',
    borderColor: '#FFD166',
    borderStyle: 'dashed',
  },
  fieldHeader: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldIcon: {
    width: 36, 
    height: 36, 
    borderRadius: 8,
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldIconReadonly: {
    backgroundColor: '#FFF8E6',
  },
  fieldLabels: { 
    flex: 1,
  },
  fieldTitle: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#000000',
    marginBottom: 3,
  },
  fieldTitleReadonly: {
    color: '#FF9500',
  },
  fieldDescription: { 
    fontSize: 13, 
    color: '#666666', 
    lineHeight: 18,
  },
  fieldControl: { 
    flexShrink: 0,
    marginLeft: 16,
  },

  // Input Controls
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8, 
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    minWidth: 200,
  },

  // Toggle Section for Desktop
  toggleSection: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  toggleOptions: {
    paddingLeft: 50, // Align with other content
  },
  desktopSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  desktopSwitchContent: {
    flex: 1,
    marginLeft: 12,
  },
  desktopSwitchTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  desktopSwitchDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },

  // Select
  selectButton: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF', 
    borderRadius: 8,
    paddingHorizontal: 14, 
    paddingVertical: 12,
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    minWidth: 200,
  },
  selectText: { 
    fontWeight: '500', 
    color: '#000000',
    fontSize: 14,
    flex: 1,
  },
  selectPlaceholder: {
    color: '#CCCCCC',
  },

  // Text Area
  textAreaField: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginTop: 12,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    color: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 6,
  },

  // ─── Mobile Styles ───────────────────────────────────────────────────────
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#000000',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  mobileScrollContainer: {
    flex: 1,
  },
  mobileScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  mobileSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
    marginTop: 8,
  },
  mobileSectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  mobileDetailInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#000000',
  },
  mobileSwitchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mobileSwitchContent: {
    flex: 1,
    marginLeft: 12,
  },
  mobileSwitchTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  mobileSwitchDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  mobileTextArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
    marginTop: 8,
  },
  mobileCharCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 6,
  },

  // ─── Mobile Avatar Styles ───────────────────────────────────────────────
  mobileAvatarSelector: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mobileAvatarDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    overflow: 'hidden',
    marginRight: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mobileAvatarImage: {
    width: '100%',
    height: '100%',
  },
  mobileAvatarInfo: {
    flex: 1,
  },
  mobileAvatarName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  mobileAvatarSubtext: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },

  // Avatar Modal Styles
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  avatarModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 25,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  avatarModalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarOptionSelected: {
    backgroundColor: '#F0F9FF',
    borderColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarOptionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    overflow: 'hidden',
    marginRight: 16,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  avatarOptionInfo: {
    flex: 1,
  },
  avatarOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  avatarOptionNameSelected: {
    color: '#1D4ED8',
  },
  avatarOptionDesc: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  avatarOptionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalOptionSelected: {
    backgroundColor: '#F8F9FA',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333333',
    flex: 1,
  },
  modalOptionTextSelected: {
    color: '#000000',
    fontWeight: '600',
  },
});
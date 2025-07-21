const refreshPaymentMethods = async () => {
    try {
      const stored = await AsyncStorage.getItem('paymentMethods');
      if (stored) {
        setPaymentMethods(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Error refreshing payment methods:', error);
    }
  };// screens/SettingsPage.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Switch,
  TextInput,
  Alert,
  Platform,
  ActionSheetIOS,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import {
  Settings as SettingsIcon,
  Bell,
  Palette,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Smartphone,
  User,
  Sun,
  Lock,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Crown,
  Download,
  X,
  Info,
  LogOut,
  ArrowLeft,
  Check,
} from 'lucide-react-native';

import SubscriptionModal from '../components/SubscriptionModal';
import PersonalizationSection from '../components/PersonalizationSection';
import PaymentMethodsSection from '../components/BillingHistorySection';
import BillingHistorySection from '../components/PaymentMethodsSection';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SIDEBAR_WIDTH = 280;
const IS_MOBILE = SCREEN_WIDTH < 768;

const SECTIONS = [
  { id: 'general', name: 'General', Icon: SettingsIcon },
  { id: 'notifications', name: 'Notifications', Icon: Bell },
  { id: 'personalization', name: 'Personalization', Icon: Palette },
  { id: 'security', name: 'Security', Icon: Shield },
  { id: 'subscription', name: 'Subscription', Icon: CreditCard },
];

const MOBILE_SETTINGS = [
  { id: 'name', title: 'Name', subtitle: 'From your account registration', icon: User, readonly: true },
  { id: 'email', title: 'Email', subtitle: 'From your account registration', icon: Mail, readonly: true },
  { id: 'phone', title: 'Phone Number', subtitle: 'Your contact number', icon: Smartphone },
  { id: 'personalization', title: 'Personalization', subtitle: 'Customize your experience', icon: Palette },
  { id: 'subscription', title: 'Subscription', subtitle: 'Manage your plan & billing', icon: CreditCard },
  { id: 'theme', title: 'Theme', subtitle: 'Choose appearance', icon: Sun },
  { id: 'security', title: 'Security', subtitle: 'Account protection', icon: Shield },
  { id: 'logout', title: 'Sign Out', subtitle: 'Log out of your account', icon: LogOut, isDanger: true },
];

export default function SettingsPage({ route }) {
  const navigation = useNavigation();

  // ─── State ────────────────────────────────────────────────────────────────
  const [active, setActive] = useState(route?.params?.initialSection || 'general');
  const [currentView, setCurrentView] = useState('main');
  const [settings, setSettings] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    language: 'english',
    theme: 'white',
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    nickName: '',
    profession: '',
    industry: '',
    speLevel: 'beginner',
    speTone: 'casual',
    speResponse: '',
    twoFactorAuth: false,
    selectedAvatar: 'default',
    customAvatarUri: null,
  });
  const [currentPlan, setCurrentPlan] = useState('free');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState([]);

  // ─── Load stored values ─────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.multiGet([
          'userFullName',
          'userEmail',
          'userPhoneNumber',
          'userNickName',
          'userProfession',
          'userIndustry',
          'userLanguage',
          'userTheme',
          'emailNotifications',
          'pushNotifications',
          'marketingEmails',
          'speLevel',
          'speTone',
          'speResponse',
          'has2FA',
          'userPlan',
          'userAvatar',
          'paymentMethods',
        ]);
        const lookup = Object.fromEntries(data);
        
        const savedCustomAvatar = await AsyncStorage.getItem('customAvatarUri');
        
        setSettings(prev => ({
          ...prev,
          fullName: lookup.userFullName ?? prev.fullName,
          email: lookup.userEmail ?? prev.email,
          phoneNumber: lookup.userPhoneNumber ?? prev.phoneNumber,
          nickName: lookup.userNickName ?? prev.nickName,
          profession: lookup.userProfession ?? prev.profession,
          industry: lookup.userIndustry ?? prev.industry,
          language: lookup.userLanguage ?? prev.language,
          theme: lookup.userTheme ?? prev.theme,
          emailNotifications: lookup.emailNotifications === 'true' || lookup.emailNotifications === null ? true : false,
          pushNotifications: lookup.pushNotifications === 'true',
          marketingEmails: lookup.marketingEmails === 'true',
          speLevel: lookup.speLevel ?? prev.speLevel,
          speTone: lookup.speTone ?? prev.speTone,
          speResponse: lookup.speResponse ?? prev.speResponse,
          twoFactorAuth: lookup.has2FA === 'true',
          selectedAvatar: lookup.userAvatar ?? prev.selectedAvatar,
          customAvatarUri: savedCustomAvatar,
        }));
        setCurrentPlan(lookup.userPlan || 'free');
        
        // Load payment methods
        if (lookup.paymentMethods) {
          setPaymentMethods(JSON.parse(lookup.paymentMethods));
        }
      } catch (e) {
        console.warn('Failed loading settings:', e);
      }
    })();
  }, []);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    // Don't auto-save in mobile personalization view - user must click Done
    if (IS_MOBILE && currentView !== 'personalization') {
      handleSave(key, val);
    }
  };

  const handleSave = async (singleKey = null, singleVal = null) => {
    try {
      let toStore;
      if (singleKey && singleVal !== null) {
        let storageKey = singleKey;
        if (singleKey === 'fullName') storageKey = 'userFullName';
        else if (singleKey === 'email') storageKey = 'userEmail';
        else if (singleKey === 'phoneNumber') storageKey = 'userPhoneNumber';
        else if (singleKey === 'nickName') storageKey = 'userNickName';
        else if (singleKey === 'profession') storageKey = 'userProfession';
        else if (singleKey === 'industry') storageKey = 'userIndustry';
        else if (singleKey === 'language') storageKey = 'userLanguage';
        else if (singleKey === 'theme') storageKey = 'userTheme';
        else if (singleKey === 'twoFactorAuth') storageKey = 'has2FA';
        else if (singleKey === 'selectedAvatar') storageKey = 'userAvatar';
        else if (singleKey === 'customAvatarUri') storageKey = 'customAvatarUri';
        
        const storeVal = typeof singleVal === 'boolean' ? singleVal.toString() : singleVal.toString();
        await AsyncStorage.setItem(storageKey, storeVal);
      } else {
        toStore = Object.entries(settings).map(([key, val]) => {
          let storageKey = key;
          if (key === 'fullName') storageKey = 'userFullName';
          else if (key === 'email') storageKey = 'userEmail';
          else if (key === 'phoneNumber') storageKey = 'userPhoneNumber';
          else if (key === 'nickName') storageKey = 'userNickName';
          else if (key === 'profession') storageKey = 'userProfession';
          else if (key === 'industry') storageKey = 'userIndustry';
          else if (key === 'language') storageKey = 'userLanguage';
          else if (key === 'theme') storageKey = 'userTheme';
          else if (key === 'twoFactorAuth') storageKey = 'has2FA';
          else if (key === 'selectedAvatar') storageKey = 'userAvatar';
          else if (key === 'customAvatarUri') return null; // Skip this as it's handled separately
          
          if (storageKey === null) return null;
          const storeVal = typeof val === 'boolean' ? val.toString() : (typeof val === 'string' ? val : JSON.stringify(val));
          return [storageKey, storeVal];
        }).filter(Boolean);
        
        await AsyncStorage.multiSet(toStore);
        
        // Handle custom avatar separately
        if (settings.customAvatarUri) {
          await AsyncStorage.setItem('customAvatarUri', settings.customAvatarUri);
        }
        
        Alert.alert('Success', 'Your settings have been saved successfully!');
      }
    } catch (e) {
      console.warn('Save error:', e);
      if (!singleKey) {
        Alert.alert('Error', 'Could not save settings. Please try again.');
      }
    }
  };

  // ─── Logout Handler ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'isAuthenticated',
                'freeQueries',
                'userPlan',
                'userRole',
                'userEmail',
                'userName',
                'chatHistory',
                'userFullName',
                'userPhoneNumber',
                'userNickName',
                'userProfession',
                'userIndustry',
                'userLanguage',
                'userTheme',
                'emailNotifications',
                'pushNotifications',
                'marketingEmails',
                'speLevel',
                'speTone',
                'speResponse',
                'has2FA',
                'userAvatar',
                'customAvatarUri',
              ]);
              navigation.navigate('Login');
            } catch (error) {
              console.warn('Logout error:', error);
              Alert.alert('Error', 'Could not sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleLogoutAllDevices = () => {
    Alert.alert(
      'Log out from all devices',
      'Are you sure you want to log out from all devices? You will need to sign in again on all your devices.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log out', 
          style: 'destructive', 
          onPress: () => {
            Alert.alert('Success', 'You have been logged out from all devices.');
          }
        }
      ]
    );
  };

  // ─── Desktop Components ──────────────────────────────────────────────────
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
              {readonly && <Info size={14} color="#FF9500" style={{ marginLeft: 8 }} />}
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

  // ─── Mobile Components ───────────────────────────────────────────────────
  function MobileSettingItem({ item, onPress }) {
    const IconComponent = item.icon;
    let rightText = '';
    
    switch (item.id) {
      case 'name':
        rightText = settings.fullName || 'Not set';
        break;
      case 'email':
        rightText = settings.email || 'Not set';
        break;
      case 'phone':
        rightText = settings.phoneNumber || 'Not set';
        break;
      case 'personalization':
        rightText = settings.nickName || 'Customize';
        break;
      case 'subscription':
        const defaultPaymentMethod = paymentMethods.find(method => method.isDefault);
        rightText = defaultPaymentMethod ? `••••${defaultPaymentMethod.last4}` : 'No cards';
        break;
      case 'theme':
        rightText = settings.theme.charAt(0).toUpperCase() + settings.theme.slice(1);
        break;
      case 'security':
        rightText = settings.twoFactorAuth ? 'Enabled' : 'Review';
        break;
      case 'logout':
        rightText = '';
        break;
    }

    return (
      <TouchableOpacity 
        style={[
          styles.mobileItem, 
          item.readonly && styles.mobileItemReadonly,
          item.isDanger && styles.mobileItemDanger
        ]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.mobileItemLeft}>
          <View style={[
            styles.mobileIcon, 
            item.readonly && styles.mobileIconReadonly,
            item.isDanger && styles.mobileIconDanger
          ]}>
            <IconComponent 
              size={20} 
              color={item.readonly ? "#999999" : item.isDanger ? "#EF4444" : "#000000"} 
            />
          </View>
          <View style={styles.mobileTextContainer}>
            <Text style={[
              styles.mobileTitle, 
              item.readonly && styles.mobileTitleReadonly,
              item.isDanger && styles.mobileTitleDanger
            ]}>
              {item.title}
            </Text>
            <Text style={styles.mobileSubtitle}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={styles.mobileItemRight}>
          {rightText !== '' && (
            <Text style={[styles.mobileRightText, item.readonly && styles.mobileRightTextReadonly]} numberOfLines={1}>
              {rightText}
            </Text>
          )}
          {!item.isDanger && <ChevronRight size={16} color="#CCCCCC" style={{ marginLeft: 8 }} />}
        </View>
      </TouchableOpacity>
    );
  }

  // ─── Desktop Section Renderers ───────────────────────────────────────────
  const renderGeneral = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        <Text style={styles.sectionDescription}>Manage your basic account information and preferences</Text>
      </View>

      <SettingField
        icon={<User size={20} color="#FF9500" />}
        title="Full Name"
        description="Your registered account name"
        readonly={true}
      >
        <View style={styles.readonlyValue}>
          <Text style={styles.readonlyText}>{settings.fullName || 'Not set'}</Text>
        </View>
      </SettingField>

      <SettingField
        icon={<Mail size={20} color="#FF9500" />}
        title="Email Address"
        description="Your registered email address"
        readonly={true}
      >
        <View style={styles.readonlyValue}>
          <Text style={styles.readonlyText}>{settings.email || 'Not set'}</Text>
        </View>
      </SettingField>

      <SettingField
        icon={<Smartphone size={20} color="#000000" />}
        title="Phone Number"
        description="Used for security and account verification"
      >
        <TextInput
          style={styles.textInput}
          placeholder="+1 555 123 4567"
          keyboardType="phone-pad"
          value={settings.phoneNumber}
          onChangeText={v => update('phoneNumber', v)}
          placeholderTextColor="#CCCCCC"
        />
      </SettingField>

      <SettingField
        icon={<Globe size={20} color="#000000" />}
        title="Language"
        description="Choose your preferred language"
      >
        <Select
          value={settings.language}
          options={[
            { v: 'english', l: 'English' },
            { v: 'spanish', l: 'Español' },
            { v: 'french', l: 'Français' },
            { v: 'german', l: 'Deutsch' },
            { v: 'italian', l: 'Italiano' },
            { v: 'portuguese', l: 'Português' },
          ]}
          onChange={v => update('language', v)}
          placeholder="Select Language"
        />
      </SettingField>

      <SettingField
        icon={<Sun size={20} color="#000000" />}
        title="App Theme"
        description="Choose your preferred appearance"
      >
        <Select
          value={settings.theme}
          options={[
            { v: 'white', l: 'Light Theme' },
            { v: 'black', l: 'Dark Theme' },
          ]}
          onChange={v => update('theme', v)}
          placeholder="Select Theme"
        />
      </SettingField>
    </View>
  );

  const renderNotifications = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Notification Preferences</Text>
        <Text style={styles.sectionDescription}>Control how and when you receive alerts and updates</Text>
      </View>

      {[
        { 
          icon: <Mail size={20} color="#000000" />, 
          title: 'Email Notifications', 
          description: 'Receive important updates via email',
          key: 'emailNotifications' 
        },
        { 
          icon: <Smartphone size={20} color="#000000" />, 
          title: 'Push Notifications', 
          description: 'Get instant alerts on your mobile device',
          key: 'pushNotifications' 
        },
        { 
          icon: <Bell size={20} color="#000000" />, 
          title: 'Marketing Communications', 
          description: 'Product updates, tips, and promotional offers',
          key: 'marketingEmails' 
        },
      ].map(({ icon, title, description, key }) => (
        <SettingField
          key={key}
          icon={icon}
          title={title}
          description={description}
        >
          <Switch
            value={settings[key]}
            onValueChange={() => update(key, !settings[key])}
            trackColor={{ true: '#000000', false: '#E5E7EB' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E5E7EB"
          />
        </SettingField>
      ))}
    </View>
  );

  const renderSecurity = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Security Settings</Text>
        <Text style={styles.sectionDescription}>Protect your account with additional security measures</Text>
      </View>

      <SettingField
        icon={<Shield size={20} color="#000000" />}
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
      >
        <Switch
          value={settings.twoFactorAuth}
          onValueChange={async val => {
            update('twoFactorAuth', val);
            await AsyncStorage.setItem('has2FA', val.toString());
            if (val) navigation.navigate('Setup2FA');
          }}
          trackColor={{ true: '#000000', false: '#E5E7EB' }}
          thumbColor="#FFFFFF"
          ios_backgroundColor="#E5E7EB"
        />
      </SettingField>

      <SettingField
        icon={<Lock size={20} color="#000000" />}
        title="Change Password"
        description="Update your account password for better security"
      >
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Password</Text>
          <ChevronRight size={16} color="#000000" />
        </TouchableOpacity>
      </SettingField>

      <View style={[styles.securityAlert, styles.securityAlertWarning]}>
        <AlertCircle size={20} color="#EF4444" />
        <View style={styles.securityAlertContent}>
          <Text style={[styles.securityAlertTitle, { color: "#EF4444" }]}>
            {settings.twoFactorAuth ? "Security Status: Excellent" : "Security Recommendation"}
          </Text>
          <Text style={styles.securityAlertText}>
            {settings.twoFactorAuth 
              ? "Two-factor authentication is enabled and protecting your account."
              : "Enable two-factor authentication to secure your account against unauthorized access."
            }
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSubscription = () => {
    // Check if we're in a sub-view for desktop
    if (!IS_MOBILE && currentView === 'payment') {
      return (
        <PaymentMethodsSection 
          onBack={async () => {
            await refreshPaymentMethods();
            setCurrentView('main');
          }}
          isMobile={false}
        />
      );
    }
    
    if (!IS_MOBILE && currentView === 'billing') {
      return (
        <BillingHistorySection 
          onBack={() => setCurrentView('main')}
          isMobile={false}
        />
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Subscription & Billing</Text>
          <Text style={styles.sectionDescription}>Manage your plan, billing information, and subscription settings</Text>
        </View>

        <SettingField
          icon={<Crown size={20} color="#000000" />}
          title="Current Plan"
          description={`${currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan - Manage your subscription`}
        >
          <TouchableOpacity 
            style={styles.planButton}
            onPress={() => setShowSubscriptionModal(true)}
          >
            <Text style={styles.planButtonText}>
              {currentPlan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
            </Text>
          </TouchableOpacity>
        </SettingField>

        <SettingField
          icon={<CreditCard size={20} color="#000000" />}
          title="Payment Methods"
          description="Manage your payment cards and billing information"
        >
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => setCurrentView('payment')}
          >
            <Text style={styles.linkButtonText}>Manage Cards</Text>
          </TouchableOpacity>
        </SettingField>

        <SettingField
          icon={<Download size={20} color="#000000" />}
          title="Billing History"
          description="View and download your invoices and payment history"
        >
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => setCurrentView('billing')}
          >
            <Text style={styles.linkButtonText}>View History</Text>
          </TouchableOpacity>
        </SettingField>

        <SettingField
          icon={<X size={20} color="#DC2626" />}
          title="Cancel Subscription"
          description="You'll retain access until your current period ends"
        >
          <TouchableOpacity 
            style={styles.dangerButton}
            onPress={() => Alert.alert(
              'Cancel Subscription',
              'Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.',
              [
                { text: 'Keep Subscription', style: 'cancel' },
                { text: 'Cancel Plan', style: 'destructive', onPress: () => Alert.alert('Subscription cancelled') }
              ]
            )}
          >
            <Text style={styles.dangerButtonText}>Cancel Plan</Text>
          </TouchableOpacity>
        </SettingField>

        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={async () => {
            setShowSubscriptionModal(false);
            const plan = await AsyncStorage.getItem('userPlan');
            setCurrentPlan(plan || 'free');
          }}
          currentPlan={currentPlan}
        />
      </View>
    );
  };

  // ─── Mobile Detail Views ─────────────────────────────────────────────────
  const renderMobileDetailView = () => {
    const renderHeader = (title) => (
      <View style={styles.mobileHeader}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setCurrentView('main')}
        >
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.mobileHeaderTitle}>{title}</Text>
        <TouchableOpacity 
          style={styles.doneButton}
          onPress={async () => {
            await handleSave();
            setCurrentView('main');
          }}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );

    switch (currentView) {
      case 'personalization':
        return (
          <PersonalizationSection
            settings={settings}
            onSettingChange={update}
            isMobile={true}
            showHeader={true}
            onBack={() => setCurrentView('main')}
            onSave={async () => {
              await handleSave();
              setCurrentView('main');
            }}
          />
        );

      case 'phone':
        return (
          <View style={styles.mobileDetailContainer}>
            {renderHeader('Phone Number')}
            <ScrollView 
              style={styles.mobileScrollContainer} 
              contentContainerStyle={styles.mobileScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.mobileSectionTitle}>Phone Number</Text>
              <Text style={styles.mobileSectionSubtitle}>Used for account verification and security alerts</Text>
              <TextInput
                style={styles.mobileDetailInput}
                placeholder="+1 555 123 4567"
                keyboardType="phone-pad"
                value={settings.phoneNumber}
                onChangeText={v => update('phoneNumber', v)}
                autoFocus
                placeholderTextColor="#CCCCCC"
              />
            </ScrollView>
          </View>
        );

      case 'theme':
        return (
          <View style={styles.mobileDetailContainer}>
            {renderHeader('Theme')}
            <ScrollView 
              style={styles.mobileScrollContainer} 
              contentContainerStyle={styles.mobileScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.mobileSectionTitle}>Choose Theme</Text>
              <Text style={styles.mobileSectionSubtitle}>Select your preferred appearance</Text>
              {[
                { v: 'white', l: 'Light Theme', desc: 'Light background with dark text' },
                { v: 'black', l: 'Dark Theme', desc: 'Dark background with light text' },
              ].map(option => (
                <TouchableOpacity
                  key={option.v}
                  style={[
                    styles.mobileOptionItem,
                    settings.theme === option.v && styles.mobileOptionItemSelected
                  ]}
                  onPress={() => update('theme', option.v)}
                >
                  <View style={styles.mobileOptionContent}>
                    <Text style={[
                      styles.mobileOptionTitle,
                      settings.theme === option.v && styles.mobileOptionTitleSelected
                    ]}>
                      {option.l}
                    </Text>
                    <Text style={styles.mobileOptionDesc}>{option.desc}</Text>
                  </View>
                  {settings.theme === option.v && (
                    <View style={styles.mobileOptionCheck}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case 'security':
        return (
          <View style={styles.mobileDetailContainer}>
            {renderHeader('Security')}
            <ScrollView 
              style={styles.mobileScrollContainer} 
              contentContainerStyle={styles.mobileScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity style={styles.mobileSecurityItem}>
                <View style={styles.mobileSecurityLeft}>
                  <Lock size={20} color="#000000" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.mobileSecurityTitle}>Two-Factor Authentication</Text>
                    <Text style={styles.mobileSecurityDesc}>
                      {settings.twoFactorAuth ? 'Enabled' : 'Disabled'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={settings.twoFactorAuth}
                  onValueChange={async val => {
                    update('twoFactorAuth', val);
                    if (val) navigation.navigate('Setup2FA');
                  }}
                  trackColor={{ true: '#000000', false: '#E5E7EB' }}
                  thumbColor="#FFFFFF"
                />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.mobileSecurityItem}
                onPress={handleLogoutAllDevices}
              >
                <View style={styles.mobileSecurityLeft}>
                  <LogOut size={20} color="#000000" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.mobileSecurityTitle}>Log out from all devices</Text>
                    <Text style={styles.mobileSecurityDesc}>Sign out everywhere</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#CCCCCC" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        );

      case 'subscription':
        return (
          <View style={styles.mobileDetailContainer}>
            {renderHeader('Subscription & Billing')}
            <ScrollView 
              style={styles.mobileScrollContainer} 
              contentContainerStyle={styles.mobileScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Current Plan */}
              <View style={styles.mobileSubscriptionCard}>
                <View style={styles.mobileSubscriptionHeader}>
                  <Crown size={24} color="#000000" />
                  <Text style={styles.mobileSubscriptionTitle}>Current Plan</Text>
                </View>
                <Text style={styles.mobileSubscriptionPlan}>
                  {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
                </Text>
                <Text style={styles.mobileSubscriptionDesc}>
                  {currentPlan === 'free' 
                    ? 'Basic features with limited usage' 
                    : 'Full access to all premium features'
                  }
                </Text>
              </View>

              {/* Payment Method */}
              <TouchableOpacity 
                style={styles.mobileSubscriptionItem}
                onPress={() => setCurrentView('payment')}
              >
                <View style={styles.mobileSubscriptionItemLeft}>
                  <CreditCard size={20} color="#000000" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.mobileSubscriptionItemTitle}>Payment Methods</Text>
                    <Text style={styles.mobileSubscriptionItemDesc}>Manage your payment cards</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#CCCCCC" />
              </TouchableOpacity>

              {/* Billing History */}
              <TouchableOpacity 
                style={styles.mobileSubscriptionItem}
                onPress={() => setCurrentView('billing')}
              >
                <View style={styles.mobileSubscriptionItemLeft}>
                  <Download size={20} color="#000000" />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.mobileSubscriptionItemTitle}>Billing History</Text>
                    <Text style={styles.mobileSubscriptionItemDesc}>View invoices & receipts</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#CCCCCC" />
              </TouchableOpacity>

              {/* Cancel Subscription */}
              {currentPlan !== 'free' && (
                <TouchableOpacity 
                  style={[styles.mobileSubscriptionItem, styles.mobileSubscriptionItemDanger]}
                  onPress={() => Alert.alert(
                    'Cancel Subscription',
                    'Are you sure you want to cancel your subscription? You will retain access until the end of your current billing period.',
                    [
                      { text: 'Keep Subscription', style: 'cancel' },
                      { text: 'Cancel Plan', style: 'destructive', onPress: () => Alert.alert('Subscription cancelled') }
                    ]
                  )}
                >
                  <View style={styles.mobileSubscriptionItemLeft}>
                    <X size={20} color="#EF4444" />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={[styles.mobileSubscriptionItemTitle, { color: '#EF4444' }]}>Cancel Subscription</Text>
                      <Text style={styles.mobileSubscriptionItemDesc}>You'll keep access until period ends</Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        );

      case 'payment':
        return (
          <PaymentMethodsSection 
            onBack={async () => {
              await refreshPaymentMethods();
              setCurrentView('subscription');
            }}
            isMobile={true}
          />
        );

      case 'billing':
        return (
          <BillingHistorySection 
            onBack={() => setCurrentView('subscription')}
            isMobile={true}
          />
        );

      default:
        return null;
    }
  };

  // ─── Main Render Logic ───────────────────────────────────────────────────
  if (IS_MOBILE) {
    if (currentView !== 'main') {
      return renderMobileDetailView();
    }

    return (
      <View style={styles.mobileContainer}>
        <View style={styles.mobileMainHeader}>
          <SettingsIcon size={24} color="#000000" />
          <Text style={styles.mobileMainHeaderTitle}>Settings</Text>
        </View>
        
        <ScrollView style={styles.mobileContent} showsVerticalScrollIndicator={false}>
          {MOBILE_SETTINGS.map(item => (
            <MobileSettingItem
              key={item.id}
              item={item}
              onPress={() => {
                if (item.id === 'logout') {
                  handleLogout();
                } else if (!item.readonly) {
                  setCurrentView(item.id);
                }
              }}
            />
          ))}
        </ScrollView>

        <SubscriptionModal
          visible={showSubscriptionModal}
          onClose={async () => {
            setShowSubscriptionModal(false);
            const plan = await AsyncStorage.getItem('userPlan');
            setCurrentPlan(plan || 'free');
          }}
          currentPlan={currentPlan}
        />
      </View>
    );
  }

  // Desktop View
  let content;
  switch (active) {
    case 'notifications': content = renderNotifications(); break;
    case 'personalization': 
      content = (
        <PersonalizationSection 
          settings={settings} 
          onSettingChange={update}
          isMobile={false}
        />
      ); 
      break;
    case 'security': content = renderSecurity(); break;
    case 'subscription': content = renderSubscription(); break;
    default: content = renderGeneral();
  }

  // Handle sub-views in desktop mode
  if (!IS_MOBILE && (currentView === 'payment' || currentView === 'billing')) {
    content = renderSubscription(); // This will render the appropriate sub-component
  }

  return (
    <View style={styles.container}>
      <View style={styles.desktopCard}>
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.sidebarHeaderIcon}>
              <SettingsIcon size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.sidebarTitle}>Settings</Text>
          </View>
          <ScrollView style={styles.sidebarContent} showsVerticalScrollIndicator={false}>
            {SECTIONS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sidebarTab, active === s.id && styles.sidebarTabActive]}
                onPress={() => setActive(s.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.sidebarTabIcon, active === s.id && styles.sidebarTabIconActive]}>
                  <s.Icon size={18} color={active === s.id ? '#FFFFFF' : '#666666'} />
                </View>
                <Text style={[styles.sidebarTabLabel, active === s.id && styles.sidebarTabLabelActive]}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.mainContent}>
          <ScrollView 
            style={styles.scrollContent} 
            showsVerticalScrollIndicator={false}
          >
            {content}
            {active !== 'subscription' && currentView === 'main' && (
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ─── Desktop Styles ──────────────────────────────────────────────────────
  container: { 
    flex: 1, 
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  desktopCard: {
    flex: 1,
    width: '70%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF', 
    borderRadius: 16,
    flexDirection: 'row', 
    overflow: 'hidden', 
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // Sidebar
  sidebar: {
    width: SIDEBAR_WIDTH, 
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1, 
    borderRightColor: '#F3F4F6',
  },
  sidebarHeader: {
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F3F4F6',
  },
  sidebarHeaderIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#000000' 
  },
  sidebarContent: {
    flex: 1,
    padding: 16,
  },
  sidebarTab: {
    flexDirection: 'row', 
    alignItems: 'center',
    padding: 12, 
    borderRadius: 10, 
    marginBottom: 4,
  },
  sidebarTabActive: { 
    backgroundColor: '#000000',
  },
  sidebarTabIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sidebarTabIconActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sidebarTabLabel: { 
    fontSize: 15, 
    fontWeight: '600', 
    color: '#666666' 
  },
  sidebarTabLabelActive: { color: '#FFFFFF' },

  // Main Content
  mainContent: { 
    flex: 1,
  },
  scrollContent: { 
    flex: 1,
    padding: 32,
  },

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
  readonlyValue: {
    backgroundColor: '#FFF8E6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFD166',
    minWidth: 200,
  },
  readonlyText: {
    fontSize: 14,
    color: '#FF9500',
    fontStyle: 'italic',
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

  // Buttons
  actionButton: {
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14, 
    paddingVertical: 10,
    borderWidth: 1, 
    borderColor: '#000000', 
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 150,
  },
  actionButtonText: { 
    color: '#000000', 
    fontWeight: '600',
    fontSize: 14,
  },
  linkButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  linkButtonText: { 
    color: '#000000', 
    fontWeight: '600',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  planButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  planButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  dangerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minWidth: 120,
  },
  dangerButtonText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    alignSelf: 'center',
    marginTop: 0,
    backgroundColor: '#000000', 
    paddingHorizontal: 28, 
    paddingVertical: 12, 
    borderRadius: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: { 
    color: '#FFFFFF', 
    fontSize: 15,
    fontWeight: '600' 
  },

  // Security Alert
  securityAlert: {
    flexDirection: 'row', 
    backgroundColor: '#F8F9FA',
    borderRadius: 12, 
    padding: 14, 
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  securityAlertWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  securityAlertContent: {
    marginLeft: 10,
    flex: 1,
  },
  securityAlertTitle: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#000000',
    marginBottom: 3,
  },
  securityAlertText: { 
    fontSize: 13, 
    color: '#666666', 
    lineHeight: 18,
  },

  // ─── Mobile Styles ───────────────────────────────────────────────────────
  mobileContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mobileMainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  mobileMainHeaderTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  mobileContent: {
    flex: 1,
  },
  mobileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    backgroundColor: '#FFFFFF',
  },
  mobileItemReadonly: {
    backgroundColor: '#FFF8E6',
  },
  mobileItemDanger: {
    backgroundColor: '#FEF2F2',
  },
  mobileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  mobileIconReadonly: {
    backgroundColor: '#FFF8E6',
  },
  mobileIconDanger: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  mobileTextContainer: {
    flex: 1,
  },
  mobileTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  mobileTitleReadonly: {
    color: '#FF9500',
  },
  mobileTitleDanger: {
    color: '#EF4444',
  },
  mobileSubtitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  mobileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    maxWidth: 120,
  },
  mobileRightText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'right',
  },
  mobileRightTextReadonly: {
    fontStyle: 'italic',
    color: '#FF9500',
  },

  // Mobile Detail Views
  mobileDetailContainer: {
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
  mobileOptionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mobileOptionItemSelected: {
    backgroundColor: '#000000',
  },
  mobileOptionContent: {
    flex: 1,
  },
  mobileOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  mobileOptionTitleSelected: {
    color: '#FFFFFF',
  },
  mobileOptionDesc: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  mobileOptionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileSecurityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  mobileSecurityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileSecurityTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  mobileSecurityDesc: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },

  // Mobile Subscription Styles
  mobileSubscriptionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  mobileSubscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mobileSubscriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 10,
  },
  mobileSubscriptionPlan: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  mobileSubscriptionDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  mobileSubscriptionButton: {
    backgroundColor: '#000000',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  mobileSubscriptionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mobileSubscriptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  mobileSubscriptionItemDanger: {
    backgroundColor: '#FEF2F2',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderBottomColor: '#FECACA',
  },
  mobileSubscriptionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mobileSubscriptionItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
  },
  mobileSubscriptionItemDesc: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
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
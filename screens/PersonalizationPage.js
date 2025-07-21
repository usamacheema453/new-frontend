// screens/PersonalizationPage.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import {
  Camera,
  User,
  Briefcase,
  Globe,
  MessageCircle,
  Palette,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import AvatarSelector from '../components/AvatarSelector';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

export default function PersonalizationPage() {
  const navigation = useNavigation();

  const [settings, setSettings] = useState({
    nickName: '',
    profession: '',
    industry: '',
    speLevel: 'intermediate',
    speTone: 'professional',
    speResponse: '',
    selectedAvatar: 'default',
  });

  // Load stored values
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.multiGet([
          'userNickName',
          'userProfession',
          'userIndustry',
          'speLevel',
          'speTone',
          'speResponse',
          'userAvatar',
        ]);
        const lookup = Object.fromEntries(data);
        
        setSettings(prev => ({
          ...prev,
          nickName: lookup.userNickName ?? prev.nickName,
          profession: lookup.userProfession ?? prev.profession,
          industry: lookup.userIndustry ?? prev.industry,
          speLevel: lookup.speLevel ?? prev.speLevel,
          speTone: lookup.speTone ?? prev.speTone,
          speResponse: lookup.speResponse ?? prev.speResponse,
          selectedAvatar: lookup.userAvatar ?? prev.selectedAvatar,
        }));
      } catch (e) {
        console.warn('Failed loading personalization settings:', e);
      }
    })();
  }, []);

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    try {
      const toStore = [
        ['userNickName', settings.nickName],
        ['userProfession', settings.profession],
        ['userIndustry', settings.industry],
        ['speLevel', settings.speLevel],
        ['speTone', settings.speTone],
        ['speResponse', settings.speResponse],
        ['userAvatar', settings.selectedAvatar],
      ];
      
      await AsyncStorage.multiSet(toStore);
      Alert.alert('Saved!', 'Your settings have been updated.');
    } catch (e) {
      Alert.alert('Error', 'Could not save settings.');
    }
  };

  const handleAvatarChange = (selectedAvatar) => {
    update('selectedAvatar', selectedAvatar);
  };

  // Get display values
  const getLevelDisplay = () => {
    const levels = {
      beginner: 'Beginner',
      intermediate: 'Intermediate', 
      expert: 'Expert'
    };
    return levels[settings.speLevel] || 'Intermediate';
  };

  const getToneDisplay = () => {
    const tones = {
      casual: 'Casual & Friendly',
      professional: 'Professional',
      polite: 'Polite & Respectful',
      enthusiastic: 'Enthusiastic'
    };
    return tones[settings.speTone] || 'Professional';
  };

  // Mobile View
  if (IS_MOBILE) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Personalization</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={async () => {
              await handleSave();
              navigation.goBack();
            }}
          >
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Avatar Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Camera size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Profile Avatar</Text>
            </View>
            <Text style={styles.cardSubtitle}>Choose your AI assistant persona</Text>
            <View style={styles.avatarContainer}>
              <AvatarSelector
                selectedAvatar={settings.selectedAvatar}
                onAvatarChange={handleAvatarChange}
                isMobile={true}
              />
            </View>
          </View>

          {/* Basic Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <User size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Basic Information</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nickname</Text>
              <TextInput
                style={styles.input}
                placeholder="What should I call you?"
                value={settings.nickName}
                onChangeText={v => update('nickName', v)}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Profession</Text>
              <TextInput
                style={styles.input}
                placeholder="Your job title"
                value={settings.profession}
                onChangeText={v => update('profession', v)}
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Industry</Text>
              <TextInput
                style={styles.input}
                placeholder="Your field of work"
                value={settings.industry}
                onChangeText={v => update('industry', v)}
                placeholderTextColor="#999999"
              />
            </View>
          </View>

          {/* Communication Preferences */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <MessageCircle size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Communication Style</Text>
            </View>

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate('ExpertiseLevel', { 
                currentLevel: settings.speLevel,
                onSelect: (level) => update('speLevel', level)
              })}
            >
              <View style={styles.settingRowLeft}>
                <Text style={styles.settingRowTitle}>Expertise Level</Text>
                <Text style={styles.settingRowSubtitle}>How technical should responses be?</Text>
              </View>
              <View style={styles.settingRowRight}>
                <Text style={styles.settingRowValue}>{getLevelDisplay()}</Text>
                <ChevronRight size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.settingRow}
              onPress={() => navigation.navigate('CommunicationTone', { 
                currentTone: settings.speTone,
                onSelect: (tone) => update('speTone', tone)
              })}
            >
              <View style={styles.settingRowLeft}>
                <Text style={styles.settingRowTitle}>Communication Tone</Text>
                <Text style={styles.settingRowSubtitle}>Your preferred conversation style</Text>
              </View>
              <View style={styles.settingRowRight}>
                <Text style={styles.settingRowValue}>{getToneDisplay()}</Text>
                <ChevronRight size={16} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Response Instructions */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Palette size={20} color="#007AFF" />
              <Text style={styles.cardTitle}>Custom Instructions</Text>
            </View>
            <Text style={styles.cardSubtitle}>Tell me how you'd like me to respond</Text>
            
            <TextInput
              style={styles.textArea}
              placeholder="Example: Be concise, include examples, ask clarifying questions..."
              multiline
              numberOfLines={4}
              value={settings.speResponse}
              onChangeText={text => {
                if (text.length <= 500) {
                  update('speResponse', text);
                }
              }}
              textAlignVertical="top"
              placeholderTextColor="#999999"
            />
            <Text style={styles.charCount}>
              {settings.speResponse.length}/500
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Desktop View (Simplified)
  return (
    <View style={styles.desktopContainer}>
      <View style={styles.desktopContent}>
        <View style={styles.desktopHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#000000" />
          </TouchableOpacity>
          <Text style={styles.desktopTitle}>Personalization</Text>
        </View>
        
        <ScrollView style={styles.desktopScroll}>
          <View style={styles.desktopCard}>
            <Text style={styles.desktopCardTitle}>Profile & Preferences</Text>
            
            <View style={styles.desktopRow}>
              <Text style={styles.desktopLabel}>Avatar</Text>
              <AvatarSelector
                selectedAvatar={settings.selectedAvatar}
                onAvatarChange={handleAvatarChange}
                isMobile={false}
              />
            </View>

            <View style={styles.desktopRow}>
              <Text style={styles.desktopLabel}>Nickname</Text>
              <TextInput
                style={styles.desktopInput}
                value={settings.nickName}
                onChangeText={v => update('nickName', v)}
                placeholder="Enter nickname"
              />
            </View>

            <View style={styles.desktopRow}>
              <Text style={styles.desktopLabel}>Profession</Text>
              <TextInput
                style={styles.desktopInput}
                value={settings.profession}
                onChangeText={v => update('profession', v)}
                placeholder="Enter profession"
              />
            </View>

            <View style={styles.desktopRow}>
              <Text style={styles.desktopLabel}>Industry</Text>
              <TextInput
                style={styles.desktopInput}
                value={settings.industry}
                onChangeText={v => update('industry', v)}
                placeholder="Enter industry"
              />
            </View>

            <TouchableOpacity style={styles.desktopSaveButton} onPress={handleSave}>
              <Text style={styles.desktopSaveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Mobile Styles
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerButton: {
    padding: 4,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingRowLeft: {
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  settingRowSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRowValue: {
    fontSize: 15,
    color: '#666666',
    marginRight: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000000',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 8,
  },
  bottomSpacer: {
    height: 32,
  },

  // Desktop Styles
  desktopContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  desktopContent: {
    maxWidth: 600,
    alignSelf: 'center',
    flex: 1,
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  desktopTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginLeft: 16,
  },
  desktopScroll: {
    flex: 1,
  },
  desktopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  desktopCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 24,
  },
  desktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  desktopLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    width: 120,
  },
  desktopInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  desktopSaveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignSelf: 'flex-start',
    marginTop: 16,
  },
  desktopSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
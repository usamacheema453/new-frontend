// ✅ COMPLETE userSettingsApi.js file

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:8000';

class UserSettingsAPI {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // ✅ Get auth token
  async getAuthToken() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  // ✅ Create headers
  async getHeaders() {
    const token = await this.getAuthToken();
    
    if (!token) {
      console.error('❌ No token found for API request');
      throw new Error('No authentication token found. Please login again.');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  // ✅ Field mapping functions
  mapBackendToFrontend(backendData) {
    return {
      // ✅ NEW: User basic info from backend
      fullName: backendData.full_name || '',
      email: backendData.email || '',
      phoneNumber: backendData.phone_number || '',
      nickName: backendData.nickname || '',

      // Notification settings
      emailNotifications: backendData.email_notifications,
      pushNotifications: backendData.push_notifications,
      marketingEmails: backendData.marketing_communications,
      
      // Personalization settings
      selectedAvatar: backendData.profile_avatar || 'default',
      profession: backendData.profession || '',
      industry: backendData.industry || '',
      speLevel: backendData.expertise_level || 'intermediate',
      speTone: backendData.communication_tone || 'casual_friendly',
      speResponse: backendData.response_instructions || '',
      
      // Security settings
      twoFactorAuth: backendData.is_2fa_enabled || false,
      
      // Metadata
      created_at: backendData.created_at,
      updated_at: backendData.updated_at
    };
  }

  mapFrontendToBackend(frontendData, type = 'all') {
    const mapped = {};
    
    if (type === 'notifications' || type === 'all') {
      mapped.email_notifications = frontendData.emailNotifications;
      mapped.push_notifications = frontendData.pushNotifications;
      mapped.marketing_communications = frontendData.marketingEmails;
    }
    
    if (type === 'personalization' || type === 'all') {
      mapped.profile_avatar = frontendData.selectedAvatar;
      mapped.profession = frontendData.profession;
      mapped.industry = frontendData.industry;
      mapped.expertise_level = frontendData.speLevel;
      mapped.communication_tone = frontendData.speTone;
      mapped.response_instructions = frontendData.speResponse;
      mapped.nickname = frontendData.nickName;
    }

    if(type === 'general' || type === 'all'){
      mapped.phone_number = frontendData.phoneNumber;
    }
    
    if (type === 'security' || type === 'all') {
      mapped.is_2fa_enabled = frontendData.twoFactorAuth;
    }
    
    return mapped;
  }

  // ✅ NEW: Update general settings (phone number)
  async updateGeneralSettings(frontendData) {
    try {
      const url = `${this.baseURL}/user-settings/general`;
      const backendData = this.mapFrontendToBackend(frontendData, 'general');
      
      console.log('📤 Sending general settings data:', backendData);
      
      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
    } catch (error) {
      console.error('❌ Failed to update general settings:', error.message);
      throw error;
    }
  }

  // ✅ Make authenticated request
  async makeAuthenticatedRequest(url, options = {}) {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (response.status === 401) {
        console.warn('❌ 401 Unauthorized - Token might be expired');
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ API Request failed:', error);
      throw error;
    }
  }

  // ✅ GET ALL SETTINGS
  async getAllSettings() {
    try {
      const url = `${this.baseURL}/user-settings/`;
      const backendData = await this.makeAuthenticatedRequest(url, { method: 'GET' });
      
      const frontendData = this.mapBackendToFrontend(backendData);
      console.log('✅ Settings mapped successfully:', frontendData);
      
      return frontendData;
    } catch (error) {
      console.error('❌ Failed to fetch settings:', error.message);
      throw error;
    }
  }

  // ✅ UPDATE NOTIFICATION SETTINGS
  async updateNotificationSettings(frontendData) {
    try {
      const url = `${this.baseURL}/user-settings/notifications`;
      const backendData = this.mapFrontendToBackend(frontendData, 'notifications');
      
      console.log('📤 Sending notification data:', backendData);
      
      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
    } catch (error) {
      console.error('❌ Failed to update notifications:', error.message);
      throw error;
    }
  }

  // ✅ UPDATE PERSONALIZATION SETTINGS
  async updatePersonalizationSettings(frontendData) {
    try {
      const url = `${this.baseURL}/user-settings/personalization`;
      const backendData = this.mapFrontendToBackend(frontendData, 'personalization');
      
      console.log('📤 Sending personalization data:', backendData);
      
      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(backendData),
      });
    } catch (error) {
      console.error('❌ Failed to update personalization:', error.message);
      throw error;
    }
  }

  // ✅ TOGGLE 2FA
  async toggle2FA(enabled) {
    try {
      const url = `${this.baseURL}/user-settings/security/2fa`;
      return await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ is_2fa_enabled: enabled }),
      });
    } catch (error) {
      console.error('❌ Failed to toggle 2FA:', error.message);
      throw error;
    }
  }

  // ✅ DEBUG TOKENS
  async debugTokens() {
    console.log('🔍 Checking stored tokens:');
    const keysToCheck = ['accessToken', 'refreshToken', 'userId', 'userEmail'];
    
    for (const key of keysToCheck) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        if (key.includes('Token')) {
          console.log(`✅ ${key}: ${value.substring(0, 30)}...`);
        } else {
          console.log(`✅ ${key}: ${value}`);
        }
      } else {
        console.log(`❌ ${key}: Not found`);
      }
    }
  }
}

// Export singleton instance
export const userSettingsAPI = new UserSettingsAPI();
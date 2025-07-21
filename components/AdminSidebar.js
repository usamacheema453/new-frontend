// components/AdminSidebar.js

import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Users, BarChart3, CreditCard, ArrowLeft, Settings, LogOut, FileText } from 'lucide-react-native'

export default function AdminSidebar({ activeTab, onTabChange }) {
  const navigation = useNavigation()
  
  // Add hover state management
  const [hoveredItem, setHoveredItem] = useState(null)

  const menuItems = [
    {
      id: 'team-members',
      label: 'Team Members',
      icon: Users,
      description: 'Manage team users and roles',
    },
    {
      id: 'usage-stats',
      label: 'Usage Stats',
      icon: BarChart3,
      description: 'Monitor query usage and analytics',
    },
    {
      id: 'plan-management',
      label: 'Plan Management',
      icon: CreditCard,
      description: 'Manage subscription and billing',
    },
    {
      id: 'document-management',
      label: 'Document Management',
      icon: FileText,
      description: 'Manage documents and team access',
    },
  ]

  const handleLogout = async () => {
    try {
      // Clear authentication-related items
      await Promise.all([
        localStorage.removeItem('isAuthenticated'),
        localStorage.removeItem('userRole'),
        localStorage.removeItem('userPlan'),
        localStorage.removeItem('userEmail'),
        localStorage.removeItem('userName'),
      ])
    } catch {}
    navigation.navigate('Home')
  }

  return (
    <View style={styles.container}>
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <View style={styles.logoBox}>
          <Image 
            source={require('../assets/SuperEngineer_Logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <View>
          <Text style={styles.logoText}>Super Engineer</Text>
          <Text style={styles.logoSubtitle}>Admin Portal</Text>
        </View>
      </View>

      {/* Navigation Items */}
      <ScrollView style={styles.navSection} contentContainerStyle={styles.navContent}>
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          const isHovered = hoveredItem === item.id

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onTabChange(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              style={[
                styles.navItem,
                isActive && styles.navItemActive,
                isHovered && !isActive && styles.navItemHover,
                isHovered && isActive && styles.navItemActiveHover,
              ]}
            >
              <Icon
                size={20}
                color={isActive ? '#FFFFFF' : '#374151'}
                style={styles.navIcon}
              />
              <View style={styles.navTextContainer}>
                <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.navDescription,
                    isActive ? styles.navDescriptionActive : styles.navDescriptionInactive,
                  ]}
                >
                  {item.description}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Bottom Actions */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat')}
          onMouseEnter={() => setHoveredItem('back-to-chat')}
          onMouseLeave={() => setHoveredItem(null)}
          style={[
            styles.bottomButton,
            hoveredItem === 'back-to-chat' && styles.bottomButtonHover
          ]}
        >
          <ArrowLeft size={16} color="#374151" style={styles.bottomIcon} />
          <Text style={styles.bottomText}>Back to Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          onMouseEnter={() => setHoveredItem('settings')}
          onMouseLeave={() => setHoveredItem(null)}
          style={[
            styles.bottomButton,
            hoveredItem === 'settings' && styles.bottomButtonHover
          ]}
        >
          <Settings size={16} color="#374151" style={styles.bottomIcon} />
          <Text style={styles.bottomText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleLogout} 
          onMouseEnter={() => setHoveredItem('logout')}
          onMouseLeave={() => setHoveredItem(null)}
          style={[
            styles.logoutButton,
            hoveredItem === 'logout' && styles.logoutButtonHover
          ]}
        >
          <LogOut size={16} color="#DC2626" style={styles.bottomIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const SIDEBAR_WIDTH = 280
const { height: SCREEN_HEIGHT } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    width: SIDEBAR_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    height: SCREEN_HEIGHT,
    flexDirection: 'column',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.1,
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginTop: 2,
  },
  navSection: {
    flex: 1,
    paddingHorizontal: 12,
  },
  navContent: {
    paddingVertical: 12,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: '#000000',
  },
  navItemHover: {
    backgroundColor: '#F9FAFB',
    transform: [{ scale: 1.01 }],
  },
  navItemActiveHover: {
    backgroundColor: '#1F2937',
    transform: [{ scale: 1.01 }],
  },
  navIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  navTextContainer: {
    flex: 1,
  },
  navLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
  navDescription: {
    fontSize: 11,
    lineHeight: 14,
  },
  navDescriptionInactive: {
    color: '#6B7280',
  },
  navDescriptionActive: {
    color: '#CCCCCC',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  bottomSection: {
    padding: 20,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  bottomButtonHover: {
    backgroundColor: '#F9FAFB',
    transform: [{ scale: 1.01 }],
  },
  bottomIcon: {
    marginRight: 10,
  },
  bottomText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  logoutButtonHover: {
    backgroundColor: '#FEF2F2',
    transform: [{ scale: 1.01 }],
  },
  logoutText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
})
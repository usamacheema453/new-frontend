// screens/AdminDashboard.js
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Shield, Monitor } from 'lucide-react-native'

// Import sidebar and screen components
import AdminSidebar from '../components/AdminSidebar'
import TeamUserTable from './TeamUserTable'
import UsageStatsCard from './UsageStatsCard'
import PlanManagement from './PlanManagement'
import DocumentManagement from './DocumentManagement'
import ManageFacilityMode from './ManageLocationMode'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState('team-members')
  const [userRole, setUserRole] = useState('')
  const [userPlan, setUserPlan] = useState('')
  const navigation = useNavigation()

  useEffect(() => {
    async function checkAuth() {
      try {
        const auth = await AsyncStorage.getItem('isAuthenticated')
        const role = (await AsyncStorage.getItem('userRole')) || 'user'
        const plan = (await AsyncStorage.getItem('userPlan')) || 'free'

        if (!auth) {
          navigation.navigate('Login')
          return
        }

        setIsAuthenticated(true)
        setUserRole(role)
        setUserPlan(plan)

        const hasAdminAccess = role === 'team_admin' && plan === 'team'
        setIsAuthorized(hasAdminAccess)

        if (!hasAdminAccess) {
          navigation.navigate('Chat')
          return
        }
      } catch (e) {
        console.error('Auth check error:', e)
      }
    }

    checkAuth()

    const handleResize = () => {
      const width = Dimensions.get('window').width
      setIsMobile(width < 768)
    }

    handleResize()
    const sub = Dimensions.addEventListener('change', handleResize)

    return () => {
      if (sub && sub.remove) {
        sub.remove()
      }
    }
  }, [navigation])

  if (!isAuthenticated) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color="#000" style={styles.loader} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  if (!isAuthorized) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.card}>
          <Shield size={64} color="#EF4444" style={styles.iconCenter} />
          <Text style={styles.forbiddenTitle}>403 - Access Forbidden</Text>
          <Text style={styles.forbiddenText}>
            You don't have permission to access the Admin Portal. This feature is only available for Team Admins on the
            Team Plan.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Chat')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Go to Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (isMobile) {
    return (
      <View style={styles.centerScreen}>
        <View style={styles.card}>
          <Monitor size={64} color="#6B7280" style={styles.iconCenter} />
          <Text style={styles.forbiddenTitle}>Desktop Only</Text>
          <Text style={styles.forbiddenText}>
            Admin Portal is available only on the desktop version of the app. Please access this page from a computer or
            laptop.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Chat')}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Go to Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'team-members':
        return <TeamUserTable />
      case 'usage-stats':
        return <UsageStatsCard />
      case 'plan-management':
        return <PlanManagement />
      case 'document-management':
        return <DocumentManagement />
      case 'facility-mode':
        return <ManageFacilityMode />
      default:
        return (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Select a section from the sidebar</Text>
          </View>
        )
    }
  }

  return (
    <View style={styles.container}>
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <View style={styles.mainContent}>
        {renderContent()}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
  },
  mainContent: {
    flex: 1,
    overflow: 'hidden',
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loader: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    maxWidth: 360,
    width: '100%',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  iconCenter: {
    marginBottom: 16,
  },
  forbiddenTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  forbiddenText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#000000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 20,
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },
})

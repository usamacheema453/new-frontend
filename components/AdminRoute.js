// components/AdminRoute.js

import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function AdminRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    async function checkAdmin() {
      const auth = await AsyncStorage.getItem('isAuthenticated')
      const role = (await AsyncStorage.getItem('userRole')) || 'user'
      const plan = (await AsyncStorage.getItem('userPlan')) || 'free'

      if (!auth) {
        navigation.navigate('Login')
        return
      }

      const hasAdminAccess = role === 'team_admin' && plan === 'team'
      if (!hasAdminAccess) {
        navigation.navigate('Chat')
        return
      }

      setIsAuthorized(true)
      setIsLoading(false)
    }
    checkAdmin()
  }, [navigation])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return isAuthorized ? <>{children}</> : null
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#000000',
  },
})

// components/ProtectedRoute.js

import React, { useState, useEffect } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const navigation = useNavigation()

  useEffect(() => {
    async function checkAuth() {
      const auth = await AsyncStorage.getItem('isAuthenticated')
      if (!auth) {
        navigation.navigate('Login')
        return
      }
      setIsAuthenticated(true)
      setIsLoading(false)
    }
    checkAuth()
  }, [navigation])

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return isAuthenticated ? <>{children}</> : null
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

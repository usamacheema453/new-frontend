// components/chatpage/PointsScore.js
// Real-time scoring system with four-digit zero-padded display + floating notifications

import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated 
} from 'react-native';

const PointsScore = forwardRef(({ 
  initialPoints = 0, 
  isCollapsed = false,
  AsyncStorage = null,
  style,
  onScoreUpdate // Callback when score changes
}, ref) => {
  const [points, setPoints] = useState(initialPoints);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Animation values for visual feedback
  const scaleAnim = new Animated.Value(1);
  
  // 🆕 NEW: Floating point increment notification
  const [showIncrement, setShowIncrement] = useState(false);
  const [incrementText, setIncrementText] = useState('');
  const [incrementOpacity] = useState(new Animated.Value(0));
  const [incrementTranslateY] = useState(new Animated.Value(0));

  // Load points from storage on component mount
  useEffect(() => {
    loadPoints();
  }, []);

  const loadPoints = async () => {
    try {
      if (AsyncStorage) {
        const savedPoints = await AsyncStorage.getItem('userPoints');
        if (savedPoints !== null) {
          const loadedPoints = parseInt(savedPoints, 10);
          setPoints(isNaN(loadedPoints) ? 0 : loadedPoints);
        }
      }
    } catch (error) {
      console.error('Error loading points:', error);
    }
  };

  const savePoints = async (newPoints) => {
    try {
      if (AsyncStorage) {
        await AsyncStorage.setItem('userPoints', newPoints.toString());
      }
    } catch (error) {
      console.error('Error saving points:', error);
    }
  };

  // Animate score update for visual feedback
  const animateScoreUpdate = () => {
    setIsAnimating(true);
    
    // Simple scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsAnimating(false);
    });
  };

  // 🆕 NEW: Show floating increment notification
  const showIncrementNotification = (increment) => {
    // Set the increment text
    setIncrementText(`+${increment}`);
    setShowIncrement(true);
    
    // Reset animation values
    incrementOpacity.setValue(0);
    incrementTranslateY.setValue(0);
    
    // Animate the floating notification
    Animated.parallel([
      // Fade in, then fade out
      Animated.sequence([
        Animated.timing(incrementOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1000), // Stay visible for 1 second
        Animated.timing(incrementOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Float upward
      Animated.timing(incrementTranslateY, {
        toValue: -25,
        duration: 1800, // Total animation duration
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hide the notification after animation completes
      setShowIncrement(false);
      setIncrementText('');
    });
  };

  // Function to add points (called after animation completes)
  const addPoints = (pointsToAdd, sourcePosition = null) => {
    const newPoints = points + pointsToAdd;
    setPoints(newPoints);
    savePoints(newPoints);
    
    // Trigger visual feedback
    animateScoreUpdate();
    
    // 🆕 NEW: Show floating increment notification
    showIncrementNotification(pointsToAdd);
    
    // Notify parent component
    if (onScoreUpdate) {
      onScoreUpdate(newPoints, pointsToAdd, sourcePosition);
    }
    
    console.log(`🎯 Points added: +${pointsToAdd} (Total: ${newPoints})`);
  };

  // Function to subtract points
  const subtractPoints = (pointsToSubtract) => {
    const newPoints = Math.max(0, points - pointsToSubtract);
    setPoints(newPoints);
    savePoints(newPoints);
    
    if (onScoreUpdate) {
      onScoreUpdate(newPoints, -pointsToSubtract);
    }
  };

  // Function to set points directly
  const updatePoints = (newPoints) => {
    const validPoints = Math.max(0, isNaN(newPoints) ? 0 : newPoints);
    setPoints(validPoints);
    savePoints(validPoints);
    
    if (onScoreUpdate) {
      onScoreUpdate(validPoints, 0);
    }
  };

  // Function to reset points
  const resetPoints = () => {
    setPoints(0);
    savePoints(0);
    
    if (onScoreUpdate) {
      onScoreUpdate(0, -points);
    }
  };

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    addPoints,
    subtractPoints,
    updatePoints,
    resetPoints,
    getPoints: () => points,
    isAnimating: () => isAnimating,
  }));

  // Format points as four-digit zero-padded integer (CHANGED: was decimal, now integer)
  const formatPoints = (pointValue) => {
    const validPoints = isNaN(pointValue) ? 0 : Math.max(0, Math.floor(pointValue));
    return String(validPoints).padStart(4, '0');
  };

  if (isCollapsed) {
    // Show prominent score in collapsed sidebar (KEPT ORIGINAL STYLE)
    return (
      <View style={[style, { position: 'relative' }]}>
        <Animated.View 
          style={[
            styles.collapsedContainer,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <Text style={styles.collapsedPointsText}>
            {formatPoints(points)}
          </Text>
        </Animated.View>
        
        {/* 🆕 NEW: Floating increment notification for collapsed view */}
        {showIncrement && (
          <Animated.View
            style={[
              styles.floatingIncrementCollapsed,
              {
                opacity: incrementOpacity,
                transform: [{ translateY: incrementTranslateY }],
              },
            ]}
          >
            <Text style={styles.floatingIncrementTextCollapsed}>
              {incrementText}
            </Text>
          </Animated.View>
        )}
      </View>
    );
  }

  // KEPT ORIGINAL STYLE - just showing "Points: XXXX"
  return (
    <View style={[style, { position: 'relative' }]}>
      <Animated.View 
        style={[
          styles.container,
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        <Text style={styles.pointsText}>
          Points: {formatPoints(points)}
        </Text>
      </Animated.View>
      
      {/* 🆕 NEW: Floating increment notification for expanded view */}
      {showIncrement && (
        <Animated.View
          style={[
            styles.floatingIncrement,
            {
              opacity: incrementOpacity,
              transform: [{ translateY: incrementTranslateY }],
            },
          ]}
        >
          <Text style={styles.floatingIncrementText}>
            {incrementText}
          </Text>
        </Animated.View>
      )}
    </View>
  );
});

// KEPT ORIGINAL STYLES + added floating notification styles
const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'left',
  },
  // Enhanced collapsed state styles (KEPT ORIGINAL)
  collapsedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    minWidth: 52,
    minHeight: 36,
    borderWidth: 1,
    borderColor: '#1f1f1f',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  collapsedPointsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  // 🆕 NEW: Floating increment notification styles
  floatingIncrement: {
    position: 'absolute',
    top: -8,
    right: -15,
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  floatingIncrementText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  floatingIncrementCollapsed: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  floatingIncrementTextCollapsed: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default PointsScore;
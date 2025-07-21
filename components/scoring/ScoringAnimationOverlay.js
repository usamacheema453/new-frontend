// components/scoring/ScoringAnimationOverlay.js
// Real-time scoring system with flying animations
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Sparkles, Star, Zap } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Animation types and their configurations
const ANIMATION_TYPES = {
  SUBMIT_PROMPT: {
    points: 1,
    icon: Zap,
    color: '#3B82F6',
    label: '+1',
  },
  GENERATE_MEME: {
    points: 2,
    icon: Sparkles,
    color: '#F59E0B',
    label: '+2',
  },
  UPLOAD_BRAIN: {
    points: 3,
    icon: Star,
    color: '#10B981',
    label: '+3',
  },
};

const ScoringAnimationOverlay = forwardRef(({ 
  targetPosition = { x: 50, y: 100 }, // Default sidebar position
  onPointsAwarded,
  isVisible = true 
}, ref) => {
  const [animations, setAnimations] = useState([]);
  const animationId = useRef(0);

  // Trigger animation from source to target
  const triggerAnimation = (type, sourcePosition) => {
    if (!ANIMATION_TYPES[type]) return;

    const config = ANIMATION_TYPES[type];
    const id = ++animationId.current;

    // Create animation values
    const positionX = new Animated.Value(sourcePosition.x);
    const positionY = new Animated.Value(sourcePosition.y);
    const scale = new Animated.Value(0);
    const opacity = new Animated.Value(1);
    const rotation = new Animated.Value(0);

    const newAnimation = {
      id,
      type,
      config,
      sourcePosition,
      positionX,
      positionY,
      scale,
      opacity,
      rotation,
      isComplete: false,
    };

    setAnimations(prev => [...prev, newAnimation]);

    // Start the animation sequence
    startAnimationSequence(newAnimation);
  };

  const startAnimationSequence = (animation) => {
    const { positionX, positionY, scale, opacity, rotation, config } = animation;

    // Phase 1: Spawn and scale up
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    // Phase 2: Fly to target with bezier curve effect
    const midPointX = (animation.sourcePosition.x + targetPosition.x) / 2;
    const midPointY = Math.min(animation.sourcePosition.y, targetPosition.y) - 50;

    // Create a curved path animation
    Animated.sequence([
      // Small delay for spawn effect
      Animated.delay(300),
      
      // Fly to target
      Animated.parallel([
        // Curved path to target
        Animated.timing(positionX, {
          toValue: targetPosition.x,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(positionY, {
          toValue: targetPosition.y,
          duration: 1000,
          useNativeDriver: false,
        }),
        // Scale down as it approaches target
        Animated.timing(scale, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      
      // Phase 3: Final impact effect
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ])
    ]).start(() => {
      // Animation complete - notify parent and remove
      if (onPointsAwarded) {
        onPointsAwarded(config.points, animation.type);
      }
      
      setAnimations(prev => prev.filter(a => a.id !== animation.id));
    });
  };

  // Clean up animations on unmount
  useEffect(() => {
    return () => {
      setAnimations([]);
    };
  }, []);

  // Expose trigger method to parent components
  useImperativeHandle(ref, () => ({
    triggerAnimation,
    clearAnimations: () => setAnimations([]),
  }));

  if (!isVisible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {animations.map((animation) => {
        const IconComponent = animation.config.icon;
        
        return (
          <Animated.View
            key={animation.id}
            style={[
              styles.animationContainer,
              {
                left: animation.positionX,
                top: animation.positionY,
                transform: [
                  { scale: animation.scale },
                  {
                    rotate: animation.rotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
                opacity: animation.opacity,
              },
            ]}
          >
            {/* Glow effect */}
            <View style={[
              styles.glowEffect,
              { backgroundColor: animation.config.color }
            ]} />
            
            {/* Icon */}
            <View style={[
              styles.iconContainer,
              { backgroundColor: animation.config.color }
            ]}>
              <IconComponent size={16} color="#FFFFFF" />
            </View>
            
            {/* Points label */}
            <View style={styles.pointsLabel}>
              <Text style={[
                styles.pointsText,
                { color: animation.config.color }
              ]}>
                {animation.config.label}
              </Text>
            </View>
            
            {/* Trailing particles */}
            <View style={styles.trailContainer}>
              {[...Array(3)].map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.trailParticle,
                    {
                      backgroundColor: animation.config.color,
                      opacity: animation.opacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 0.6 - i * 0.2],
                      }),
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
});

// Scoring Manager Hook - Use this in your main components
export const useScoringManager = (pointsScoreRef, targetPosition) => {
  const animationRef = useRef(null);

  const awardPoints = (type, sourcePosition) => {
    if (animationRef.current) {
      animationRef.current.triggerAnimation(type, sourcePosition);
    }
  };

  const handlePointsAwarded = (points, type) => {
    if (pointsScoreRef?.current) {
      pointsScoreRef.current.addPoints(points);
    }
  };

  return {
    animationRef,
    awardPoints,
    handlePointsAwarded,
    ScoringOverlay: (props) => (
      <ScoringAnimationOverlay
        ref={animationRef}
        targetPosition={targetPosition}
        onPointsAwarded={handlePointsAwarded}
        {...props}
      />
    ),
  };
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9998,
    elevation: 9,
  },
  animationContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    marginLeft: -30,
    marginTop: -30,
  },
  glowEffect: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.3,
    ...Platform.select({
      web: {
        filter: 'blur(8px)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pointsLabel: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  trailContainer: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailParticle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    marginLeft: -2,
    marginTop: -2,
  },
});

export default ScoringAnimationOverlay;
export { ANIMATION_TYPES };
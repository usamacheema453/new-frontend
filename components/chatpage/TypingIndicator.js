import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Switch,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';

const { width } = Dimensions.get('window');

const TypingIndicator = ({ 
  tool = null, 
  message = null,
  style = {},
  showProgress = false 
}) => {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  
  // Animation values for dots
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Animated dots visual effect
  useEffect(() => {
    const createDotAnimation = (dotOpacity, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(dotOpacity, {
            toValue: 1,
            duration: 400,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(dotOpacity, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const dot1Anim = createDotAnimation(dot1Opacity, 0);
    const dot2Anim = createDotAnimation(dot2Opacity, 200);
    const dot3Anim = createDotAnimation(dot3Opacity, 400);

    dot1Anim.start();
    dot2Anim.start();
    dot3Anim.start();

    return () => {
      dot1Anim.stop();
      dot2Anim.stop();
      dot3Anim.stop();
    };
  }, []);

  // Progress bar for ninja mode
  useEffect(() => {
    if (tool === 'ninja' && showProgress) {
      const duration = 120000; // 2 minutes
      const increment = 100 / (duration / 1000); // % per second
      
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + increment;
          const finalProgress = newProgress >= 95 ? 95 : newProgress;
          
          // Animate progress bar
          Animated.timing(progressWidth, {
            toValue: finalProgress,
            duration: 1000,
            useNativeDriver: false,
          }).start();
          
          return finalProgress;
        });
      }, 1000);

      return () => clearInterval(progressInterval);
    }
  }, [tool, showProgress]);

  // Get appropriate message and styling based on tool
  const getToolConfig = () => {
    switch (tool) {
      case 'ninja':
        return {
          icon: '🥷',
          title: 'Ninja Mode',
          subtitle: 'Advanced reasoning in progress',
          colors: {
            background: '#f3e8ff',
            border: '#e9d5ff',
            dot: '#a855f7',
            text: '#7c3aed',
            progressBar: '#a855f7',
            progressBg: '#e9d5ff',
            infoBox: '#faf5ff',
          },
          estimatedTime: '30-120 seconds'
        };
      case 'location':
        return {
          icon: '📍',
          title: 'Location Mode',
          subtitle: 'Analyzing UK-specific guidance',
          colors: {
            background: '#dbeafe',
            border: '#bfdbfe',
            dot: '#3b82f6',
            text: '#1d4ed8',
            progressBar: '#3b82f6',
            progressBg: '#bfdbfe',
            infoBox: '#eff6ff',
          },
          estimatedTime: '5-15 seconds'
        };
      case 'meme':
        return {
          icon: '😄',
          title: 'Meme Mode',
          subtitle: 'Crafting technical comedy',
          colors: {
            background: '#dcfce7',
            border: '#bbf7d0',
            dot: '#22c55e',
            text: '#15803d',
            progressBar: '#22c55e',
            progressBg: '#bbf7d0',
            infoBox: '#f0fdf4',
          },
          estimatedTime: '5-10 seconds'
        };
      default:
        return {
          icon: '🤖',
          title: 'Super Engineer',
          subtitle: 'Processing your request',
          colors: {
            background: '#f3f4f6',
            border: '#e5e7eb',
            dot: '#6b7280',
            text: '#374151',
            progressBar: '#6b7280',
            progressBg: '#e5e7eb',
            infoBox: '#f9fafb',
          },
          estimatedTime: '5-15 seconds'
        };
    }
  };

  const config = getToolConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.colors.background, borderColor: config.colors.border }, style]}>
      {/* AI Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>{config.icon}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: config.colors.text }]}>
              {config.title}
            </Text>
            <Text style={[styles.subtitle, { color: config.colors.text }]}>
              {config.subtitle}
            </Text>
          </View>
          <Text style={[styles.time, { color: config.colors.text }]}>
            ~{config.estimatedTime}
          </Text>
        </View>

        {/* Message preview if provided */}
        {message && (
          <Text style={[styles.messagePreview, { color: config.colors.text }]}>
            "{message.length > 50 ? message.substring(0, 50) + '...' : message}"
          </Text>
        )}

        {/* Animated dots */}
        <View style={styles.thinkingContainer}>
          <Text style={[styles.thinkingText, { color: config.colors.text }]}>Thinking</Text>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { backgroundColor: config.colors.dot, opacity: dot1Opacity }]} />
            <Animated.View style={[styles.dot, { backgroundColor: config.colors.dot, opacity: dot2Opacity }]} />
            <Animated.View style={[styles.dot, { backgroundColor: config.colors.dot, opacity: dot3Opacity }]} />
          </View>
          <Text style={[styles.dotsText, { color: config.colors.text }]}>
            {dots}
          </Text>
        </View>

        {/* Progress bar for ninja mode */}
        {tool === 'ninja' && showProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBarBg, { backgroundColor: config.colors.progressBg }]}>
              <Animated.View 
                style={[
                  styles.progressBar, 
                  { 
                    backgroundColor: config.colors.progressBar,
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp',
                    })
                  }
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: config.colors.text }]}>
              Advanced reasoning: {Math.round(progress)}% complete
            </Text>
          </View>
        )}

        {/* Ninja mode extra info */}
        {tool === 'ninja' && (
          <View style={[styles.infoBox, { backgroundColor: config.colors.infoBox }]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⚡</Text>
              <Text style={[styles.infoText, { color: config.colors.text }]}>
                Using advanced reasoning capabilities
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🧠</Text>
              <Text style={[styles.infoText, { color: config.colors.text }]}>
                Deep analysis may take up to 2 minutes
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

// Usage examples component for testing
const TypingIndicatorDemo = () => {
  const [activeDemo, setActiveDemo] = useState('ninja');
  const [showProgress, setShowProgress] = useState(true);

  const demos = [
    { tool: 'ninja', message: 'How to default G800 alarm system?' },
    { tool: 'location', message: 'UK electrical standards for alarm installation' },
    { tool: 'meme', message: 'Why is my alarm always going off?' },
    { tool: null, message: 'Standard troubleshooting help' }
  ];

  const isMobile = width < 768;

  return (
    <ScrollView style={styles.demoContainer}>
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>Typing Indicator Demo</Text>
        
        {/* Controls */}
        <View style={styles.controlsContainer}>
          {demos.map((demo, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setActiveDemo(demo.tool)}
              style={[
                styles.controlButton,
                activeDemo === demo.tool && styles.controlButtonActive
              ]}
            >
              <Text style={[
                styles.controlButtonText,
                activeDemo === demo.tool && styles.controlButtonTextActive
              ]}>
                {demo.tool || 'default'} mode
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress toggle for ninja mode */}
        {activeDemo === 'ninja' && (
          <View style={styles.switchContainer}>
            <Switch
              value={showProgress}
              onValueChange={setShowProgress}
              trackColor={{ false: '#e5e7eb', true: '#a855f7' }}
              thumbColor={showProgress ? '#ffffff' : '#f3f4f6'}
            />
            <Text style={styles.switchLabel}>Show progress bar</Text>
          </View>
        )}

        {/* Active demo */}
        <TypingIndicator
          tool={activeDemo}
          message={demos.find(d => d.tool === activeDemo)?.message}
          showProgress={showProgress && activeDemo === 'ninja'}
        />
      </View>

      <View style={styles.instructionsCard}>
        <Text style={styles.instructionsTitle}>Integration Instructions</Text>
        <View style={styles.instructionsContent}>
          <Text style={styles.instructionText}>1. Import the TypingIndicator component</Text>
          <Text style={styles.instructionText}>2. Show it when isLoading is true</Text>
          <Text style={styles.instructionText}>3. Pass the current tool and user message</Text>
          <Text style={styles.instructionText}>4. Hide it when response arrives</Text>
        </View>
        
        <View style={styles.codeBlock}>
          <Text style={styles.codeText}>
{`// In your MessagesList component
{isLoading && (
  <TypingIndicator 
    tool={selectedTool}
    message={lastUserMessage}
    showProgress={selectedTool === 'ninja'}
  />
)}`}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Main component styles
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 8,
    ...Platform.select({
      web: {
        maxWidth: 768,
        marginHorizontal: 'auto',
      },
    }),
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.75,
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 8,
  },
  messagePreview: {
    fontSize: 14,
    opacity: 0.6,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  thinkingText: {
    fontSize: 14,
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  dotsText: {
    fontSize: 14,
    minWidth: 24,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.75,
  },
  infoBox: {
    borderRadius: 8,
    padding: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoIcon: {
    marginRight: 6,
    fontSize: 12,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },

  // Demo component styles
  demoContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  demoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#111827',
  },
  controlsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  controlButton: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  controlButtonActive: {
    backgroundColor: '#3b82f6',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  controlButtonTextActive: {
    color: '#ffffff',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    marginLeft: 8,
    color: '#374151',
  },
  instructionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111827',
  },
  instructionsContent: {
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  codeBlock: {
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
    padding: 12,
  },
  codeText: {
    fontSize: 12,
    fontFamily: Platform.select({
      ios: 'Courier',
      android: 'monospace',
      web: 'monospace',
    }),
    color: '#374151',
  },
});

export default TypingIndicator;
export { TypingIndicatorDemo };
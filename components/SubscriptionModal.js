// components/SubscriptionModal.js
// CLEAN VERSION - Consistent with PricingScreen design

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  useWindowDimensions,
  Switch as RNSwitch,
  Platform,
} from 'react-native';
import {
  Check,
  Heart,     // for Free plan
  User,      // single‐user silhouette for Solo
  Users,     // multi‐user for Teams
  Server,    // server rack for Enterprise
  XCircle,   // larger, more tappable close button
  Star,      // for the "Most Popular" badge
  Crown,
  Lock,
  Zap,
  Smile,
  MapPin,
  Brain,
  Camera,
  BookOpen,
  Building2,
  Shield,
} from 'lucide-react-native';
import EnterpriseContactModal from './EnterpriseContactModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import plan access control utilities
import {
  PLAN_INFO,
  FEATURES,
  FEATURE_DESCRIPTIONS,
  getUpgradeFeatures,
  hasFeatureAccess,
  getPlanFeatures,
} from '../utils/planAccessManager';

export default function SubscriptionModal({
  visible,
  onClose,
  currentPlan = 'free',
  highlightFeature = null, // Specific feature to highlight for upgrade
}) {
  const { width } = useWindowDimensions();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  // Enhanced plan configuration with consistent popular logic (matching PricingScreen)
  const allPlans = [
    {
      id: 'free',
      name: 'Free',
      icon: Heart,
      monthlyPrice: 0,
      yearlyPrice: 0,
      queries: '10 prompts/week',
      users: '1 user account',
      features: [
        'Basic Knowledge Base Development',
        'Essential AI Interaction',
        'Community Sharing',
        'Limited Uploads (3/month)',
        'Photos, Manuals & Documents',
      ],
      detailedFeatures: {
        chat: ['Basic chat responses', 'Community suggestions'],
        brain: ['Add to community only', '3 uploads per month'],
        tools: ['No advanced tools'],
        uploads: ['Photos 📸', 'Manuals 📚', 'Documents 📄', 'Community only'],
        queries: '10 prompts/week',
      },
      description: 'Perfect for getting started',
    },
    {
      id: 'solo',
      name: 'Solo',
      icon: User,
      monthlyPrice: 10,
      yearlyPrice: 108,
      queries: '250 queries/month',
      users: '1 user account',
      features: [
        'Personalized Responses',
        'Ninja Mode (Advanced Problem Solver)',
        'Meme Mode (Interactive Humor)',
        'Secure Personal Storage Space',
        'Advanced Knowledge Base Building',
        'Photo & Document Uploads',
      ],
      description: 'Ideal for individual power users',
      detailedFeatures: {
        chat: ['Advanced AI responses', 'Ninja Mode 🥷', 'Meme Mode 😄'],
        brain: ['Private brain storage 🔒', 'Community sharing', 'All upload types'],
        tools: ['Ninja Mode', 'Meme Mode'],
        uploads: ['Photos 📸', 'Manuals 📚', 'Documents 📄'],
        queries: '250 queries/month',
      }
    },
    {
      id: 'team',
      name: 'Team',
      icon: Users,
      monthlyPrice: 25,
      yearlyPrice: 270,
      queries: 'Unlimited queries',
      users: '1 Admin + up to 10 Team Members',
      features: [
        'Fully Personalized AI Responses',
        'Ninja Mode (Advanced Problem Solver)',
        'Meme Mode (Interactive Humor)',
        'Location Mode (Site Equipment Manager)',
        'Dedicated Secure Personal Storage Space',
        'Robust Admin Panel',
        'Integrated Document Management System',
        'Real-Time Team Monitoring & Insights',
        'Expanded Team Knowledge Base',
        'Organization-Wide Sharing',
      ],
      description: 'Built for growing teams',
      popular: true, // SIMPLE: Team is always popular (matching PricingScreen)
      detailedFeatures: {
        chat: ['All Solo features', 'Location Mode 📍', 'Unlimited queries ∞'],
        brain: ['Organization sharing 🏢', 'Team access controls 👥', 'Admin panel'],
        tools: ['Ninja Mode', 'Meme Mode', 'Location Mode'],
        uploads: ['All upload types', 'Team libraries', 'Version control'],
        queries: 'Unlimited',
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      icon: Server,
      monthlyPrice: null,
      yearlyPrice: null,
      queries: 'Unlimited queries & Full Customization',
      users: 'Customizable based on your requirements',
      features: [
        'All features from Team, plus:',
        'Custom AI Model Training',
        'Dedicated Support Manager',
        'SLA Guarantees',
        'Custom Integration Solutions',
        'Advanced Analytics Dashboard',
        'White-label Solutions',
        'Priority Feature Requests',
      ],
      custom: true,
      description: 'Enterprise-grade solution',
      detailedFeatures: {
        chat: ['Custom AI training', 'White-label solution', 'Priority support'],
        brain: ['Custom integrations', 'Advanced analytics', 'SLA guarantees'],
        tools: ['All tools + custom tools', 'API access', 'Custom workflows'],
        uploads: ['Unlimited storage', 'Custom formats', 'Enterprise security'],
        queries: 'Unlimited + Custom',
      }
    },
  ];

  const getAvailablePlans = () => {
    switch (currentPlan) {
      case 'free':
        return allPlans.filter(p => p.id !== 'free'); // Show upgrade options
      case 'solo':
        return allPlans.filter(p => p.id === 'team' || p.id === 'enterprise');
      case 'team':
        return allPlans.filter(p => p.id === 'enterprise');
      case 'enterprise':
        return []; // No upgrades available
      default:
        return allPlans;
    }
  };

  const availablePlans = getAvailablePlans();

  // Get features that would be unlocked by upgrading
  const getUpgradeHighlights = (planId) => {
    if (!highlightFeature) return [];
    
    const newFeatures = getUpgradeFeatures && getUpgradeFeatures(currentPlan, planId) || [];
    
    // Map features to user-friendly descriptions
    const highlights = [];
    
    if (newFeatures.includes(FEATURES?.NINJA_MODE)) {
      highlights.push({ icon: '🥷', text: 'Ninja Mode - Advanced problem solving' });
    }
    if (newFeatures.includes(FEATURES?.MEME_MODE)) {
      highlights.push({ icon: '😄', text: 'Meme Mode - Creative humor responses' });
    }
    if (newFeatures.includes(FEATURES?.LOCATION_MODE)) {
      highlights.push({ icon: '📍', text: 'Location Mode - Site equipment manager' });
    }
    if (newFeatures.includes(FEATURES?.BRAIN_PRIVATE_STORAGE)) {
      highlights.push({ icon: '🔒', text: 'Private Brain Storage - Secure personal space' });
    }
    if (newFeatures.includes(FEATURES?.UPLOAD_PHOTOS)) {
      highlights.push({ icon: '📸', text: 'Photo Uploads - Visual content analysis' });
    }
    if (newFeatures.includes(FEATURES?.UPLOAD_MANUALS)) {
      highlights.push({ icon: '📚', text: 'Manual Uploads - Documentation processing' });
    }
    if (newFeatures.includes(FEATURES?.BRAIN_ORGANIZATION_SHARING)) {
      highlights.push({ icon: '🏢', text: 'Organization Sharing - Company-wide access' });
    }
    if (newFeatures.includes(FEATURES?.UNLIMITED_QUERIES)) {
      highlights.push({ icon: '∞', text: 'Unlimited Queries - No monthly limits' });
    }
    
    return highlights;
  };

  const handleSelectPlan = async planId => {
    setSelectedPlan(planId);
    if (planId === 'enterprise') {
      setShowEnterpriseModal(true);
      return;
    }
    
    const plan = allPlans.find(p => p.id === planId);
    const price = plan.monthlyPrice === 0 ? 'Free' : `£${isYearly ? plan.yearlyPrice : plan.monthlyPrice}`;
    const period = plan.monthlyPrice === 0 ? '' : `/${isYearly ? 'year' : 'month'}`;
    
    // Get upgrade highlights
    const upgradeHighlights = getUpgradeHighlights(planId);
    const highlightText = upgradeHighlights.length > 0 
      ? `\n\nYou'll unlock:\n${upgradeHighlights.map(h => `${h.icon} ${h.text}`).join('\n')}`
      : '';
    
    Alert.alert(
      planId === 'free' ? 'Welcome to Free Plan' : 'Redirecting to Checkout',
      `You selected the ${plan.name} plan${plan.monthlyPrice === 0 ? '' : ` – ${price}${period}`}${highlightText}`,
      [
        {
          text: 'OK',
          onPress: async () => {
            setTimeout(async () => {
              await AsyncStorage.setItem('userPlan', planId);
              let queryLimit;
              switch (planId) {
                case 'free':
                  queryLimit = '10';
                  break;
                case 'solo':
                  queryLimit = '250';
                  break;
                case 'team':
                case 'enterprise':
                  queryLimit = '999';
                  break;
                default:
                  queryLimit = '10';
              }
              await AsyncStorage.setItem('freeQueries', queryLimit);
              setSelectedPlan(null);
              onClose();
            }, 2000);
          },
        },
      ]
    );
  };

  const handleEnterpriseSuccess = () => {
    setShowEnterpriseModal(false);
    onClose();
  };

  const getModalTitle = () => {
    if (highlightFeature) {
      const featureInfo = FEATURE_DESCRIPTIONS && FEATURE_DESCRIPTIONS[highlightFeature];
      if (featureInfo) {
        return `Upgrade to unlock ${featureInfo.name}`;
      }
    }
    
    switch (currentPlan) {
      case 'free':    return 'Upgrade Your Plan';
      case 'solo':    return 'Upgrade from Solo Plan';
      case 'team':   return 'Upgrade to Enterprise';
      case 'enterprise': return 'You\'re on Enterprise';
      default:        return 'Choose Your Plan';
    }
  };

  const getModalDescription = () => {
    if (highlightFeature) {
      const featureInfo = FEATURE_DESCRIPTIONS && FEATURE_DESCRIPTIONS[highlightFeature];
      if (featureInfo) {
        return featureInfo.description;
      }
    }
    
    switch (currentPlan) {
      case 'free':    return 'Unlock powerful features and increased usage limits';
      case 'solo':    return 'Scale up with team collaboration and unlimited queries';
      case 'team':   return 'Get enterprise-grade features and dedicated support';
      case 'enterprise': return 'You have access to all premium features';
      default:        return 'Choose the perfect plan for your needs';
    }
  };

  // Render feature comparison for a specific category
  const renderFeatureComparison = (category, title, icon) => {
    return (
      <View style={styles.featureComparisonSection}>
        <View style={styles.featureComparisonHeader}>
          {icon}
          <Text style={styles.featureComparisonTitle}>{title}</Text>
        </View>
        
        <View style={styles.featureComparisonGrid}>
          {availablePlans.map(plan => (
            <View key={plan.id} style={styles.featureComparisonColumn}>
              <Text style={styles.featureComparisonPlanName}>{plan.name}</Text>
              <View style={styles.featureComparisonItems}>
                {plan.detailedFeatures[category].map((feature, index) => (
                  <Text key={index} style={styles.featureComparisonItem}>
                    {feature}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // If user is on Enterprise and no upgrades available, show a success message
  if (currentPlan === 'enterprise' && availablePlans.length === 0) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { paddingHorizontal: 24 }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <XCircle size={28} color="#374151" />
            </TouchableOpacity>
            <View style={styles.enterpriseContent}>
              <Server size={64} color="#000" style={{ marginBottom: 16 }} />
              <Text style={styles.title}>You're on Enterprise</Text>
              <Text style={styles.description}>
                You have access to all premium features and unlimited usage.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const isWide = width >= 768;
  const horizontalPadding = 24;
  const innerWidth = width - horizontalPadding * 2;
  const maxCardWidth = 280;
  const cardMargin = 16;
  const count = availablePlans.length;

  let cardWidth;
  if (isWide && count > 1) {
    const totalMargin = cardMargin * (count - 1);
    const per = (innerWidth - totalMargin) / count;
    cardWidth = Math.min(per, maxCardWidth);
  } else {
    cardWidth = innerWidth;
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <View style={[styles.modalContainer, { paddingHorizontal: horizontalPadding }]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <XCircle size={28} color="#374151" />
            </TouchableOpacity>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.title}>{getModalTitle()}</Text>
              <Text style={styles.description}>{getModalDescription()}</Text>

              {/* Current Plan Badge */}
              {PLAN_INFO && (
                <View style={styles.currentPlanBadge}>
                  <Text style={styles.currentPlanIcon}>{PLAN_INFO[currentPlan]?.icon}</Text>
                  <Text style={styles.currentPlanText}>
                    Current: {PLAN_INFO[currentPlan]?.displayName}
                  </Text>
                </View>
              )}

              {/* Highlighted Feature Card */}
              {highlightFeature && FEATURE_DESCRIPTIONS && (
                <View style={styles.highlightedFeatureCard}>
                  <View style={styles.highlightedFeatureHeader}>
                    <Crown size={20} color="#F59E0B" />
                    <Text style={styles.highlightedFeatureTitle}>
                      Feature You're Trying to Access
                    </Text>
                  </View>
                  <View style={styles.highlightedFeatureContent}>
                    <Text style={styles.highlightedFeatureIcon}>
                      {FEATURE_DESCRIPTIONS[highlightFeature]?.icon || '🔒'}
                    </Text>
                    <View style={styles.highlightedFeatureText}>
                      <Text style={styles.highlightedFeatureName}>
                        {FEATURE_DESCRIPTIONS[highlightFeature]?.name || 'Premium Feature'}
                      </Text>
                      <Text style={styles.highlightedFeatureDescription}>
                        {FEATURE_DESCRIPTIONS[highlightFeature]?.description || 'Advanced functionality'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {availablePlans.some(p => p.monthlyPrice !== null && p.monthlyPrice > 0) && (
                <View style={styles.toggleRow}>
                  <Text style={[styles.toggleLabel, !isYearly && styles.toggleLabelActive]}>
                    Monthly
                  </Text>
                  <RNSwitch
                    value={isYearly}
                    onValueChange={setIsYearly}
                    trackColor={{ true: '#000', false: '#E5E7EB' }}
                    thumbColor="#FFF"
                    ios_backgroundColor="#E5E7EB"
                    style={styles.toggleSwitch}
                  />
                  <Text style={[styles.toggleLabel, isYearly && styles.toggleLabelActive]}>
                    Yearly
                  </Text>
                  {isYearly && (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>Save 10%</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={[styles.plansContainer, isWide && count > 1 ? styles.plansRow : styles.plansColumn]}>
                {availablePlans.map(plan => {
                  const Icon = plan.icon;
                  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
                  const upgradeHighlights = getUpgradeHighlights(plan.id);
                  
                  return (
                    <View
                      key={plan.id}
                      style={[
                        styles.planCard,
                        plan.popular && styles.popularBorder,
                        { width: cardWidth, marginHorizontal: isWide && count > 1 ? cardMargin / 2 : 0 },
                      ]}
                    >
                      {/* Popular Badge - CONSISTENT WITH PRICINGSCREEN */}
                      {plan.popular && (
                        <View style={styles.popularBadge}>
                          <Star size={12} color="#FFF" style={{ marginRight: 4 }} />
                          <Text style={styles.popularBadgeText}>Most Popular</Text>
                        </View>
                      )}

                      <View style={styles.planHeader}>
                        <View style={[styles.iconWrapper, plan.popular && styles.iconWrapperPopular]}>
                          <Icon size={32} color={plan.popular ? "#FFF" : "#000"} />
                        </View>

                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planDescription}>{plan.description}</Text>
                        {plan.custom ? (
                          <Text style={styles.customText}>Custom</Text>
                        ) : (
                          <>
                            <Text style={styles.planPrice}>
                              {price === 0 ? 'Free' : `£${price}`}
                            </Text>
                            {price > 0 && (
                              <Text style={styles.pricePeriod}>
                                per {isYearly ? 'year' : 'month'}
                              </Text>
                            )}
                          </>
                        )}
                        <Text style={styles.planQueries}>{plan.queries}</Text>
                        <Text style={styles.planUsers}>{plan.users}</Text>
                      </View>

                      {/* Upgrade Highlights */}
                      {upgradeHighlights.length > 0 && (
                        <View style={styles.upgradeHighlights}>
                          <Text style={styles.upgradeHighlightsTitle}>✨ You'll unlock:</Text>
                          {upgradeHighlights.slice(0, 3).map((highlight, index) => (
                            <View key={index} style={styles.upgradeHighlightItem}>
                              <Text style={styles.upgradeHighlightIcon}>{highlight.icon}</Text>
                              <Text style={styles.upgradeHighlightText}>{highlight.text}</Text>
                            </View>
                          ))}
                          {upgradeHighlights.length > 3 && (
                            <Text style={styles.upgradeHighlightsMore}>
                              +{upgradeHighlights.length - 3} more features
                            </Text>
                          )}
                        </View>
                      )}

                      <View style={styles.featuresList}>
                        {plan.features.map((f, i) => (
                          <View key={i} style={styles.featureRow}>
                            <Check size={16} color="#16A34A" style={styles.checkIcon} />
                            <Text style={styles.featureText}>{f}</Text>
                          </View>
                        ))}
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.selectButton,
                          plan.popular ? styles.selectButtonPopular : styles.selectButtonDefault,
                          selectedPlan === plan.id && styles.buttonDisabled,
                        ]}
                        onPress={() => handleSelectPlan(plan.id)}
                        disabled={selectedPlan === plan.id}
                      >
                        <Text
                          style={[
                            plan.popular ? styles.selectButtonTextPopular : styles.selectButtonTextDefault,
                          ]}
                        >
                          {selectedPlan === plan.id
                            ? 'Processing…'
                            : plan.custom
                            ? 'Contact Sales'
                            : plan.id === 'free'
                            ? 'Start Free'
                            : currentPlan === 'free'
                            ? 'Choose Plan'
                            : 'Upgrade Now'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Feature Comparison Section */}
              {availablePlans.length > 1 && (
                <View style={styles.featureComparisonContainer}>
                  <Text style={styles.featureComparisonMainTitle}>Compare Features</Text>
                  
                  {renderFeatureComparison('chat', 'AI Tools & Chat', <Zap size={20} color="#F59E0B" />)}
                  {renderFeatureComparison('brain', 'Knowledge Management', <Brain size={20} color="#8B5CF6" />)}
                  {renderFeatureComparison('uploads', 'Content Uploads', <Camera size={20} color="#10B981" />)}
                </View>
              )}

              <Text style={styles.footerText}>
                {currentPlan === 'free'
                  ? 'Start with our free plan or choose a paid plan for more features. Cancel anytime.'
                  : currentPlan === 'enterprise'
                  ? 'Contact your account manager for any plan changes.'
                  : 'Upgrade anytime. Changes take effect immediately.'}
              </Text>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <EnterpriseContactModal
        visible={showEnterpriseModal}
        onClose={() => setShowEnterpriseModal(false)}
        onSuccess={handleEnterpriseSuccess}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    maxHeight: '90%',
    paddingTop: 48,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 8,
  },
  content: { paddingVertical: 24 },
  enterpriseContent: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },

  // Current plan badge
  currentPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
    alignSelf: 'center',
  },
  currentPlanIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  currentPlanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
  },

  // Highlighted feature card
  highlightedFeatureCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  highlightedFeatureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightedFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  highlightedFeatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  highlightedFeatureIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  highlightedFeatureText: {
    flex: 1,
  },
  highlightedFeatureName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  highlightedFeatureDescription: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 10,
  },
  toggleLabelActive: { color: '#000', fontWeight: '600' },
  toggleSwitch: {
    transform: Platform.OS === 'android' ? [{ scale: 1.1 }] : undefined,
  },
  saveBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginLeft: 8,
  },
  saveBadgeText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  plansContainer: { justifyContent: 'center' },
  plansRow: { flexDirection: 'row' },
  plansColumn: { flexDirection: 'column' },
  planCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  // CONSISTENT WITH PRICINGSCREEN
  popularBorder: { 
    borderColor: '#000',
    borderWidth: 2,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    zIndex: 10,
    elevation: 10,
  },
  popularBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 16,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  iconWrapperPopular: {
    backgroundColor: '#000',
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  pricePeriod: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  customText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  planQueries: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
  planUsers: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },

  // Upgrade highlights
  upgradeHighlights: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  upgradeHighlightsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#15803D',
    marginBottom: 8,
  },
  upgradeHighlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  upgradeHighlightIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 20,
  },
  upgradeHighlightText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 16,
  },
  upgradeHighlightsMore: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },

  featuresList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checkIcon: { marginRight: 8, marginTop: 1 },
  featureText: {
    fontSize: 13,
    color: '#374151',
    flexShrink: 1,
    lineHeight: 18,
  },
  selectButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectButtonDefault: { backgroundColor: '#E5E7EB' },
  selectButtonPopular: { backgroundColor: '#000' },
  selectButtonTextDefault: {
    color: '#000',
    fontSize: 15,
    fontWeight: '600',
  },
  selectButtonTextPopular: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonDisabled: { opacity: 0.6 },

  // Feature comparison
  featureComparisonContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  featureComparisonMainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  featureComparisonSection: {
    marginBottom: 24,
  },
  featureComparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureComparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  featureComparisonGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  featureComparisonColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  featureComparisonPlanName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  featureComparisonItems: {
    alignItems: 'center',
  },
  featureComparisonItem: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 4,
    textAlign: 'center',
    lineHeight: 14,
  },

  footerText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
});
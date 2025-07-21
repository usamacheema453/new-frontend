// components/UpgradePrompt.js
// CLEAN VERSION - Consistent with PricingScreen design

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Dimensions,
} from 'react-native';
import {
  Crown,
  ArrowRight,
  X,
  Lock,
  Zap,
  Check,
  Star,
} from 'lucide-react-native';

import {
  PLAN_INFO,
  FEATURE_DESCRIPTIONS,
  getRequiredPlan,
  getUpgradeFeatures,
  getNextPlan,
  hasFeatureAccess,
} from '../utils/planAccessManager';

export default function UpgradePrompt({
  visible,
  onClose,
  onUpgrade,
  currentPlan = 'free',
  feature = null,
  title = null,
  description = null,
  features = null,
}) {
  const { width, height } = useWindowDimensions();
  const screenData = Dimensions.get('screen');
  const isWide = width >= 768;

  if (!visible) {
    return null;
  }

  // Determine what to show based on props
  const getPromptContent = () => {
    if (feature) {
      const requiredPlan = getRequiredPlan(feature);
      const featureInfo = FEATURE_DESCRIPTIONS[feature];
      
      return {
        title: `Upgrade to unlock ${featureInfo?.name || 'this feature'}`,
        description: featureInfo?.description || 'Unlock advanced functionality',
        targetPlan: requiredPlan,
        highlightFeatures: [feature],
      };
    } else {
      const nextPlan = getNextPlan(currentPlan);
      
      return {
        title: title || 'Upgrade Your Plan',
        description: description || 'Unlock powerful features and increased usage limits',
        targetPlan: nextPlan,
        highlightFeatures: features || [],
      };
    }
  };

  const promptContent = getPromptContent();
  const targetPlanInfo = PLAN_INFO[promptContent.targetPlan];
  const currentPlanInfo = PLAN_INFO[currentPlan];
  
  if (!targetPlanInfo) {
    return null;
  }

  // Plan configuration - CONSISTENT WITH PRICINGSCREEN
  const planConfigs = {
    solo: {
      id: 'solo',
      displayName: 'Solo',
      icon: '👤',
      price: { monthly: 10 },
      queryLimit: '250',
      queryPeriod: 'month',
      description: 'Ideal for individual power users',
      popular: false,
    },
    team: {
      id: 'team',
      displayName: 'Team',
      icon: '👥',
      price: { monthly: 25 },
      queryLimit: 'unlimited',
      queryPeriod: 'month',
      description: 'Built for growing teams',
      popular: true, // SIMPLE: Team is always popular (matching PricingScreen)
    },
    enterprise: {
      id: 'enterprise',
      displayName: 'Enterprise',
      icon: '🏢',
      price: 'custom',
      queryLimit: 'unlimited',
      queryPeriod: 'month',
      description: 'Enterprise-grade solution',
      popular: false,
    },
  };

  // Get available plans with simple logic
  const getAvailablePlans = () => {
    const plans = [];
    
    // Get base plans to show
    let plansToShow = [];
    switch (currentPlan) {
      case 'free':
        plansToShow = ['solo', 'team', 'enterprise'];
        break;
      case 'solo':
        plansToShow = ['team', 'enterprise'];
        break;
      case 'team':
        plansToShow = ['enterprise'];
        break;
      default:
        plansToShow = ['solo', 'team'];
    }

    // Filter by feature access if needed
    if (feature && hasFeatureAccess) {
      plansToShow = plansToShow.filter(planId => hasFeatureAccess(planId, feature));
    }
    
    // Create plan objects using both sources (PLAN_INFO fallback to planConfigs)
    plansToShow.forEach((planId) => {
      const planInfo = PLAN_INFO?.[planId] || planConfigs[planId];
      if (!planInfo) return;
      
      plans.push({
        id: planId,
        ...planInfo,
        // Team is always popular when available (consistent with PricingScreen)
        popular: planId === 'team',
      });
    });
    
    // Sort by plan hierarchy
    const planOrder = { solo: 1, team: 2, enterprise: 3 };
    plans.sort((a, b) => planOrder[a.id] - planOrder[b.id]);
    
    return plans;
  };

  const availablePlans = getAvailablePlans();
  
  // Get features that would be unlocked
  const newFeatures = getUpgradeFeatures && getUpgradeFeatures(currentPlan, promptContent.targetPlan) || [];
  const displayFeatures = promptContent.highlightFeatures.length > 0 
    ? promptContent.highlightFeatures 
    : newFeatures.slice(0, 5);

  const handleUpgrade = (planId = promptContent.targetPlan) => {
    onUpgrade?.(planId);
    onClose();
  };

  const renderFeatureList = () => {
    return displayFeatures.map((featureKey) => {
      const featureInfo = FEATURE_DESCRIPTIONS[featureKey];
      if (!featureInfo) return null;

      return (
        <View key={featureKey} style={styles.featureItem}>
          <View style={styles.featureIcon}>
            <Text style={styles.featureEmoji}>{featureInfo.icon}</Text>
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureName}>{featureInfo.name}</Text>
            <Text style={styles.featureDescription}>{featureInfo.description}</Text>
          </View>
          <View style={styles.featureCheck}>
            <Check size={16} color="#10B981" />
          </View>
        </View>
      );
    });
  };

  const renderPlanOptions = () => {
    if (availablePlans.length > 1) {
      return (
        <View style={styles.planOptionsContainer}>
          <Text style={styles.planOptionsTitle}>Choose your upgrade:</Text>
          <View style={styles.planOptionsGrid}>
            {availablePlans.map(plan => {
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planOptionCard,
                    plan.popular && styles.popularPlanCard,
                  ]}
                  onPress={() => handleUpgrade(plan.id)}
                >
                  {/* Popular Badge - CONSISTENT WITH PRICINGSCREEN */}
                  {plan.popular && (
                    <View style={styles.planPopularBadge}>
                      <Star size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.planPopularBadgeText}>Most Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.planOptionHeader}>
                    <View style={[
                      styles.planOptionIconContainer,
                      plan.popular && styles.popularPlanIcon
                    ]}>
                      <Text style={[
                        styles.planOptionIcon,
                        plan.popular && styles.popularPlanIconText
                      ]}>
                        {plan.icon}
                      </Text>
                    </View>
                    <Text style={styles.planOptionName}>{plan.displayName}</Text>
                    <Text style={styles.planOptionDescription}>{plan.description}</Text>
                    <Text style={styles.planOptionPrice}>
                      {plan.price === 'custom' 
                        ? 'Custom pricing'
                        : plan.price?.monthly 
                        ? `£${plan.price.monthly}/month`
                        : 'Free'
                      }
                    </Text>
                  </View>

                  <View style={styles.planOptionFeatures}>
                    <Text style={styles.planOptionQueriesText}>
                      {plan.queryLimit === 'unlimited' 
                        ? 'Unlimited queries'
                        : `${plan.queryLimit} queries/${plan.queryPeriod}`
                      }
                    </Text>
                    
                    {feature && hasFeatureAccess && hasFeatureAccess(plan.id, feature) && (
                      <View style={styles.planOptionHighlight}>
                        <Check size={14} color="#10B981" />
                        <Text style={styles.planOptionHighlightText}>
                          Includes {FEATURE_DESCRIPTIONS[feature]?.name}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={[
                    styles.planOptionButton,
                    plan.popular ? styles.popularPlanButton : styles.defaultPlanButton
                  ]}>
                    <Text style={[
                      styles.planOptionButtonText,
                      plan.popular && styles.popularPlanButtonText
                    ]}>
                      Upgrade to {plan.displayName}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // Single plan - show comparison
    return renderPlanComparison();
  };

  const renderPlanComparison = () => {
    return (
      <View style={styles.planComparison}>
        {/* Current Plan */}
        <View style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planBadge}>Current</Text>
            <View style={styles.planIconContainer}>
              <Text style={styles.planIcon}>{currentPlanInfo.icon}</Text>
            </View>
            <Text style={styles.planName}>{currentPlanInfo.displayName}</Text>
            <Text style={styles.planPrice}>
              {currentPlan === 'free' ? 'Free' : `£${currentPlanInfo.price?.monthly || 0}/month`}
            </Text>
          </View>
          <View style={styles.planLimits}>
            <Text style={styles.planLimitText}>
              {currentPlanInfo.queryLimit === 'unlimited' 
                ? 'Unlimited queries'
                : `${currentPlanInfo.queryLimit} queries/${currentPlanInfo.queryPeriod}`
              }
            </Text>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.arrowContainer}>
          <ArrowRight size={24} color="#6B7280" />
        </View>

        {/* Target Plan */}
        <View style={[styles.planCard, styles.targetPlanCard]}>
          {/* Always show "Most Popular" badge for single plan comparison */}
          <View style={styles.popularBadge}>
            <Star size={12} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={styles.popularBadgeText}>Most Popular</Text>
          </View>
          
          <View style={styles.planHeader}>
            <View style={[styles.planIconContainer, styles.targetPlanIcon]}>
              <Text style={styles.planIcon}>{targetPlanInfo.icon}</Text>
            </View>
            <Text style={styles.planName}>{targetPlanInfo.displayName}</Text>
            <Text style={styles.planPrice}>
              {targetPlanInfo.price === 'custom' 
                ? 'Custom pricing'
                : `£${targetPlanInfo.price?.monthly || 0}/month`
              }
            </Text>
          </View>
          <View style={styles.planLimits}>
            <Text style={styles.planLimitText}>
              {targetPlanInfo.queryLimit === 'unlimited' 
                ? 'Unlimited queries'
                : `${targetPlanInfo.queryLimit} queries/${targetPlanInfo.queryPeriod}`
              }
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={[
        styles.overlay,
        {
          width: screenData.width,
          height: screenData.height,
        }
      ]}>
        <View style={[
          styles.modalContainer,
          isWide && styles.modalContainerWide,
          { maxWidth: isWide ? 500 : width - 32 }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Lock Icon */}
            <View style={styles.lockIconContainer}>
              <View style={styles.lockIconBg}>
                <Lock size={32} color="#FFFFFF" />
              </View>
            </View>

            {/* Title and Description */}
            <Text style={styles.title}>{promptContent.title}</Text>
            <Text style={styles.description}>{promptContent.description}</Text>

            {/* Feature Highlight */}
            {feature && FEATURE_DESCRIPTIONS && (
              <View style={styles.featureHighlight}>
                <Text style={styles.featureHighlightTitle}>
                  🔒 Feature you're trying to access:
                </Text>
                <View style={styles.featureHighlightCard}>
                  <Text style={styles.featureHighlightIcon}>
                    {FEATURE_DESCRIPTIONS[feature]?.icon || '⭐'}
                  </Text>
                  <View style={styles.featureHighlightContent}>
                    <Text style={styles.featureHighlightName}>
                      {FEATURE_DESCRIPTIONS[feature]?.name || 'Premium Feature'}
                    </Text>
                    <Text style={styles.featureHighlightDesc}>
                      {FEATURE_DESCRIPTIONS[feature]?.description || 'Advanced functionality'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Plan Options or Comparison */}
            {renderPlanOptions()}

            {/* Features List */}
            {displayFeatures.length > 0 && (
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>What you'll unlock:</Text>
                <View style={styles.featuresList}>
                  {renderFeatureList()}
                </View>
              </View>
            )}

            {/* Benefits */}
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsTitle}>Why upgrade?</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Zap size={16} color="#F59E0B" />
                  <Text style={styles.benefitText}>Unlock advanced features</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Crown size={16} color="#8B5CF6" />
                  <Text style={styles.benefitText}>Priority support</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Check size={16} color="#10B981" />
                  <Text style={styles.benefitText}>No hidden fees</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions - only show if single plan */}
          {availablePlans.length <= 1 && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Maybe Later</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.upgradeButton} onPress={() => handleUpgrade()}>
                <Crown size={18} color="#FFFFFF" />
                <Text style={styles.upgradeButtonText}>
                  Upgrade to {targetPlanInfo.displayName}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalContainerWide: {
    minHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    overflow: 'visible',
  },
  lockIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  lockIconBg: {
    width: 64,
    height: 64,
    backgroundColor: '#EF4444',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },

  // Feature Highlight Section
  featureHighlight: {
    marginBottom: 32,
  },
  featureHighlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  featureHighlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
  },
  featureHighlightIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  featureHighlightContent: {
    flex: 1,
  },
  featureHighlightName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  featureHighlightDesc: {
    fontSize: 13,
    color: '#A16207',
    lineHeight: 18,
  },

  // Plan Options - CONSISTENT WITH PRICINGSCREEN
  planOptionsContainer: {
    marginBottom: 32,
  },
  planOptionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  planOptionsGrid: {
    gap: 16,
  },
  planOptionCard: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  // CONSISTENT WITH PRICINGSCREEN
  popularPlanCard: {
    borderColor: '#000',
    borderWidth: 2,
  },
  planPopularBadge: {
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
  planPopularBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planOptionHeader: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8, // Space for badge
  },
  planOptionIconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#F3F4F6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  popularPlanIcon: {
    backgroundColor: '#000',
  },
  planOptionIcon: {
    fontSize: 32,
  },
  popularPlanIconText: {
    color: '#FFFFFF',
  },
  planOptionName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  planOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  planOptionPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  planOptionFeatures: {
    marginBottom: 20,
  },
  planOptionQueriesText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  planOptionHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  planOptionHighlightText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
    marginLeft: 4,
  },
  planOptionButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
  },
  defaultPlanButton: { 
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularPlanButton: { 
    backgroundColor: '#000' 
  },
  planOptionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  popularPlanButtonText: {
    color: '#FFF',
  },

  // Original Plan Comparison Styles
  planComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'visible',
  },
  targetPlanCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    borderWidth: 2,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 10,
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
    marginBottom: 12,
  },
  planBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  planIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  targetPlanIcon: {
    backgroundColor: '#3B82F6',
  },
  planIcon: {
    fontSize: 20,
  },
  planName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  planLimits: {
    alignItems: 'center',
  },
  planLimitText: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  arrowContainer: {
    marginHorizontal: 16,
  },

  // Features Section
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  featureIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 16,
  },
  featureCheck: {
    marginLeft: 8,
  },

  // Benefits Section
  benefitsSection: {
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  upgradeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#111827',
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
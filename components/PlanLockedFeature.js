// components/PlanLockedFeature.js
// Wrapper component for plan-restricted features

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Lock,
  Crown,
  ArrowUpRight,
} from 'lucide-react-native';

import {
  hasFeatureAccess,
  getRequiredPlan,
  FEATURE_DESCRIPTIONS,
  PLAN_INFO,
} from '../utils/planAccessManager';

import UpgradePrompt from './UpgradePrompt';

export default function PlanLockedFeature({
  children,
  feature,
  userPlan = 'free',
  onUpgrade,
  // Customization props
  showUpgradePrompt = true,
  lockStyle = 'overlay', // 'overlay', 'disabled', 'badge'
  lockPosition = 'center', // 'center', 'top-right', 'bottom-right'
  customLockContent = null,
  onAccessDenied = null,
  // Style props
  style,
  disabledStyle,
  overlayStyle,
}) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const hasAccess = hasFeatureAccess(userPlan, feature);
  const requiredPlan = getRequiredPlan(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  const requiredPlanInfo = PLAN_INFO[requiredPlan];

  const handleFeatureAccess = () => {
    if (hasAccess) {
      return; // Feature is accessible, normal behavior
    }

    // Feature is locked
    if (onAccessDenied) {
      onAccessDenied(feature, requiredPlan);
    }

    if (showUpgradePrompt) {
      setShowUpgradeModal(true);
    }
  };

  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradeModal(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    }
  };

  // If user has access, render children normally
  if (hasAccess) {
    return <View style={style}>{children}</View>;
  }

  // Feature is locked - render based on lockStyle
  const renderLockOverlay = () => {
    if (customLockContent) {
      return customLockContent;
    }

    const lockIcon = (
      <View style={[styles.lockIcon, getLockPositionStyle()]}>
        <Lock size={16} color="#FFFFFF" />
      </View>
    );

    const upgradeButton = (
      <TouchableOpacity
        style={[styles.upgradeButton, getUpgradeButtonStyle()]}
        onPress={handleFeatureAccess}
      >
        <Crown size={14} color="#FFFFFF" />
        <Text style={styles.upgradeButtonText}>
          Upgrade to {requiredPlanInfo?.displayName || 'Pro'}
        </Text>
        <ArrowUpRight size={12} color="#FFFFFF" />
      </TouchableOpacity>
    );

    switch (lockStyle) {
      case 'overlay':
        return (
          <View style={[styles.overlay, overlayStyle]}>
            <View style={styles.overlayContent}>
              {lockIcon}
              <Text style={styles.overlayTitle}>
                {featureInfo?.name || 'Premium Feature'}
              </Text>
              <Text style={styles.overlayDescription}>
                {featureInfo?.description || 'Upgrade to unlock this feature'}
              </Text>
              {upgradeButton}
            </View>
          </View>
        );

      case 'badge':
        return (
          <View style={[styles.badge, getBadgePositionStyle()]}>
            <Lock size={12} color="#FFFFFF" />
            <Text style={styles.badgeText}>
              {requiredPlanInfo?.displayName || 'Pro'}
            </Text>
          </View>
        );

      case 'disabled':
      default:
        return lockIcon;
    }
  };

  const getLockPositionStyle = () => {
    switch (lockPosition) {
      case 'top-right':
        return styles.lockPositionTopRight;
      case 'bottom-right':
        return styles.lockPositionBottomRight;
      case 'center':
      default:
        return styles.lockPositionCenter;
    }
  };

  const getBadgePositionStyle = () => {
    switch (lockPosition) {
      case 'top-right':
        return styles.badgePositionTopRight;
      case 'bottom-right':
        return styles.badgePositionBottomRight;
      case 'center':
      default:
        return styles.badgePositionCenter;
    }
  };

  const getUpgradeButtonStyle = () => {
    if (lockStyle === 'overlay') {
      return styles.upgradeButtonOverlay;
    }
    return {};
  };

  const getContainerStyle = () => {
    const baseStyle = [styles.container];
    
    if (style) {
      baseStyle.push(style);
    }

    if (lockStyle === 'disabled') {
      baseStyle.push(styles.disabledContainer);
      if (disabledStyle) {
        baseStyle.push(disabledStyle);
      }
    }

    return baseStyle;
  };

  return (
    <>
      <TouchableOpacity
        style={getContainerStyle()}
        onPress={handleFeatureAccess}
        disabled={lockStyle === 'disabled'}
        activeOpacity={lockStyle === 'disabled' ? 1 : 0.7}
      >
        {/* Render children with reduced opacity if disabled */}
        <View style={lockStyle === 'disabled' ? styles.disabledContent : null}>
          {children}
        </View>

        {/* Render lock overlay/badge */}
        {renderLockOverlay()}
      </TouchableOpacity>

      {/* Upgrade Modal */}
      {showUpgradePrompt && (
        <UpgradePrompt
          visible={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={handleUpgradeAction}
          currentPlan={userPlan}
          feature={feature}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  disabledContainer: {
    opacity: 0.6,
  },
  disabledContent: {
    opacity: 0.5,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 10,
  },
  overlayContent: {
    alignItems: 'center',
    maxWidth: 200,
  },
  overlayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  overlayDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
  },
  lockIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  lockPositionCenter: {
    // Already centered by parent
  },
  lockPositionTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  lockPositionBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  badgePositionCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 10,
  },
  badgePositionTopRight: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  badgePositionBottomRight: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    zIndex: 10,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  upgradeButtonOverlay: {
    marginTop: 8,
  },
  upgradeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Higher-order component for easy wrapping
export const withPlanAccess = (WrappedComponent, feature, options = {}) => {
  return (props) => (
    <PlanLockedFeature
      feature={feature}
      userPlan={props.userPlan}
      onUpgrade={props.onUpgrade}
      {...options}
    >
      <WrappedComponent {...props} />
    </PlanLockedFeature>
  );
};

// Hook for checking feature access in functional components
export const usePlanAccess = (userPlan, feature) => {
  const hasAccess = hasFeatureAccess(userPlan, feature);
  const requiredPlan = getRequiredPlan(feature);
  const featureInfo = FEATURE_DESCRIPTIONS[feature];

  return {
    hasAccess,
    requiredPlan,
    featureInfo,
    isLocked: !hasAccess,
  };
};
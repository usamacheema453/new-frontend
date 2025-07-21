// utils/subscriptionUtils.js

export const PLAN_FEATURES = {
  free: {
    maxQueries: 10,
    period: 'week',
    features: [
      'basic_chat',
      'basic_knowledge_base'
    ],
    restrictions: {
      ninja_mode: false,
      meme_mode: false,
      manage_brain: false,
      file_attachments: false,
      voice_recording: false,
      team_features: false,
      admin_panel: false,
      unlimited_queries: false
    }
  },
  solo: {
    maxQueries: 250,
    period: 'month',
    features: [
      'basic_chat',
      'ninja_mode',
      'meme_mode',
      'file_attachments',
      'voice_recording',
      'personal_storage',
      'advanced_knowledge_base'
    ],
    restrictions: {
      manage_brain: false,
      team_features: false,
      admin_panel: false,
      unlimited_queries: false,
      location_mode: false
    }
  },
  team: {
    maxQueries: 'unlimited',
    period: 'month',
    features: [
      'basic_chat',
      'ninja_mode',
      'meme_mode',
      'location_mode',
      'file_attachments',
      'voice_recording',
      'manage_brain',
      'team_features',
      'admin_panel',
      'document_management',
      'team_monitoring',
      'unlimited_queries'
    ],
    restrictions: {
      custom_ai_training: false,
      dedicated_support: false,
      sla_guarantees: false,
      custom_integrations: false
    }
  },
  enterprise: {
    maxQueries: 'unlimited',
    period: 'month',
    features: [
      'basic_chat',
      'ninja_mode',
      'meme_mode',
      'location_mode',
      'file_attachments',
      'voice_recording',
      'manage_brain',
      'team_features',
      'admin_panel',
      'document_management',
      'team_monitoring',
      'unlimited_queries',
      'custom_ai_training',
      'dedicated_support',
      'sla_guarantees',
      'custom_integrations',
      'advanced_analytics'
    ],
    restrictions: {}
  }
};

export const checkFeatureAccess = (userPlan, feature) => {
  const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
  return planConfig.features.includes(feature);
};

export const getFeatureRestriction = (userPlan, feature) => {
  const planConfig = PLAN_FEATURES[userPlan] || PLAN_FEATURES.free;
  return planConfig.restrictions[feature] === true;
};

export const getUpgradeMessage = (userPlan, feature) => {
  const messages = {
    ninja_mode: {
      title: "Ninja Mode - Solo Plan Required",
      message: "Unlock advanced problem-solving capabilities with Ninja Mode. Upgrade to Solo plan or higher.",
      minPlan: 'solo'
    },
    meme_mode: {
      title: "Meme Mode - Solo Plan Required", 
      message: "Add some fun to your conversations with Meme Mode. Upgrade to Solo plan or higher.",
      minPlan: 'solo'
    },
    manage_brain: {
      title: "Manage Brain - Team Plan Required",
      message: "Access advanced knowledge base management with Manage Brain. Upgrade to Team plan or higher.",
      minPlan: 'team'
    },
    file_attachments: {
      title: "File Attachments - Solo Plan Required",
      message: "Share files and images in your conversations. Upgrade to Solo plan or higher.",
      minPlan: 'solo'
    },
    voice_recording: {
      title: "Voice Recording - Solo Plan Required",
      message: "Use voice input for hands-free interaction. Upgrade to Solo plan or higher.",
      minPlan: 'solo'
    },
    location_mode: {
      title: "Location Mode - Team Plan Required",
      message: "Manage site equipment with Location Mode. Upgrade to Team plan or higher.",
      minPlan: 'team'
    },
    team_features: {
      title: "Team Features - Team Plan Required",
      message: "Collaborate with your team using advanced team features. Upgrade to Team plan.",
      minPlan: 'team'
    },
    admin_panel: {
      title: "Admin Panel - Team Plan Required",
      message: "Access powerful admin controls and team management. Upgrade to Team plan.",
      minPlan: 'team'
    }
  };

  return messages[feature] || {
    title: "Premium Feature",
    message: "This feature requires a higher plan. Please upgrade to continue.",
    minPlan: 'solo'
  };
};

// Enhanced restriction hook
export const useFeatureRestrictions = (userPlan, setShowSubscriptionModal) => {
  const checkAndRestrictFeature = (feature, callback) => {
    if (checkFeatureAccess(userPlan, feature)) {
      callback();
    } else {
      const upgradeInfo = getUpgradeMessage(userPlan, feature);
      Alert.alert(
        upgradeInfo.title,
        upgradeInfo.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Upgrade Now', 
            onPress: () => setShowSubscriptionModal(true)
          }
        ]
      );
    }
  };

  return { checkAndRestrictFeature };
};

// Component wrapper for feature restrictions
export const FeatureGate = ({ 
  children, 
  feature, 
  userPlan, 
  setShowSubscriptionModal,
  fallback = null 
}) => {
  const hasAccess = checkFeatureAccess(userPlan, feature);
  
  if (!hasAccess) {
    return fallback || (
      <TouchableOpacity
        style={styles.restrictedFeature}
        onPress={() => {
          const upgradeInfo = getUpgradeMessage(userPlan, feature);
          Alert.alert(
            upgradeInfo.title,
            upgradeInfo.message,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Upgrade Now', 
                onPress: () => setShowSubscriptionModal(true)
              }
            ]
          );
        }}
      >
        <Lock size={16} color="#6B7280" />
        <Text style={styles.restrictedText}>Upgrade Required</Text>
      </TouchableOpacity>
    );
  }
  
  return children;
};

const styles = StyleSheet.create({
  restrictedFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    opacity: 0.6,
  },
  restrictedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
});
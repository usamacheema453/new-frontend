// utils/planAccessManager.js
// Central plan access control system

// Plan hierarchy (used for upgrade logic)
export const PLAN_HIERARCHY = {
  free: 0,
  solo: 1,
  team: 2,
  enterprise: 3,
};

// Feature definitions with required plans
export const FEATURES = {
  // Chat features
  BASIC_CHAT: 'basic_chat',
  NINJA_MODE: 'ninja_mode',
  MEME_MODE: 'meme_mode',
  LOCATION_MODE: 'location_mode',
  UNLIMITED_QUERIES: 'unlimited_queries',
  
  // Brain features
  MANAGE_BRAIN_BASIC: 'manage_brain_basic',
  BRAIN_PRIVATE_STORAGE: 'brain_private_storage',
  BRAIN_ORGANIZATION_SHARING: 'brain_organization_sharing',
  BRAIN_TEAM_ACCESS: 'brain_team_access',
  
  // Upload features
  UPLOAD_PHOTOS: 'upload_photos',
  UPLOAD_MANUALS: 'upload_manuals',
  UPLOAD_FILES: 'upload_files',
  
  // Admin features
  TEAM_MANAGEMENT: 'team_management',
  ADMIN_PANEL: 'admin_panel',
  ANALYTICS: 'analytics',
};

// Plan feature access mapping
export const PLAN_FEATURES = {
  free: [
    FEATURES.BASIC_CHAT,
    FEATURES.MANAGE_BRAIN_BASIC, // Only community sharing, 3 uploads/month
    FEATURES.UPLOAD_PHOTOS, // Limited to 3/month, community only
    FEATURES.UPLOAD_MANUALS, // Limited to 3/month, community only
    FEATURES.UPLOAD_FILES, // Limited to 3/month, community only
  ],
  solo: [
    FEATURES.BASIC_CHAT,
    FEATURES.NINJA_MODE,
    FEATURES.MEME_MODE,
    FEATURES.MANAGE_BRAIN_BASIC,
    FEATURES.BRAIN_PRIVATE_STORAGE, // Can choose community or private
    FEATURES.UPLOAD_PHOTOS, // 100 pages/month
    FEATURES.UPLOAD_MANUALS, // 100 pages/month
    FEATURES.UPLOAD_FILES, // 100 pages/month
  ],
  team: [
    FEATURES.BASIC_CHAT,
    FEATURES.NINJA_MODE,
    FEATURES.MEME_MODE,
    FEATURES.LOCATION_MODE, // Teams-only feature
    FEATURES.UNLIMITED_QUERIES,
    FEATURES.MANAGE_BRAIN_BASIC,
    FEATURES.BRAIN_PRIVATE_STORAGE,
    FEATURES.BRAIN_ORGANIZATION_SHARING,
    FEATURES.BRAIN_TEAM_ACCESS,
    FEATURES.UPLOAD_PHOTOS, // Unlimited
    FEATURES.UPLOAD_MANUALS, // Unlimited
    FEATURES.UPLOAD_FILES, // Unlimited
    FEATURES.TEAM_MANAGEMENT,
    FEATURES.ADMIN_PANEL,
    FEATURES.ANALYTICS,
  ],
  enterprise: [
    // Enterprise has all features
    ...Object.values(FEATURES),
  ],
};

// Feature descriptions for upgrade prompts
export const FEATURE_DESCRIPTIONS = {
  [FEATURES.NINJA_MODE]: {
    name: 'Ninja Mode',
    description: 'Advanced problem solver with stealth-like precision',
    icon: '🥷',
    requiredPlan: 'solo',
  },
  [FEATURES.MEME_MODE]: {
    name: 'Meme Mode', 
    description: 'Interactive humor and engaging responses',
    icon: '😄',
    requiredPlan: 'solo',
  },
  [FEATURES.LOCATION_MODE]: {
    name: 'Location Mode',
    description: 'Site equipment manager with location-based features',
    icon: '📍',
    requiredPlan: 'team',
  },
  [FEATURES.BRAIN_PRIVATE_STORAGE]: {
    name: 'Private Brain Storage',
    description: 'Secure personal knowledge storage space',
    icon: '🔒',
    requiredPlan: 'solo',
  },
  [FEATURES.BRAIN_ORGANIZATION_SHARING]: {
    name: 'Organization Sharing',
    description: 'Share content across your organization',
    icon: '🏢',
    requiredPlan: 'team',
  },
  [FEATURES.UNLIMITED_QUERIES]: {
    name: 'Unlimited Queries',
    description: 'No limits on monthly queries',
    icon: '∞',
    requiredPlan: 'team',
  },
  [FEATURES.UPLOAD_PHOTOS]: {
    name: 'Photo Upload',
    description: 'Upload and analyze images (Free: 3/month, Solo: 100/month, Team+: unlimited)',
    icon: '📸',
    requiredPlan: 'free',
  },
  [FEATURES.UPLOAD_MANUALS]: {
    name: 'Manual Upload',
    description: 'Upload documentation and guides (Free: 3/month, Solo: 100/month, Team+: unlimited)',
    icon: '📚',
    requiredPlan: 'free',
  },
  [FEATURES.UPLOAD_FILES]: {
    name: 'File Upload',
    description: 'Upload any type of document (Free: 3/month, Solo: 100/month, Team+: unlimited)',
    icon: '📄',
    requiredPlan: 'free',
  },
  [FEATURES.TEAM_MANAGEMENT]: {
    name: 'Team Management',
    description: 'Manage team members and permissions',
    icon: '👥',
    requiredPlan: 'team',
  },
};

// Plan display information
export const PLAN_INFO = {
  free: {
    name: 'Free',
    displayName: 'Free Plan',
    color: '#10B981',
    icon: '💚',
    queryLimit: 10,
    queryPeriod: 'week',
    uploadLimit: 3,
    uploadPeriod: 'month',
    uploadTypes: 'Community only',
  },
  solo: {
    name: 'Solo',
    displayName: 'Solo', 
    color: '#3B82F6',
    icon: '👤',
    queryLimit: 250,
    queryPeriod: 'month',
    uploadLimit: 100,
    uploadPeriod: 'month',
    uploadTypes: 'Community or Private',
    price: { monthly: 10, yearly: 108 },
  },
  team: {
    name: 'Team',
    displayName: 'Team',
    color: '#8B5CF6',
    icon: '👥',
    queryLimit: 'unlimited',
    queryPeriod: null,
    uploadLimit: 'unlimited',
    uploadPeriod: null,
    uploadTypes: 'Community, Organization, or Team',
    price: { monthly: 25, yearly: 270 },
  },
  enterprise: {
    name: 'Enterprise',
    displayName: 'Enterprise',
    color: '#EF4444',
    icon: '🏢',
    queryLimit: 'unlimited',
    queryPeriod: null,
    uploadLimit: 'unlimited',
    uploadPeriod: null,
    uploadTypes: 'All options + Custom',
    price: 'custom',
  },
};

/**
 * Check if user has access to a specific feature
 * @param {string} userPlan - User's current plan
 * @param {string} feature - Feature to check
 * @returns {boolean} - Whether user has access
 */
export const hasFeatureAccess = (userPlan, feature) => {
  if (!userPlan || !feature) return false;
  
  const planFeatures = PLAN_FEATURES[userPlan] || [];
  return planFeatures.includes(feature);
};

/**
 * Get the minimum plan required for a feature
 * @param {string} feature - Feature to check
 * @returns {string|null} - Required plan name
 */
export const getRequiredPlan = (feature) => {
  const featureInfo = FEATURE_DESCRIPTIONS[feature];
  return featureInfo?.requiredPlan || null;
};

/**
 * Check if user can upgrade to access a feature
 * @param {string} userPlan - User's current plan
 * @param {string} feature - Feature to check
 * @returns {boolean} - Whether upgrade is possible
 */
export const canUpgradeForFeature = (userPlan, feature) => {
  const requiredPlan = getRequiredPlan(feature);
  if (!requiredPlan) return false;
  
  const currentLevel = PLAN_HIERARCHY[userPlan] || 0;
  const requiredLevel = PLAN_HIERARCHY[requiredPlan] || 0;
  
  return requiredLevel > currentLevel;
};

/**
 * Get all features available for a plan
 * @param {string} plan - Plan name
 * @returns {Array} - Array of available features
 */
export const getPlanFeatures = (plan) => {
  return PLAN_FEATURES[plan] || [];
};

/**
 * Get features that would be unlocked by upgrading to a plan
 * @param {string} currentPlan - Current plan
 * @param {string} targetPlan - Target plan
 * @returns {Array} - Array of new features
 */
export const getUpgradeFeatures = (currentPlan, targetPlan) => {
  const currentFeatures = new Set(getPlanFeatures(currentPlan));
  const targetFeatures = getPlanFeatures(targetPlan);
  
  return targetFeatures.filter(feature => !currentFeatures.has(feature));
};

/**
 * Get next available plan for upgrade
 * @param {string} currentPlan - Current plan
 * @returns {string|null} - Next plan name
 */
export const getNextPlan = (currentPlan) => {
  const currentLevel = PLAN_HIERARCHY[currentPlan] || 0;
  
  for (const [plan, level] of Object.entries(PLAN_HIERARCHY)) {
    if (level === currentLevel + 1) {
      return plan;
    }
  }
  
  return null;
};

/**
 * Check if plan supports unlimited queries
 * @param {string} plan - Plan name
 * @returns {boolean}
 */
export const hasUnlimitedQueries = (plan) => {
  return hasFeatureAccess(plan, FEATURES.UNLIMITED_QUERIES);
};

/**
 * Get query limit for plan
 * @param {string} plan - Plan name
 * @returns {number|string} - Query limit or 'unlimited'
 */
export const getQueryLimit = (plan) => {
  const planInfo = PLAN_INFO[plan];
  return planInfo?.queryLimit || 0;
};

/**
 * Get sharing options available for a plan in brain management
 * @param {string} plan - Plan name
 * @returns {Object} - Available sharing options
 */
export const getBrainSharingOptions = (plan) => {
  const options = {
    addToCommunity: true, // Available to all plans
    addToBrain: false, // Private storage (Solo+)
    makePublicInOrg: false, // Organization sharing (Team+)
    teamAccess: false, // Team-specific access (Team+)
    isForced: false, // Whether options are forced (Free plan)
  };
  
  switch (plan) {
    case 'free':
      // Free users: Everything goes to community, no choice
      options.isForced = true;
      options.addToCommunity = true;
      options.addToBrain = false;
      options.makePublicInOrg = false;
      options.teamAccess = false;
      break;
      
    case 'solo':
      // Solo users: Can choose Community (default) or Private
      options.addToCommunity = true;
      options.addToBrain = true;
      options.makePublicInOrg = false;
      options.teamAccess = false;
      break;
      
    case 'team':
    case 'enterprise':
      // Team users: Full flexibility - Community, Organization, or Team Access
      options.addToCommunity = true;
      options.addToBrain = true;
      options.makePublicInOrg = true;
      options.teamAccess = true;
      break;
      
    default:
      // Default to free plan restrictions
      options.isForced = true;
      break;
  }
  
  return options;
};

/**
 * Get tools available for a plan
 * @param {string} plan - Plan name
 * @returns {Array} - Available tools
 */
export const getAvailableTools = (plan) => {
  const tools = [];
  
  if (hasFeatureAccess(plan, FEATURES.NINJA_MODE)) {
    tools.push({
      id: 'ninja',
      name: 'Ninja Mode',
      description: 'Advanced problem solver',
      icon: '🥷',
    });
  }
  
  if (hasFeatureAccess(plan, FEATURES.MEME_MODE)) {
    tools.push({
      id: 'meme', 
      name: 'Meme Mode',
      description: 'Interactive humor',
      icon: '😄',
    });
  }
  
  if (hasFeatureAccess(plan, FEATURES.LOCATION_MODE)) {
    tools.push({
      id: 'location',
      name: 'Location Mode', 
      description: 'Site equipment manager',
      icon: '📍',
    });
  }
  
  return tools;
};

/**
 * Get locked tools for upgrade prompts
 * @param {string} plan - Plan name
 * @returns {Array} - Locked tools with upgrade info
 */
export const getLockedTools = (plan) => {
  const locked = [];
  
  if (!hasFeatureAccess(plan, FEATURES.NINJA_MODE)) {
    locked.push({
      id: 'ninja',
      name: 'Ninja Mode',
      description: 'Advanced problem solver',
      icon: '🥷',
      requiredPlan: 'solo',
    });
  }
  
  if (!hasFeatureAccess(plan, FEATURES.MEME_MODE)) {
    locked.push({
      id: 'meme',
      name: 'Meme Mode', 
      description: 'Interactive humor',
      icon: '😄',
      requiredPlan: 'solo',
    });
  }
  
  if (!hasFeatureAccess(plan, FEATURES.LOCATION_MODE)) {
    locked.push({
      id: 'location',
      name: 'Location Mode',
      description: 'Site equipment manager', 
      icon: '📍',
      requiredPlan: 'team',
    });
  }
  
  return locked;
};

/**
 * Get upload limit for plan
 * @param {string} plan - Plan name
 * @returns {number|string} - Upload limit or 'unlimited'
 */
export const getUploadLimit = (plan) => {
  const planInfo = PLAN_INFO[plan];
  return planInfo?.uploadLimit || 0;
};

/**
 * Get upload limit display text
 * @param {string} plan - Plan name
 * @returns {string} - Upload limit description
 */
export const getUploadLimitText = (plan) => {
  const planInfo = PLAN_INFO[plan];
  if (!planInfo) return '0 uploads';
  
  if (planInfo.uploadLimit === 'unlimited') {
    return 'Unlimited uploads';
  }
  
  return `${planInfo.uploadLimit} uploads/${planInfo.uploadPeriod}`;
};

/**
 * Check if brain upload options are available
 * @param {string} plan - Plan name
 * @returns {Object} - Available upload options with limits
 */
export const getBrainUploadAccess = (plan) => {
  const planInfo = PLAN_INFO[plan];
  
  return {
    writeTips: true, // Available to all plans
    uploadPhotos: hasFeatureAccess(plan, FEATURES.UPLOAD_PHOTOS),
    uploadManuals: hasFeatureAccess(plan, FEATURES.UPLOAD_MANUALS), 
    uploadFiles: hasFeatureAccess(plan, FEATURES.UPLOAD_FILES),
    uploadLimit: planInfo?.uploadLimit || 0,
    uploadPeriod: planInfo?.uploadPeriod || 'month',
    limitText: getUploadLimitText(plan),
    sharingOptions: getBrainSharingOptions(plan),
  };
};

export default {
  FEATURES,
  PLAN_FEATURES,
  FEATURE_DESCRIPTIONS,
  PLAN_INFO,
  hasFeatureAccess,
  getRequiredPlan,
  canUpgradeForFeature,
  getPlanFeatures,
  getUpgradeFeatures,
  getNextPlan,
  hasUnlimitedQueries,
  getQueryLimit,
  getUploadLimit,
  getUploadLimitText,
  getBrainSharingOptions,
  getAvailableTools,
  getLockedTools,
  getBrainUploadAccess,
};
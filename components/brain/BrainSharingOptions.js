// components/brain/BrainSharingOptions.js
// Plan-specific sharing options for ManageBrain

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {
  Check,
  AlertCircle,
  Globe,
  Building2,
  Lock,
  Users,
  Crown,
  Info,
} from 'lucide-react-native';

import {
  getBrainSharingOptions,
  hasFeatureAccess,
  FEATURES,
  PLAN_INFO,
} from '../../utils/planAccessManager';

import UpgradePrompt from '../UpgradePrompt';

export default function BrainSharingOptions({
  userPlan = 'free',
  // Form state
  addToCommunity,
  setAddToCommunity,
  isPublic,
  setIsPublic,
  selectedTeams,
  setSelectedTeams,
  teams = [],
  // Callbacks
  onUpgrade,
  onShowTooltip,
  showSharingTooltip = false,
  setShowSharingTooltip,
  // Upload tracking for Free users
  currentUploads = 0,
  uploadLimit = null,
}) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState(null);

  const sharingOptions = getBrainSharingOptions(userPlan);
  const planInfo = PLAN_INFO[userPlan];

  // Handle clicking on restricted features
  const handleRestrictedFeature = (feature) => {
    setRestrictedFeature(feature);
    setShowUpgradeModal(true);
  };

  const handleUpgradeAction = (targetPlan) => {
    setShowUpgradeModal(false);
    if (onUpgrade) {
      onUpgrade(targetPlan);
    }
  };

  const toggleTeamSelection = (teamId) => {
    if (selectedTeams.includes(teamId)) {
      setSelectedTeams(prev => prev.filter(id => id !== teamId));
    } else {
      setSelectedTeams(prev => [...prev, teamId]);
    }
  };

  const renderTooltip = () => {
    if (!showSharingTooltip) return null;

    return (
      <View style={styles.tooltip}>
        <View style={styles.tooltipArrow} />
        <Text style={styles.tooltipTitle}>Sharing Tips</Text>
        <Text style={styles.tooltipText}>
            Community sharing empowers others, builds your reputation, and costs you nothing, zero credits, all impact.{'\n'}
        </Text>
      </View>
    );
  };

  const renderCommunitySection = () => (
    <View style={[styles.visibilitySection, styles.visibilityBorder]}>
      <View style={styles.sectionTitleContainer}>
        <View style={styles.sectionTitleLeft}>
          <Globe size={16} color="#10B981" />
          <Text style={styles.visibilitySubtitle}>Community</Text>
          {sharingOptions.isForced && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>Default for Free</Text>
            </View>
          )}
        </View>
        <View style={styles.creditBadge}>
          <Text style={styles.creditText}>Credit required: 0.00</Text>
        </View>
      </View>
      
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={[
            styles.checkbox, 
            (addToCommunity || sharingOptions.isForced) && styles.checkboxActive,
            sharingOptions.isForced && styles.checkboxDisabled
          ]}
          onPress={() => !sharingOptions.isForced && setAddToCommunity(!addToCommunity)}
          disabled={sharingOptions.isForced}
        >
          {(addToCommunity || sharingOptions.isForced) && <Check size={16} color="#FFFFFF" />}
        </TouchableOpacity>
        <View style={styles.labelWithInfo}>
          <Text style={[
            styles.checkboxLabel,
            sharingOptions.isForced && styles.checkboxLabelForced
          ]}>
            Add to Community
            {sharingOptions.isForced && <Text style={styles.forcedText}> (Required)</Text>}
          </Text>
          {/* Only show info icon on desktop/web */}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={styles.infoIcon}
              onPress={() => setShowSharingTooltip(!showSharingTooltip)}
              onMouseEnter={() => Platform.OS === 'web' && setShowSharingTooltip(true)}
              onMouseLeave={() => Platform.OS === 'web' && setShowSharingTooltip(false)}
            >
              <AlertCircle size={14} color="#9CA3AF" />
              {/* Tooltip container moved inside the info icon */}
              {renderTooltip()}
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <Text style={styles.checkboxHelp}>
        {sharingOptions.isForced 
          ? `Free plan uploads automatically go to the community. Upgrade to unlock private storage options. (${currentUploads || 0}/${uploadLimit || 3} uploads used this month)`
          : "Share your content publicly to help others, grow your presence, and support the wider community. Great way to contribute and be discovered, all at zero credit cost."
        }
      </Text>
    </View>
  );

  const renderPrivateBrainSection = () => {
    const hasAccess = sharingOptions.addToBrain;
    
    // Don't show this section for free users (they're forced to community)
    if (sharingOptions.isForced) {
      return null;
    }

    // For Solo users - show as "Add to Brain (Private)"
    if (userPlan === 'solo') {
      return (
        <View style={[styles.visibilitySection, !hasAccess && styles.restrictedSection]}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionTitleLeft}>
              <Lock size={16} color={hasAccess ? "#6B7280" : "#9CA3AF"} />
              <Text style={[styles.visibilitySubtitle, !hasAccess && styles.restrictedText]}>
                Private Brain
              </Text>
              {!hasAccess && (
                <View style={styles.lockBadge}>
                  <Crown size={10} color="#FFFFFF" />
                  <Text style={styles.lockBadgeText}>Solo+</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              if (!hasAccess) {
                handleRestrictedFeature(FEATURES.BRAIN_PRIVATE_STORAGE);
                return;
              }
              // For Solo users, this is an alternative to community sharing
              if (hasAccess) {
                setAddToCommunity(false);
                // This would typically set a "private" flag in the parent component
              }
            }}
            disabled={!hasAccess}
          >
            <View style={[
              styles.checkbox, 
              hasAccess && !addToCommunity && styles.checkboxActive,
              !hasAccess && styles.checkboxDisabled
            ]}>
              {hasAccess && !addToCommunity && <Lock size={16} color="#FFFFFF" />}
            </View>
            <View style={styles.labelWithInfo}>
              <Text style={[styles.checkboxLabel, !hasAccess && styles.restrictedText]}>
                Add to Brain (Private)
              </Text>
              {!hasAccess && (
                <TouchableOpacity
                  style={styles.upgradeLink}
                  onPress={() => handleRestrictedFeature(FEATURES.BRAIN_PRIVATE_STORAGE)}
                >
                  <Text style={styles.upgradeLinkText}>Upgrade</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={[styles.checkboxHelp, !hasAccess && styles.restrictedText]}>
            {hasAccess 
              ? "Store content privately in your personal brain space. Only you can access this content."
              : "Upgrade to Solo plan to unlock private brain storage for your personal content."
            }
          </Text>
          
          {hasAccess && userPlan === 'solo' && (
            <View style={styles.soloLimitInfo}>
              <Text style={styles.soloLimitText}>
                Solo Plan: {currentUploads || 0}/{uploadLimit || 100} pages used this month
              </Text>
            </View>
          )}
        </View>
      );
    }

    return null; // For team+ users, we show the organization section instead
  };

  const renderOrganizationSection = () => {
    const hasAccess = sharingOptions.makePublicInOrg;
    
    // Only show for Team+ users, and this replaces the "Private Brain" section
    if (userPlan !== 'team' && userPlan !== 'enterprise') {
      return null;
    }

    return (
      <View style={[styles.visibilitySection, !hasAccess && styles.restrictedSection]}>
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionTitleLeft}>
            <Building2 size={16} color={hasAccess ? "#6B7280" : "#9CA3AF"} />
            <Text style={[styles.visibilitySubtitle, !hasAccess && styles.restrictedText]}>
              Organization
            </Text>
            {!hasAccess && (
              <View style={styles.lockBadge}>
                <Crown size={10} color="#FFFFFF" />
                <Text style={styles.lockBadgeText}>Team+</Text>
              </View>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => {
            if (!hasAccess) {
              handleRestrictedFeature(FEATURES.BRAIN_ORGANIZATION_SHARING);
              return;
            }
            setIsPublic(!isPublic);
            // If selecting organization, deselect community
            if (!isPublic) {
              setAddToCommunity(false);
            }
          }}
          disabled={!hasAccess}
        >
          <View style={[styles.checkbox, isPublic && hasAccess && styles.checkboxActive, !hasAccess && styles.checkboxDisabled]}>
            {isPublic && hasAccess && <Check size={16} color="#FFFFFF" />}
          </View>
          <View style={styles.labelWithInfo}>
            <Text style={[styles.checkboxLabel, !hasAccess && styles.restrictedText]}>
              Add to Organization (Private)
            </Text>
            {!hasAccess && (
              <TouchableOpacity
                style={styles.upgradeLink}
                onPress={() => handleRestrictedFeature(FEATURES.BRAIN_ORGANIZATION_SHARING)}
              >
                <Text style={styles.upgradeLinkText}>Upgrade</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.checkboxHelp, !hasAccess && styles.restrictedText]}>
          {hasAccess
            ? "Content is accessible to all teams within your organization but kept private from the public community"
            : "Upgrade to Team plan to share content privately within your organization."
          }
        </Text>
      </View>
    );
  };

  const renderTeamAccessSection = () => {
    const hasAccess = sharingOptions.teamAccess;
    const shouldShow = (userPlan === 'team' || userPlan === 'enterprise') && 
                      (!addToCommunity && !isPublic); // Only show when neither community nor org is selected
    
    if (!shouldShow) return null;

    return (
      <View style={[styles.teamAccessSection, !hasAccess && styles.restrictedSection]}>
        <Text style={[styles.label, !hasAccess && styles.restrictedText]}>
          Team Access *
          {!hasAccess && (
            <View style={styles.inlineLockBadge}>
              <Crown size={10} color="#FFFFFF" />
              <Text style={styles.lockBadgeText}>Team+</Text>
            </View>
          )}
        </Text>
        
        {hasAccess ? (
          <>
            <View style={styles.teamSelector}>
              {teams.map(team => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamOption,
                    selectedTeams.includes(team.id) && styles.teamOptionActive,
                  ]}
                  onPress={() => toggleTeamSelection(team.id)}
                >
                  <Text
                    style={[
                      styles.teamOptionText,
                      selectedTeams.includes(team.id) && styles.teamOptionTextActive,
                    ]}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.checkboxHelp}>
              Select specific teams that should have access to this content
            </Text>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.restrictedTeamAccess}
              onPress={() => handleRestrictedFeature(FEATURES.BRAIN_TEAM_ACCESS)}
            >
              <Users size={16} color="#9CA3AF" />
              <Text style={styles.restrictedTeamText}>Team access controls</Text>
              <TouchableOpacity
                style={styles.upgradeLink}
                onPress={() => handleRestrictedFeature(FEATURES.BRAIN_TEAM_ACCESS)}
              >
                <Text style={styles.upgradeLinkText}>Upgrade to unlock</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            <Text style={[styles.checkboxHelp, styles.restrictedText]}>
              Upgrade to Team plan to control which specific teams can access your content.
            </Text>
          </>
        )}
      </View>
    );
  };

  return (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sharing & Visibility</Text>
        
        {renderCommunitySection()}
        {renderPrivateBrainSection()}
        {renderOrganizationSection()}
        {renderTeamAccessSection()}
      </View>

      <UpgradePrompt
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={handleUpgradeAction}
        currentPlan={userPlan}
        feature={restrictedFeature}
      />
    </>
  );
}

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  visibilitySection: {
    marginBottom: 8,
    paddingBottom: 8,
  },
  visibilityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  restrictedSection: {
    opacity: 0.7,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visibilitySubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  restrictedText: {
    color: '#9CA3AF',
  },
  creditBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  creditText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  inlineLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 8,
  },
  lockBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
    zIndex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  checkboxDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginRight: 6,
  },
  checkboxLabelForced: {
    color: '#6B7280',
  },
  forcedText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  defaultBadge: {
    backgroundColor: '#FEF3F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
    textTransform: 'uppercase',
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  soloLimitInfo: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
    marginLeft: 28,
  },
  soloLimitText: {
    fontSize: 11,
    color: '#1E40AF',
    fontWeight: '500',
  },
  upgradeLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    marginLeft: 8,
  },
  upgradeLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  infoIcon: {
    position: 'relative',
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'transparent',
    zIndex: 9999,
    marginLeft: 4,
  },
  tooltip: {
    position: 'absolute',
    top: -130,
    left: -140,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    minWidth: 280,
    maxWidth: 320,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 50,
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
      },
    }),
  },
  tooltipArrow: {
    position: 'absolute',
    bottom: -6,
    left: 140,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#1F2937',
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  tooltipText: {
    fontSize: 11,
    color: '#E5E7EB',
    lineHeight: 16,
  },
  checkboxHelp: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 28,
    lineHeight: 16,
  },
  teamAccessSection: {
    marginTop: 4,
    marginBottom: 12,
  },
  teamSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  teamOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  teamOptionActive: {
    backgroundColor: '#000000',
  },
  teamOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  teamOptionTextActive: {
    color: '#FFFFFF',
  },
  restrictedTeamAccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  restrictedTeamText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 8,
    flex: 1,
  },
});
// components/chatpage/ToolsButton.js
// Enhanced with plan-based access control

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { 
  Settings2, 
  Swords, 
  Smile, 
  Check, 
  X, 
  Lock, 
  Crown,
  MapPin,
} from 'lucide-react-native';

import {
  hasFeatureAccess,
  FEATURES,
  PLAN_INFO,
} from '../../utils/planAccessManager';

export default function ToolsButton({ 
  isMobile, 
  selectedTool, 
  onToolSelect,
  userPlan = 'free',
  availableTools = [],
  lockedTools = [],
  onRestrictedAccess,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [btnHeight, setBtnHeight] = useState(0);

  // Enhanced tool options configuration with plan requirements
  const allToolOptions = [
    {
      id: 'ninja',
      name: 'Ninja mode',
      icon: Swords,
      description: 'Stealth and precision responses',
      color: '#1F2937',
      requiredFeature: FEATURES.NINJA_MODE,
      requiredPlan: 'solo',
    },
    {
      id: 'meme',
      name: 'Meme mode', 
      icon: Smile,
      description: 'Generate funny and creative responses',
      color: '#7C3AED',
      requiredFeature: FEATURES.MEME_MODE,
      requiredPlan: 'solo',
    },
    {
      id: 'location',
      name: 'Location mode',
      icon: MapPin,
      description: 'Site equipment manager with location features',
      color: '#059669',
      requiredFeature: FEATURES.LOCATION_MODE,
      requiredPlan: 'team',
    },
  ];

  // Separate available and locked tools for display
  const accessibleTools = allToolOptions.filter(tool => 
    hasFeatureAccess(userPlan, tool.requiredFeature)
  );

  const restrictedTools = allToolOptions.filter(tool => 
    !hasFeatureAccess(userPlan, tool.requiredFeature)
  );

  const toggleMenu = () => {
    console.log('🔧 ToolsButton: toggleMenu →', !menuVisible);
    setMenuVisible(v => !v);
  };

  const handleToolSelect = (toolId) => {
    console.log('🔧 ToolsButton: Tool selected →', toolId);
    
    // Check if tool is accessible
    const isAccessible = accessibleTools.some(tool => tool.id === toolId);
    
    if (!isAccessible) {
      // Tool is locked, trigger upgrade prompt
      const restrictedTool = restrictedTools.find(tool => tool.id === toolId);
      if (restrictedTool && onRestrictedAccess) {
        setMenuVisible(false);
        onRestrictedAccess(restrictedTool.requiredFeature);
      }
      return;
    }

    setMenuVisible(false);
    
    // Add small delay to ensure menu closes first
    setTimeout(() => {
      if (onToolSelect) {
        onToolSelect(toolId);
      }
    }, 100);
  };

  const handleClearSelection = () => {
    console.log('🔧 ToolsButton: Clearing selection');
    setMenuVisible(false);
    
    setTimeout(() => {
      if (onToolSelect) {
        onToolSelect(null);
      }
    }, 100);
  };

  const getSelectedToolInfo = () => {
    return allToolOptions.find(tool => tool.id === selectedTool);
  };

  const selectedToolInfo = getSelectedToolInfo();
  const planInfo = PLAN_INFO[userPlan] || PLAN_INFO.free;

  // Check if user has any tools available
  const hasAnyTools = accessibleTools.length > 0;

  // Mobile version: Simple button that just changes color when selected
  if (isMobile) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          onPress={toggleMenu}
          onLayout={e => setBtnHeight(e.nativeEvent.layout.height)}
          style={[
            styles.mobileButton,
            selectedTool && styles.mobileButtonSelected,
            !hasAnyTools && styles.mobileButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Settings2 size={16} color={selectedTool ? "#FFFFFF" : !hasAnyTools ? "#9CA3AF" : "#374151"} />
          {!hasAnyTools && (
            <View style={styles.mobileLockBadge}>
              <Lock size={8} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Menu for mobile */}
        {menuVisible && (
          <>
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => setMenuVisible(false)}
              activeOpacity={1}
            />
            
            <View style={[styles.menu, { bottom: btnHeight + 8 }]}>
              {/* Available Tools */}
              {accessibleTools.map((tool) => (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.menuItem,
                    selectedTool === tool.id && styles.selectedMenuItem
                  ]}
                  onPress={() => handleToolSelect(tool.id)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.toolIcon, { backgroundColor: tool.color }]}>
                    <tool.icon size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.toolContent}>
                    <Text style={[
                      styles.toolName,
                      selectedTool === tool.id && styles.selectedToolName
                    ]}>
                      {tool.name}
                    </Text>
                    <Text style={styles.toolDescription}>
                      {tool.description}
                    </Text>
                  </View>
                  {selectedTool === tool.id && (
                    <Check size={16} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Divider if both available and locked tools exist */}
              {accessibleTools.length > 0 && restrictedTools.length > 0 && (
                <View style={styles.menuDivider} />
              )}

              {/* Locked Tools */}
              {restrictedTools.map((tool) => {
                const requiredPlanInfo = PLAN_INFO[tool.requiredPlan];
                return (
                  <TouchableOpacity
                    key={tool.id}
                    style={[styles.menuItem, styles.lockedMenuItem]}
                    onPress={() => handleToolSelect(tool.id)}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.toolIcon, styles.lockedToolIcon]}>
                      <Lock size={16} color="#9CA3AF" />
                    </View>
                    <View style={styles.toolContent}>
                      <View style={styles.lockedToolHeader}>
                        <Text style={[styles.toolName, styles.lockedToolName]}>
                          {tool.name}
                        </Text>
                        <View style={styles.planBadge}>
                          <Crown size={10} color="#FFFFFF" />
                          <Text style={styles.planBadgeText}>
                            {requiredPlanInfo.displayName}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.toolDescription, styles.lockedToolDescription]}>
                        {tool.description}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Clear Selection Option */}
              {selectedTool && (
                <>
                  <View style={styles.menuDivider} />
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleClearSelection}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.clearText}>Clear selection</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* No Tools Available Message */}
              {accessibleTools.length === 0 && (
                <View style={styles.noToolsContainer}>
                  <Lock size={20} color="#9CA3AF" />
                  <Text style={styles.noToolsTitle}>Tools Locked</Text>
                  <Text style={styles.noToolsDescription}>
                    Upgrade your plan to unlock advanced AI tools
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    );
  }

  // Desktop version: Full attached container with tool name and cancel button when selected
  return (
    <View style={styles.container}>
      {selectedTool ? (
        // Desktop selected state - show tool name with cancel button
        <View 
          style={styles.desktopSelectedContainer}
          onLayout={e => setBtnHeight(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity
            onPress={toggleMenu}
            style={styles.desktopSelectedMainButton}
            activeOpacity={0.7}
          >
            <Settings2 size={16} color="#FFFFFF" />
            <Text style={styles.desktopSelectedButtonText} numberOfLines={1}>
              {selectedToolInfo?.name}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.desktopClearButton}
            onPress={handleClearSelection}
            activeOpacity={0.7}
          >
            <X size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      ) : (
        // Desktop default state - show tools button
        <TouchableOpacity
          onPress={toggleMenu}
          onLayout={e => setBtnHeight(e.nativeEvent.layout.height)}
          style={[
            styles.desktopButton,
            !hasAnyTools && styles.desktopButtonDisabled,
          ]}
          activeOpacity={0.7}
        >
          <Settings2 size={16} color={!hasAnyTools ? "#9CA3AF" : "#374151"} />
          <Text style={[
            styles.desktopButtonText,
            !hasAnyTools && styles.desktopButtonTextDisabled,
          ]}>
            Tools
          </Text>
          {!hasAnyTools && (
            <View style={styles.desktopLockBadge}>
              <Lock size={10} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Menu for desktop */}
      {menuVisible && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            onPress={() => setMenuVisible(false)}
            activeOpacity={1}
          />
          
          <View style={[styles.menu, { bottom: btnHeight + 8 }]}>
            {/* Available Tools */}
            {accessibleTools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={[
                  styles.menuItem,
                  selectedTool === tool.id && styles.selectedMenuItem
                ]}
                onPress={() => handleToolSelect(tool.id)}
                activeOpacity={0.6}
              >
                <View style={[styles.toolIcon, { backgroundColor: tool.color }]}>
                  <tool.icon size={16} color="#FFFFFF" />
                </View>
                <View style={styles.toolContent}>
                  <Text style={[
                    styles.toolName,
                    selectedTool === tool.id && styles.selectedToolName
                  ]}>
                    {tool.name}
                  </Text>
                  <Text style={styles.toolDescription}>
                    {tool.description}
                  </Text>
                </View>
                {selectedTool === tool.id && (
                  <Check size={16} color="#10B981" />
                )}
              </TouchableOpacity>
            ))}

            {/* Divider if both available and locked tools exist */}
            {accessibleTools.length > 0 && restrictedTools.length > 0 && (
              <View style={styles.menuDivider} />
            )}

            {/* Locked Tools */}
            {restrictedTools.map((tool) => {
              const requiredPlanInfo = PLAN_INFO[tool.requiredPlan];
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[styles.menuItem, styles.lockedMenuItem]}
                  onPress={() => handleToolSelect(tool.id)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.toolIcon, styles.lockedToolIcon]}>
                    <Lock size={16} color="#9CA3AF" />
                  </View>
                  <View style={styles.toolContent}>
                    <View style={styles.lockedToolHeader}>
                      <Text style={[styles.toolName, styles.lockedToolName]}>
                        {tool.name}
                      </Text>
                      <View style={styles.planBadge}>
                        <Crown size={10} color="#FFFFFF" />
                        <Text style={styles.planBadgeText}>
                          {requiredPlanInfo.displayName}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDescription, styles.lockedToolDescription]}>
                      {tool.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
            
            {/* Clear Selection Option */}
            {selectedTool && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleClearSelection}
                  activeOpacity={0.6}
                >
                  <Text style={styles.clearText}>Clear selection</Text>
                </TouchableOpacity>
              </>
            )}

            {/* No Tools Available Message */}
            {accessibleTools.length === 0 && (
              <View style={styles.noToolsContainer}>
                <Lock size={24} color="#9CA3AF" />
                <Text style={styles.noToolsTitle}>Tools Locked</Text>
                <Text style={styles.noToolsDescription}>
                  Upgrade your plan to unlock advanced AI tools like Ninja Mode, Meme Mode, and Location Mode
                </Text>
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  
  // Mobile styles - Simple button that changes color when selected
  mobileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  
  mobileButtonSelected: {
    backgroundColor: '#374151',
  },

  mobileButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },

  mobileLockBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Desktop styles - Default button
  desktopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    minWidth: 48,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },

  desktopButtonDisabled: {
    backgroundColor: '#F9FAFB',
    opacity: 0.7,
  },
  
  desktopButtonText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },

  desktopButtonTextDisabled: {
    color: '#9CA3AF',
  },

  desktopLockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Desktop selected state container
  desktopSelectedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 20,
    overflow: 'hidden',
    marginHorizontal: 4,
    minWidth: 120,
    maxWidth: 160,
  },
  
  desktopSelectedMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8,
    flex: 1,
    minWidth: 0, // Allow text to shrink
  },
  
  desktopSelectedButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
    flexShrink: 1, // Allow text to shrink if needed
  },
  
  desktopClearButton: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    width: 26,
    height: 26,
  },
  
  overlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 1001,
  },
  
  menu: {
    position: 'absolute',
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 200,
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1002,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 60,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#F9FAFB',
        },
      },
    }),
  },
  
  selectedMenuItem: {
    backgroundColor: '#F0F9FF',
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#E0F2FE',
        },
      },
    }),
  },

  lockedMenuItem: {
    opacity: 0.7,
    ...Platform.select({
      web: {
        '&:hover': {
          backgroundColor: '#FEF3F2',
        },
      },
    }),
  },
  
  toolIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },

  lockedToolIcon: {
    backgroundColor: '#F3F4F6',
  },
  
  toolContent: {
    flex: 1,
    minWidth: 0,
  },

  lockedToolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  toolName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 18,
  },
  
  selectedToolName: {
    color: '#1E40AF',
  },

  lockedToolName: {
    color: '#9CA3AF',
    flex: 1,
  },

  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },

  planBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
    textTransform: 'uppercase',
  },
  
  toolDescription: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginTop: 2,
  },

  lockedToolDescription: {
    color: '#9CA3AF',
  },
  
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 16,
  },
  
  clearText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#DC2626',
    textAlign: 'center',
    flex: 1,
  },

  // No tools available state
  noToolsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  noToolsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 4,
  },

  noToolsDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 16,
  },
});
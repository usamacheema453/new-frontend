// components/chatpage/Sidebar.js
// Enhanced with integrated scoring system

import React, { useRef, useState, useImperativeHandle } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  PanResponder,
  Modal,
  Image,
  TextInput,
} from 'react-native';
import {
  Plus,
  Shield,
  Crown,
  MessageSquare,
  Settings,
  LogOut,
  Building,
  Brain,
  Heart,
  MoreVertical,
  Trash2,
  ChevronRight,
  Search,
  X,
  Lock,
} from 'lucide-react-native';

// NEW: Import enhanced PointsScore component
import PointsScore from './PointsScore';

// Import plan access control utilities
import {
  hasFeatureAccess,
  FEATURES,
  PLAN_INFO,
} from '../../utils/planAccessManager';

const SIDEBAR_WIDTH = 280;
const COLLAPSED_SIDEBAR_WIDTH = 64;

const Sidebar = React.forwardRef(({
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
  chatHistory,
  messages,
  setMessages,
  setInput,
  setInputHeight,
  setLineCount,
  setChatHistory,
  userPlan = 'free',
  userRole,
  isUnlimitedPlan,
  isTeamAdmin,
  getPlanDisplayName,
  getQueriesRemaining,
  setShowSubscriptionModal,
  navigation,
  AsyncStorage,
  headerPaddingTop,
  handleLogout,
  goToSettings,
  onUpgrade,
  // NEW: Points scoring props
  pointsScoreRef, // Reference to the PointsScore component from parent
}, ref) => {
  const sidebarAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentSidebarWidth, setCurrentSidebarWidth] = useState(SIDEBAR_WIDTH);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);

  // NEW: Local ref for PointsScore if not provided by parent
  const localPointsScoreRef = useRef(null);
  const effectivePointsScoreRef = pointsScoreRef || localPointsScoreRef;

  // Plan access checks
  const hasLocationModeAccess = hasFeatureAccess(userPlan, FEATURES.LOCATION_MODE);
  const hasSuperShareAccess = userPlan !== 'free';
  const planInfo = PLAN_INFO[userPlan] || PLAN_INFO.free;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, { dx }) => dx < -10,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) sidebarAnim.setValue(Math.max(dx, -currentSidebarWidth));
      },
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -70) closeSidebar();
        else
          Animated.timing(sidebarAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: false,
          }).start();
      },
    })
  ).current;

  React.useEffect(() => {
    if (isSidebarOpen) {
      Animated.timing(sidebarAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start();
    }
  }, [isSidebarOpen]);

  React.useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chatHistory);
    } else {
      const filtered = chatHistory.filter(chat =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chatHistory]);

  const toggleSidebar = () => {
    if (isMobile) return;
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    setCurrentSidebarWidth(newCollapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH);
  };

  useImperativeHandle(ref, () => ({
    toggleSidebar,
    isCollapsed,
    currentWidth: currentSidebarWidth,
    // NEW: Expose points score methods
    addPoints: (points, sourcePosition) => {
      if (effectivePointsScoreRef?.current) {
        effectivePointsScoreRef.current.addPoints(points, sourcePosition);
      }
    },
    getPoints: () => {
      return effectivePointsScoreRef?.current?.getPoints() || 0;
    },
    pointsScoreRef: effectivePointsScoreRef,
  }));

  const closeSidebar = () => {
    const targetWidth = isCollapsed ? COLLAPSED_SIDEBAR_WIDTH : SIDEBAR_WIDTH;
    Animated.timing(sidebarAnim, {
      toValue: -targetWidth,
      duration: 180,
      useNativeDriver: false,
    }).start(() => setIsSidebarOpen(false));
  };

  const handleNewChat = async () => {
    if (messages.length > 0) {
      const newChat = {
        id: Date.now().toString(),
        title:
          (messages.find((m) => m.role === 'user')?.content.slice(0, 50) || 'New Chat') + '...',
        date: new Date().toLocaleDateString(),
      };
      const updated = [newChat, ...chatHistory];
      setChatHistory(updated);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updated));
    }
    setMessages([]);
    setInput('');
    setInputHeight(40);
    setLineCount(1);
    if (isMobile) closeSidebar();
  };

  const handleSettingsClick = () => {
    if (goToSettings) goToSettings();
    else navigation.navigate('Settings');
    if (isMobile) closeSidebar();
  };

  const handleLogoutClick = async () => {
    if (handleLogout) handleLogout();
    else {
      await AsyncStorage.multiRemove([
        'isAuthenticated',
        'freeQueries',
        'userPlan',
        'userRole',
        'userEmail',
        'userName',
        'chatHistory',
        'userPoints', // NEW: Clear user points on logout
      ]);
      navigation.navigate('Login');
    }
    if (isMobile) closeSidebar();
  };

  // Enhanced handlers with plan restrictions
  const handleManageLocationMode = () => {
    if (!hasLocationModeAccess) {
      if (onUpgrade) {
        onUpgrade('team');
      } else {
        setShowSubscriptionModal(true);
      }
      if (isMobile) closeSidebar();
      return;
    }
    
    navigation.navigate('ManageLocationMode');
    if (isMobile) closeSidebar();
  };

  const handleManageBrain = () => {
    // NEW: Pass pointsScoreRef to ManageBrain for scoring integration
    navigation.navigate('ManageBrain', { 
      pointsScoreRef: effectivePointsScoreRef 
    });
    if (isMobile) closeSidebar();
  };

  const handleSuperShare = () => {
    if (!hasSuperShareAccess) {
      if (onUpgrade) {
        onUpgrade('solo');
      } else {
        setShowSubscriptionModal(true);
      }
      if (isMobile) closeSidebar();
      return;
    }
    
    navigation.navigate('SuperShare');
    if (isMobile) closeSidebar();
  };

  const handleDeleteChat = async () => {
    if (chatToDelete) {
      const updated = chatHistory.filter((c) => c.id !== chatToDelete.id);
      setChatHistory(updated);
      await AsyncStorage.setItem('chatHistory', JSON.stringify(updated));
    }
    setShowDeleteModal(false);
    setChatToDelete(null);
  };

  const handleSearchClick = () => {
    setIsSearchMode(true);
    setSearchQuery('');
    setFilteredChats(chatHistory);
  };

  const handleSearchClose = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    setFilteredChats([]);
  };

  // NEW: Handle score updates (optional callback)
  const handleScoreUpdate = (newScore, increment, sourcePosition) => {
    console.log(`🎯 Score updated: +${increment} points (Total: ${newScore})`);
    // You can add additional logic here, like sending to analytics
  };

  const renderTooltip = (text, isVisible) => {
    if (!isVisible || !isCollapsed || isMobile) return null;
    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipText}>{text}</Text>
      </View>
    );
  };

  const renderSidebarContent = () => (
    <View style={[styles.sidebarContent, isMobile && styles.sidebarContentMobile]}>
      {/* Header with Enhanced PointsScore */}
      <View style={[styles.header, isCollapsed && !isMobile && styles.headerCollapsed]}>
        {isSearchMode ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={16} color="#9CA3AF" style={styles.searchInputIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search conversations..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.searchCloseButton} onPress={handleSearchClose}>
                <X size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.brandContainer}>
            {/* NEW: Enhanced PointsScore with scoring integration */}
            <PointsScore 
              ref={effectivePointsScoreRef}
              isCollapsed={isCollapsed && !isMobile}
              AsyncStorage={AsyncStorage}
              onScoreUpdate={handleScoreUpdate}
              style={isCollapsed && !isMobile ? styles.collapsedScoreContainer : styles.expandedScoreContainer}
            />
            
            {((!isMobile && !isCollapsed) || isMobile) && (
              <TouchableOpacity 
                style={styles.searchIconContainer}
                onPress={handleSearchClick}
              >
                <Search size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* New Chat */}
      {!isSearchMode && (
        <View style={[styles.actionSection, isCollapsed && !isMobile && styles.actionSectionCollapsed]}>
          <View style={styles.actionItemWrapper}>
            <TouchableOpacity
              style={[
                styles.newChatButton,
                !isMobile && isCollapsed && styles.newChatButtonCollapsed,
                hoveredItem === 'newchat' && styles.newChatButtonHover,
              ]}
              onPress={handleNewChat}
              onMouseEnter={() => { setHoveredTooltip('newchat'); setHoveredItem('newchat'); }}
              onMouseLeave={() => { setHoveredTooltip(null); setHoveredItem(null); }}
            >
              <Plus size={20} color="#FFFFFF" />
              {((!isMobile && !isCollapsed) || isMobile) && (
                <Text style={styles.newChatText}>New Chat</Text>
              )}
            </TouchableOpacity>
            {renderTooltip('New Chat', hoveredTooltip === 'newchat')}
          </View>
        </View>
      )}

      {/* Navigation Items */}
      {!isSearchMode && (
        <View style={[styles.navigationSection, isCollapsed && !isMobile && styles.navigationSectionCollapsed]}>
          {/* Admin Portal - Team Admins Only */}
          {isTeamAdmin && !isMobile && (
            <View style={styles.navItemWrapper}>
              <TouchableOpacity
                style={[
                  styles.navItem,
                  !isMobile && isCollapsed && styles.navItemCollapsed,
                  hoveredItem === 'admin' && styles.navItemHover,
                ]}
                onPress={() => { navigation.navigate('Admin'); if (isMobile) closeSidebar(); }}
                onMouseEnter={() => { setHoveredTooltip('admin'); setHoveredItem('admin'); }}
                onMouseLeave={() => { setHoveredTooltip(null); setHoveredItem(null); }}
              >
                <View style={[styles.navItemContent, !isMobile && isCollapsed && styles.navItemContentCollapsed]}>
                  <View style={[styles.navIconWrapper, !isMobile && isCollapsed && styles.iconWrapperCollapsed]}>
                    <Shield size={20} color="#4B5563" />
                  </View>
                  {((!isMobile && !isCollapsed) || isMobile) && <Text style={styles.navText}>Admin Portal</Text>}
                </View>
                {((!isMobile && !isCollapsed) || isMobile) && <ChevronRight size={16} color="#D1D5DB" />}
              </TouchableOpacity>
              {renderTooltip('Admin Portal', hoveredTooltip === 'admin')}
            </View>
          )}

          {/* Location Mode - Team+ Only */}
          <View style={styles.navItemWrapper}>
            <TouchableOpacity
              style={[
                styles.navItem,
                !isMobile && isCollapsed && styles.navItemCollapsed,
                hoveredItem === 'location' && styles.navItemHover,
                !hasLocationModeAccess && styles.navItemRestricted,
              ]}
              onPress={handleManageLocationMode}
              onMouseEnter={() => { setHoveredTooltip('location'); setHoveredItem('location'); }}
              onMouseLeave={() => { setHoveredTooltip(null); setHoveredItem(null); }}
            >
              <View style={[styles.navItemContent, !isMobile && isCollapsed && styles.navItemContentCollapsed]}>
                <View style={[
                  styles.navIconWrapper, 
                  !isMobile && isCollapsed && styles.iconWrapperCollapsed,
                  !hasLocationModeAccess && styles.lockedIconWrapper,
                ]}>
                  <Building size={20} color={hasLocationModeAccess ? "#4B5563" : "#9CA3AF"} />
                  {!hasLocationModeAccess && (
                    <View style={styles.lockBadge}>
                      <Lock size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {((!isMobile && !isCollapsed) || isMobile) && (
                  <View style={styles.navTextContainer}>
                    <Text style={[styles.navText, !hasLocationModeAccess && styles.navTextRestricted]}>
                      Location Mode
                    </Text>
                    {!hasLocationModeAccess && (
                      <View style={styles.requiredPlanBadge}>
                        <Crown size={10} color="#FFFFFF" />
                        <Text style={styles.requiredPlanText}>TEAM</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              {((!isMobile && !isCollapsed) || isMobile) && (
                <ChevronRight size={16} color={hasLocationModeAccess ? "#D1D5DB" : "#9CA3AF"} />
              )}
            </TouchableOpacity>
            {renderTooltip(
              hasLocationModeAccess ? 'Location Manager' : 'Location Mode (Team+ Required)', 
              hoveredTooltip === 'location'
            )}
          </View>

          {/* Manage Brain - Available to All */}
          <View style={styles.navItemWrapper}>
            <TouchableOpacity
              style={[
                styles.navItem,
                !isMobile && isCollapsed && styles.navItemCollapsed,
                hoveredItem === 'brain' && styles.navItemHover,
              ]}
              onPress={handleManageBrain}
              onMouseEnter={() => { setHoveredTooltip('brain'); setHoveredItem('brain'); }}
              onMouseLeave={() => { setHoveredTooltip(null); setHoveredItem(null); }}
            >
              <View style={[styles.navItemContent, !isMobile && isCollapsed && styles.navItemContentCollapsed]}>
                <View style={[styles.navIconWrapper, !isMobile && isCollapsed && styles.iconWrapperCollapsed]}>
                  <Brain size={20} color="#4B5563" />
                </View>
                {((!isMobile && !isCollapsed) || isMobile) && <Text style={styles.navText}>Manage Brain</Text>}
              </View>
              {((!isMobile && !isCollapsed) || isMobile) && <ChevronRight size={16} color="#D1D5DB" />}
            </TouchableOpacity>
            {renderTooltip('Brain', hoveredTooltip === 'brain')}
          </View>

          {/* Super Share - Solo+ Only */}
          <View style={styles.navItemWrapper}>
            <TouchableOpacity
              style={[
                styles.navItem,
                !isMobile && isCollapsed && styles.navItemCollapsed,
                hoveredItem === 'share' && styles.navItemHover,
                !hasSuperShareAccess && styles.navItemRestricted,
              ]}
              onPress={handleSuperShare}
              onMouseEnter={() => { setHoveredTooltip('share'); setHoveredItem('share'); }}
              onMouseLeave={() => { setHoveredTooltip(null); setHoveredItem(null); }}
            >
              <View style={[styles.navItemContent, !isMobile && isCollapsed && styles.navItemContentCollapsed]}>
                <View style={[
                  hasSuperShareAccess ? styles.specialNavIconWrapper : styles.navIconWrapper,
                  !isMobile && isCollapsed && styles.iconWrapperCollapsed,
                  !hasSuperShareAccess && styles.lockedIconWrapper,
                ]}>
                  <Heart size={20} color={hasSuperShareAccess ? "#7C3AED" : "#9CA3AF"} />
                  {!hasSuperShareAccess && (
                    <View style={styles.lockBadge}>
                      <Lock size={8} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                {((!isMobile && !isCollapsed) || isMobile) && (
                  <View style={styles.navTextContainer}>
                    <Text style={[
                      hasSuperShareAccess ? styles.specialNavText : styles.navTextRestricted
                    ]}>
                      Super Share
                    </Text>
                    {!hasSuperShareAccess && (
                      <View style={styles.requiredPlanBadge}>
                        <Crown size={10} color="#FFFFFF" />
                        <Text style={styles.requiredPlanText}>SOLO</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
              {((!isMobile && !isCollapsed) || isMobile) && (
                <ChevronRight size={16} color={hasSuperShareAccess ? "#7C3AED" : "#9CA3AF"} />
              )}
            </TouchableOpacity>
            {renderTooltip(
              hasSuperShareAccess ? 'Super Share' : 'Super Share (Solo+ Required)', 
              hoveredTooltip === 'share'
            )}
          </View>

          {/* Mobile-only Settings */}
          {isMobile && (
            <>
              <View style={styles.divider} />

              <TouchableOpacity
                style={[styles.navItem, hoveredItem === 'settings' && styles.navItemHover]}
                onPress={handleSettingsClick}
                onMouseEnter={() => setHoveredItem('settings')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <View style={styles.navItemContent}>
                  <View style={styles.navIconWrapper}>
                    <Settings size={20} color="#4B5563" />
                  </View>
                  <Text style={styles.navText}>Settings</Text>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Chat History - Existing implementation */}
      {((isMobile || (!isMobile && !isCollapsed)) || isSearchMode) && (
        <View style={styles.historySection}>
          <View style={styles.historySectionHeader}>
            <Text style={styles.historyTitle}>
              {isSearchMode ? 'Search Results' : 'Recent'}
            </Text>
            {(isSearchMode ? filteredChats.length : chatHistory.length) > 0 && (
              <Text style={styles.historyCount}>
                {isSearchMode ? filteredChats.length : chatHistory.length}
              </Text>
            )}
          </View>
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {(isSearchMode ? filteredChats : chatHistory).length === 0 ? (
              <View style={styles.emptyHistory}>
                <MessageSquare size={20} color="#D1D5DB" />
                <Text style={styles.emptyHistoryText}>
                  {isSearchMode ? 'No matching conversations' : 'No conversations yet'}
                </Text>
                <Text style={styles.emptyHistorySubtext}>
                  {isSearchMode ? 'Try a different search term' : 'Start a new chat to begin'}
                </Text>
              </View>
            ) : (
              (isSearchMode ? filteredChats : chatHistory).map((chat, index) => (
                <View key={chat.id} style={[
                  styles.historyItem,
                  { zIndex: (isSearchMode ? filteredChats : chatHistory).length - index + 1000 }
                ]}>
                  <TouchableOpacity
                    style={[
                      styles.historyItemButton,
                      hoveredItem === `chat-${chat.id}` && styles.historyItemHover,
                    ]}
                    onPress={() => { if (isMobile) closeSidebar(); }}
                    onMouseEnter={() => setHoveredItem(`chat-${chat.id}`)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <View style={styles.historyItemIcon}>
                      <MessageSquare size={14} color="#9CA3AF" />
                    </View>
                    <View style={styles.historyItemContent}>
                      <Text style={styles.historyItemTitle} numberOfLines={1}>
                        {chat.title.replace('...', '')}
                      </Text>
                      <Text style={styles.historyItemDate}>{chat.date}</Text>
                    </View>
                  </TouchableOpacity>
                  {!isSearchMode && (
                    <TouchableOpacity
                      style={styles.historyItemAction}
                      onPress={() => setSelectedChatId(chat.id === selectedChatId ? null : chat.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <MoreVertical size={14} color="#D1D5DB" />
                    </TouchableOpacity>
                  )}
                  {selectedChatId === chat.id && !isSearchMode && (
                    <View style={[
                      styles.actionMenu,
                      { zIndex: (isSearchMode ? filteredChats : chatHistory).length - index + 2000 }
                    ]}>
                      <TouchableOpacity
                        style={styles.actionMenuItem}
                        onPress={() => { setChatToDelete(chat); setShowDeleteModal(true); setSelectedChatId(null); }}
                      >
                        <Trash2 size={14} color="#EF4444" />
                        <Text style={styles.actionMenuText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Plan Status - Desktop Only */}
      {!isSearchMode && !isMobile && (
        <View style={[styles.planSection, isCollapsed && styles.planSectionCollapsed]}>
          <TouchableOpacity
            style={[
              styles.planCard,
              isCollapsed && styles.planCardCollapsed,
              hoveredItem === 'plan' && styles.planCardHover,
            ]}
            onPress={() => !isUnlimitedPlan && setShowSubscriptionModal(true)}
            onMouseEnter={() => setHoveredItem('plan')}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {!isCollapsed ? (
              <>
                <View style={styles.planCardHeader}>
                  <View style={styles.planIconContainer}>
                    <Crown size={16} color="#f9bc34" />
                  </View>
                  <View style={styles.planDetails}>
                    <Text style={styles.planName}>{getPlanDisplayName(userPlan)}</Text>
                    <Text style={styles.planSubtitle}>
                      {isUnlimitedPlan ? 'Unlimited queries' : getQueriesRemaining()}
                    </Text>
                  </View>
                  {userRole === 'team_admin' && !isMobile && (
                    <View style={styles.adminTag}>
                      <Text style={styles.adminTagText}>ADMIN</Text>
                    </View>
                  )}
                </View>
                {!isUnlimitedPlan && (
                  <TouchableOpacity
                    style={styles.planUpgradeButton}
                    onPress={() => setShowSubscriptionModal(true)}
                  >
                    <Text style={styles.planUpgradeText}>
                      {userPlan === 'free' ? 'Upgrade Plan' : 'Upgrade'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.planIconContainerCollapsed}>
                <Crown size={16} color="#f9bc34" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        transparent
        visible={showDeleteModal}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDeleteModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Delete conversation?</Text>
                <Text style={styles.modalDescription}>
                  This will permanently delete this conversation. This action cannot be undone.
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setShowDeleteModal(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalDeleteButton}
                    onPress={handleDeleteChat}
                  >
                    <Text style={styles.modalDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  // Desktop
  if (!isMobile) {
    return <View style={[styles.sidebar, { width: currentSidebarWidth }]}>{renderSidebarContent()}</View>;
  }

  // Mobile overlay
  return (
    isSidebarOpen && (
      <View style={styles.mobileOverlay}>
        <TouchableWithoutFeedback onPress={closeSidebar}>
          <View style={styles.mobileBackdrop} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.mobileSidebar,
            { left: sidebarAnim, paddingTop: headerPaddingTop, width: SIDEBAR_WIDTH },
          ]}
          {...panResponder.panHandlers}
        >
          {renderSidebarContent()}
        </Animated.View>
      </View>
    )
  );
});

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarContentMobile: {
    flex: 1,
    paddingBottom: 34,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  headerCollapsed: {
    paddingHorizontal: 8,
    paddingVertical: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  // NEW: Enhanced score container styles
  expandedScoreContainer: {
    flex: 1,
  },
  collapsedScoreContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconContainer: {
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    width: '100%',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInputIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    outlineStyle: 'none',
    outlineWidth: 0,
  },
  searchCloseButton: {
    padding: 4,
    marginLeft: 8,
  },
  actionSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionSectionCollapsed: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionItemWrapper: {
    position: 'relative',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 12,
    borderRadius: 10,
  },
  newChatButtonCollapsed: {
    width: 40,
    height: 40,
    padding: 0,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonHover: {
    backgroundColor: '#1f1f1f',
  },
  newChatText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  navigationSection: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navigationSectionCollapsed: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  navItemWrapper: {
    position: 'relative',
    marginVertical: 2,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    minHeight: 48,
  },
  navItemCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    padding: 0,
    minHeight: 40,
  },
  navItemHover: {
    backgroundColor: '#F9F4FB',
  },
  navItemRestricted: {
    opacity: 0.7,
  },
  navItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navItemContentCollapsed: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 0,
    width: '100%',
    height: '100%',
  },
  navIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginRight: 12,
    position: 'relative',
  },
  specialNavIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E0E7FF',
    position: 'relative',
  },
  lockedIconWrapper: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconWrapperCollapsed: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
    marginRight: 0,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 32,
    paddingVertical: 2,
  },
  navText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 2,
  },
  navTextRestricted: {
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 2,
  },
  specialNavText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
    lineHeight: 18,
    marginBottom: 2,
  },
  requiredPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 0,
    maxWidth: '100%',
  },
  requiredPlanText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 2,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 8,
  },
  tooltip: {
    position: 'absolute',
    left: 60,
    top: '50%',
    transform: [{ translateY: -12 }],
    backgroundColor: '#000000',
    padding: 4,
    borderRadius: 6,
    zIndex: 10003,
    elevation: 14,
  },
  tooltipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  historySection: {
    flex: 1,
    padding: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  historyCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#D1D5DB',
  },
  historyList: {
    flex: 1,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 32,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
    marginVertical: 8,
  },
  emptyHistorySubtext: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  historyItem: {
    marginVertical: 4,
    position: 'relative',
  },
  historyItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingRight: 36,
    borderRadius: 8,
  },
  historyItemHover: {
    backgroundColor: '#F9F4FB',
  },
  historyItemIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9FB',
    marginRight: 10,
  },
  historyItemContent: {
    flex: 1,
  },
  historyItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyItemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  historyItemAction: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionMenu: {
    position: 'absolute',
    right: 0,
    top: 32,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 4,
    minWidth: 80,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  actionMenuText: {
    fontSize: 13,
    color: '#EF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  planSection: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    padding: 12,
  },
  planSectionCollapsed: {
    alignItems: 'center',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planCardCollapsed: {
    padding: 12,
    borderRadius: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  planCardHover: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  planIconContainer: {
    marginRight: 8,
  },
  planIconContainerCollapsed: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  planDetails: {
    flex: 1,
  },
  planName: {
    color: '#000000',
    fontWeight: '600',
  },
  planSubtitle: {
    color: '#6B7280',
    fontSize: 12,
  },
  adminTag: {
    backgroundColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  planUpgradeButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 8,
    borderRadius: 8,
  },
  planUpgradeText: {
    color: '#000000',
    fontSize: 12,
    textAlign: 'center',
  },
  mobileOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 10,
  },
  mobileBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  mobileSidebar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#FAFAFA',
    zIndex: 10000,
    elevation: 11,
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10001,
    elevation: 12,
  },
  modalContainer: {
    width: 320,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    zIndex: 10002,
    elevation: 13,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: '#F9F4FB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalCancelText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDeleteText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default Sidebar;
export { SIDEBAR_WIDTH, COLLAPSED_SIDEBAR_WIDTH };
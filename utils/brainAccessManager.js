// utils/brainAccessManager.js

/**
 * Brain Access Manager
 * Manages user brain access requests and approval status
 * Note: In React Native, import AsyncStorage as: import AsyncStorage from '@react-native-async-storage/async-storage';
 */

// For demo purposes, we'll use a simple in-memory storage
// In real app, replace with AsyncStorage
let memoryStorage = {};

const setItem = async (key, value) => {
  try {
    // In real app: await AsyncStorage.setItem(key, value);
    memoryStorage[key] = value;
  } catch (error) {
    console.error('Error setting item:', error);
  }
};

const getItem = async (key) => {
  try {
    // In real app: return await AsyncStorage.getItem(key);
    return memoryStorage[key] || null;
  } catch (error) {
    console.error('Error getting item:', error);
    return null;
  }
};

const multiRemove = async (keys) => {
  try {
    // In real app: await AsyncStorage.multiRemove(keys);
    keys.forEach(key => delete memoryStorage[key]);
  } catch (error) {
    console.error('Error removing items:', error);
  }
};

/**
 * Brain Access Manager
 * Manages user brain access requests and approval status
 */

// Brain access statuses
export const BRAIN_ACCESS_STATUS = {
  NONE: 'none',           // User has never requested brain access
  REQUESTED: 'requested', // User has requested, waiting for approval
  APPROVED: 'approved',   // Super Engineer approved the request
  REJECTED: 'rejected',   // Super Engineer rejected the request
};

// Storage keys
const STORAGE_KEYS = {
  BRAIN_STATUS: 'brainAccessStatus',
  REQUEST_DATE: 'brainRequestDate',
  APPROVAL_DATE: 'brainApprovalDate',
  REJECTION_DATE: 'brainRejectionDate',
  REJECTION_REASON: 'brainRejectionReason',
};

/**
 * Get current brain access status for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Brain access status and metadata
 */
export const getBrainAccessStatus = async (userId) => {
  try {
    // First check local storage
    const localStatus = await getItem(STORAGE_KEYS.BRAIN_STATUS);
    const requestDate = await getItem(STORAGE_KEYS.REQUEST_DATE);
    const approvalDate = await getItem(STORAGE_KEYS.APPROVAL_DATE);
    const rejectionDate = await getItem(STORAGE_KEYS.REJECTION_DATE);
    const rejectionReason = await getItem(STORAGE_KEYS.REJECTION_REASON);

    // In real app, also check with backend API for latest status
    // const apiStatus = await api.getBrainAccessStatus(userId);
    
    const status = {
      status: localStatus || BRAIN_ACCESS_STATUS.NONE,
      requestDate: requestDate ? new Date(requestDate) : null,
      approvalDate: approvalDate ? new Date(approvalDate) : null,
      rejectionDate: rejectionDate ? new Date(rejectionDate) : null,
      rejectionReason: rejectionReason || null,
      hasRequested: localStatus !== BRAIN_ACCESS_STATUS.NONE && localStatus !== null,
      isApproved: localStatus === BRAIN_ACCESS_STATUS.APPROVED,
      isPending: localStatus === BRAIN_ACCESS_STATUS.REQUESTED,
      isRejected: localStatus === BRAIN_ACCESS_STATUS.REJECTED,
    };

    return status;
  } catch (error) {
    console.error('Error getting brain access status:', error);
    return {
      status: BRAIN_ACCESS_STATUS.NONE,
      hasRequested: false,
      isApproved: false,
      isPending: false,
      isRejected: false,
    };
  }
};

/**
 * Request brain access for user
 * @param {string} userId - User ID
 * @param {Object} userInfo - Additional user information
 * @returns {Promise<Object>} Request result
 */
export const requestBrainAccess = async (userId, userInfo = {}) => {
  try {
    // Check if user has already requested
    const currentStatus = await getBrainAccessStatus(userId);
    
    if (currentStatus.hasRequested) {
      throw new Error('Brain access already requested');
    }

    const requestData = {
      userId,
      requestedAt: new Date().toISOString(),
      userInfo,
      platform: 'mobile',
      version: '1.0',
    };

    // In real app, send to backend API
    // const response = await api.requestBrainAccess(requestData);
    
    // Store locally
    await setItem(STORAGE_KEYS.BRAIN_STATUS, BRAIN_ACCESS_STATUS.REQUESTED);
    await setItem(STORAGE_KEYS.REQUEST_DATE, requestData.requestedAt);

    // Send notification to super engineers
    await notifySuperEngineersOfRequest(requestData);

    return {
      success: true,
      requestId: generateRequestId(),
      estimatedApprovalTime: '4-6 hours',
      message: 'Brain access request submitted successfully',
    };
  } catch (error) {
    console.error('Error requesting brain access:', error);
    throw error;
  }
};

/**
 * Approve brain access (Super Engineer function)
 * @param {string} userId - User ID to approve
 * @param {string} engineerId - Super Engineer ID
 * @param {string} notes - Optional approval notes
 * @returns {Promise<Object>} Approval result
 */
export const approveBrainAccess = async (userId, engineerId, notes = '') => {
  try {
    const approvalData = {
      userId,
      engineerId,
      approvedAt: new Date().toISOString(),
      notes,
    };

    // In real app, send to backend API
    // await api.approveBrainAccess(approvalData);

    // Update local storage for the user
    await setItem(STORAGE_KEYS.BRAIN_STATUS, BRAIN_ACCESS_STATUS.APPROVED);
    await setItem(STORAGE_KEYS.APPROVAL_DATE, approvalData.approvedAt);

    // Setup brain environment for user
    await setupUserBrainEnvironment(userId);

    // Notify user of approval
    await notifyUserOfApproval(userId, notes);

    return {
      success: true,
      approvalData,
      message: 'Brain access approved successfully',
    };
  } catch (error) {
    console.error('Error approving brain access:', error);
    throw error;
  }
};

/**
 * Reject brain access (Super Engineer function)
 * @param {string} userId - User ID to reject
 * @param {string} engineerId - Super Engineer ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<Object>} Rejection result
 */
export const rejectBrainAccess = async (userId, engineerId, reason) => {
  try {
    const rejectionData = {
      userId,
      engineerId,
      rejectedAt: new Date().toISOString(),
      reason,
    };

    // In real app, send to backend API
    // await api.rejectBrainAccess(rejectionData);

    // Update local storage
    await setItem(STORAGE_KEYS.BRAIN_STATUS, BRAIN_ACCESS_STATUS.REJECTED);
    await setItem(STORAGE_KEYS.REJECTION_DATE, rejectionData.rejectedAt);
    await setItem(STORAGE_KEYS.REJECTION_REASON, reason);

    // Notify user of rejection
    await notifyUserOfRejection(userId, reason);

    return {
      success: true,
      rejectionData,
      message: 'Brain access rejected',
    };
  } catch (error) {
    console.error('Error rejecting brain access:', error);
    throw error;
  }
};

/**
 * Check if user can access brain features
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user can access brain
 */
export const canAccessBrain = async (userId) => {
  try {
    const status = await getBrainAccessStatus(userId);
    return status.isApproved;
  } catch (error) {
    console.error('Error checking brain access:', error);
    return false;
  }
};

/**
 * Get brain access statistics (for admin dashboard)
 * @returns {Promise<Object>} Access statistics
 */
export const getBrainAccessStats = async () => {
  try {
    // In real app, get from backend API
    // const stats = await api.getBrainAccessStats();
    
    // Mock data for demo
    return {
      totalRequests: 45,
      pendingRequests: 12,
      approvedRequests: 28,
      rejectedRequests: 5,
      avgApprovalTime: '3.2 hours',
      activeUsers: 28,
    };
  } catch (error) {
    console.error('Error getting brain access stats:', error);
    return {};
  }
};

/**
 * Reset brain access status (for testing/admin)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const resetBrainAccess = async (userId) => {
  try {
    // Clear all local storage
    await multiRemove([
      STORAGE_KEYS.BRAIN_STATUS,
      STORAGE_KEYS.REQUEST_DATE,
      STORAGE_KEYS.APPROVAL_DATE,
      STORAGE_KEYS.REJECTION_DATE,
      STORAGE_KEYS.REJECTION_REASON,
    ]);

    // In real app, also clear backend data
    // await api.resetBrainAccess(userId);

    console.log(`Brain access reset for user: ${userId}`);
  } catch (error) {
    console.error('Error resetting brain access:', error);
    throw error;
  }
};

/**
 * Get waiting time since request
 * @param {string} userId - User ID
 * @returns {Promise<string>} Human readable waiting time
 */
export const getWaitingTime = async (userId) => {
  try {
    const status = await getBrainAccessStatus(userId);
    
    if (!status.requestDate) {
      return null;
    }

    const now = new Date();
    const diffMs = now - status.requestDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ago`;
    } else {
      return `${diffMinutes}m ago`;
    }
  } catch (error) {
    console.error('Error calculating waiting time:', error);
    return null;
  }
};

// Helper functions

/**
 * Generate unique request ID
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Setup brain environment for approved user
 */
const setupUserBrainEnvironment = async (userId) => {
  try {
    // In real app, this would:
    // - Create user's brain storage space
    // - Initialize search indexes
    // - Setup AI embeddings
    // - Configure permissions
    // - Create default folders/categories
    
    console.log(`Setting up brain environment for user: ${userId}`);
  } catch (error) {
    console.error('Error setting up brain environment:', error);
  }
};

/**
 * Notify super engineers of new request
 */
const notifySuperEngineersOfRequest = async (requestData) => {
  try {
    // In real app, send notifications via:
    // - Push notifications
    // - Email alerts
    // - Slack/Teams messages
    // - Dashboard updates
    
    console.log('Notifying super engineers of brain access request');
  } catch (error) {
    console.error('Error notifying super engineers:', error);
  }
};

/**
 * Notify user of approval
 */
const notifyUserOfApproval = async (userId, notes) => {
  try {
    // In real app, send user notifications
    console.log(`Notifying user ${userId} of brain access approval`);
  } catch (error) {
    console.error('Error notifying user of approval:', error);
  }
};

/**
 * Notify user of rejection
 */
const notifyUserOfRejection = async (userId, reason) => {
  try {
    // In real app, send user notifications with feedback
    console.log(`Notifying user ${userId} of brain access rejection: ${reason}`);
  } catch (error) {
    console.error('Error notifying user of rejection:', error);
  }
};

// Export all functions
export default {
  getBrainAccessStatus,
  requestBrainAccess,
  approveBrainAccess,
  rejectBrainAccess,
  canAccessBrain,
  getBrainAccessStats,
  resetBrainAccess,
  getWaitingTime,
  BRAIN_ACCESS_STATUS,
};
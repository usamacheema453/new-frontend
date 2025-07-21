// components/brain/BrainAccessDemo.js

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {
  Settings,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from 'lucide-react-native';

import { 
  getBrainAccessStatus, 
  resetBrainAccess, 
  approveBrainAccess, 
  rejectBrainAccess,
  BRAIN_ACCESS_STATUS 
} from '../utils/brainAccessManager';

/**
 * Demo component for testing brain access states
 * This should only be used in development/testing
 */
const BrainAccessDemo = ({ userId = 'demo-user', visible, onClose }) => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get current status
  const checkStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getBrainAccessStatus(userId);
      setCurrentStatus(status);
      console.log('Current brain access status:', status);
    } catch (error) {
      console.error('Error checking status:', error);
      Alert.alert('Error', 'Failed to check status');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to new user state
  const resetToNewUser = async () => {
    try {
      setIsLoading(true);
      await resetBrainAccess(userId);
      Alert.alert('Success', 'Reset to new user state. User will see request popup on next brain access.');
      await checkStatus();
    } catch (error) {
      console.error('Error resetting:', error);
      Alert.alert('Error', 'Failed to reset status');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Super Engineer approval
  const simulateApproval = async () => {
    try {
      setIsLoading(true);
      await approveBrainAccess(userId, 'demo-super-engineer', 'Approved for testing');
      Alert.alert('Success', 'Brain access approved! User can now access all brain features.');
      await checkStatus();
    } catch (error) {
      console.error('Error approving:', error);
      Alert.alert('Error', 'Failed to approve access');
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate Super Engineer rejection
  const simulateRejection = async () => {
    try {
      setIsLoading(true);
      await rejectBrainAccess(userId, 'demo-super-engineer', 'Insufficient permissions for demo');
      Alert.alert('Success', 'Brain access rejected. User will see rejection message.');
      await checkStatus();
    } catch (error) {
      console.error('Error rejecting:', error);
      Alert.alert('Error', 'Failed to reject access');
    } finally {
      setIsLoading(false);
    }
  };

  // Get status color and label
  const getStatusInfo = (status) => {
    switch (status) {
      case BRAIN_ACCESS_STATUS.NONE:
        return { color: '#9CA3AF', label: 'New User', icon: User };
      case BRAIN_ACCESS_STATUS.REQUESTED:
        return { color: '#F59E0B', label: 'Pending', icon: Clock };
      case BRAIN_ACCESS_STATUS.APPROVED:
        return { color: '#10B981', label: 'Approved', icon: CheckCircle };
      case BRAIN_ACCESS_STATUS.REJECTED:
        return { color: '#DC2626', label: 'Rejected', icon: XCircle };
      default:
        return { color: '#9CA3AF', label: 'Unknown', icon: User };
    }
  };

  React.useEffect(() => {
    if (visible) {
      checkStatus();
    }
  }, [visible]);

  if (!visible) return null;

  const statusInfo = currentStatus ? getStatusInfo(currentStatus.status) : null;
  const StatusIcon = statusInfo?.icon || User;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Settings size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.title}>Brain Access Demo</Text>
            <Text style={styles.subtitle}>Test different user states</Text>
          </View>

          {/* Current Status */}
          <View style={styles.statusSection}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            {currentStatus ? (
              <View style={styles.statusCard}>
                <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
                  <StatusIcon size={20} color="#FFFFFF" />
                </View>
                <View style={styles.statusDetails}>
                  <Text style={styles.statusLabel}>{statusInfo.label}</Text>
                  <Text style={styles.statusValue}>{currentStatus.status}</Text>
                  {currentStatus.requestDate && (
                    <Text style={styles.statusMeta}>
                      Requested: {currentStatus.requestDate.toLocaleString()}
                    </Text>
                  )}
                  {currentStatus.approvalDate && (
                    <Text style={styles.statusMeta}>
                      Approved: {currentStatus.approvalDate.toLocaleString()}
                    </Text>
                  )}
                  {currentStatus.rejectionDate && (
                    <Text style={styles.statusMeta}>
                      Rejected: {currentStatus.rejectionDate.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            ) : (
              <Text style={styles.loading}>Loading status...</Text>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>Test Actions</Text>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.resetButton]}
              onPress={resetToNewUser}
              disabled={isLoading}
            >
              <RotateCcw size={18} color="#DC2626" />
              <Text style={[styles.actionText, styles.resetText]}>
                Reset to New User
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={simulateApproval}
              disabled={isLoading || currentStatus?.status !== BRAIN_ACCESS_STATUS.REQUESTED}
            >
              <CheckCircle size={18} color="#FFFFFF" />
              <Text style={[styles.actionText, styles.approveText]}>
                Simulate Approval
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={simulateRejection}
              disabled={isLoading || currentStatus?.status !== BRAIN_ACCESS_STATUS.REQUESTED}
            >
              <XCircle size={18} color="#FFFFFF" />
              <Text style={[styles.actionText, styles.rejectText]}>
                Simulate Rejection
              </Text>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>How to test:</Text>
            <Text style={styles.instructionsText}>
              1. Reset to new user state{'\n'}
              2. Go back and click on Brain icon{'\n'}
              3. Submit brain request{'\n'}
              4. Return here to approve/reject{'\n'}
              5. Test different user experiences
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    maxWidth: 480,
    width: '100%',
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  statusSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statusDetails: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  statusMeta: {
    fontSize: 12,
    color: '#999999',
  },
  loading: {
    textAlign: 'center',
    color: '#666666',
    fontStyle: 'italic',
  },
  actionsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 8,
  },
  resetButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetText: {
    color: '#DC2626',
  },
  approveText: {
    color: '#FFFFFF',
  },
  rejectText: {
    color: '#FFFFFF',
  },
  instructionsSection: {
    padding: 20,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  closeButton: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BrainAccessDemo;
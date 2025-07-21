// components/brain/SuperEngineerDashboard.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {
  Shield,
  Check,
  X,
  Clock,
  User,
  Calendar,
  FileText,
  Camera,
  File,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  Eye,
  MessageSquare,
} from 'lucide-react-native';

const SuperEngineerDashboard = ({ 
  pendingSubmissions = [],
  onApprove,
  onReject,
  onViewDetails,
}) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demo - in real app, fetch from API
  useEffect(() => {
    const mockSubmissions = [
      {
        id: '1',
        type: 'write-tips',
        title: 'How to troubleshoot network connectivity issues',
        description: 'Step-by-step guide for diagnosing and fixing common network problems',
        submittedBy: 'John Doe',
        submittedAt: '2024-07-04T10:30:00Z',
        team: 'Engineering',
        status: 'pending',
        priority: 'high',
        content: 'When troubleshooting network issues, start with these basic steps...',
        filesCount: 0,
        imagesCount: 0,
      },
      {
        id: '2',
        type: 'upload-photo',
        title: 'Server Room Layout Diagram',
        description: 'Updated layout showing new server rack positions',
        submittedBy: 'Jane Smith',
        submittedAt: '2024-07-04T09:15:00Z',
        team: 'Engineering',
        status: 'pending',
        priority: 'medium',
        content: '',
        filesCount: 0,
        imagesCount: 3,
      },
      {
        id: '3',
        type: 'upload-manuals',
        title: 'Cisco Router Configuration Manual v3.2',
        description: 'Latest manual for configuring Cisco routers',
        submittedBy: 'Mike Johnson',
        submittedAt: '2024-07-04T08:45:00Z',
        team: 'Design',
        status: 'pending',
        priority: 'low',
        content: '',
        filesCount: 2,
        imagesCount: 0,
      },
    ];
    
    setSubmissions(mockSubmissions);
  }, []);

  // Get icon for submission type
  const getTypeIcon = (type) => {
    switch (type) {
      case 'write-tips': return { icon: Lightbulb, color: '#F59E0B' };
      case 'upload-photo': return { icon: Camera, color: '#3B82F6' };
      case 'upload-manuals': return { icon: BookOpen, color: '#10B981' };
      case 'upload-file': return { icon: File, color: '#8B5CF6' };
      default: return { icon: FileText, color: '#6B7280' };
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#DC2626';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Handle approval
  const handleApprove = async (submissionId) => {
    setIsLoading(true);
    try {
      // In real app: await api.approveSubmission(submissionId);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmissions(prev => 
        prev.map(sub => 
          sub.id === submissionId 
            ? { ...sub, status: 'approved', approvedAt: new Date().toISOString() }
            : sub
        )
      );
      
      if (onApprove) onApprove(submissionId);
      
      Alert.alert('Success', 'Submission approved and added to knowledge base.');
    } catch (error) {
      Alert.alert('Error', 'Failed to approve submission. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle rejection
  const handleReject = async (submissionId) => {
    Alert.alert(
      'Reject Submission',
      'Are you sure you want to reject this submission? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // In real app: await api.rejectSubmission(submissionId, reason);
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              setSubmissions(prev => 
                prev.map(sub => 
                  sub.id === submissionId 
                    ? { ...sub, status: 'rejected', rejectedAt: new Date().toISOString() }
                    : sub
                )
              );
              
              if (onReject) onReject(submissionId);
              
              Alert.alert('Success', 'Submission rejected.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reject submission. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedFilter === 'all') return true;
    return sub.status === selectedFilter;
  });

  // Get filter counts
  const getFilterCount = (status) => {
    return submissions.filter(sub => status === 'all' ? true : sub.status === status).length;
  };

  // Render submission item
  const renderSubmissionItem = ({ item }) => {
    const { icon: TypeIcon, color: typeColor } = getTypeIcon(item.type);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <View style={styles.submissionCard}>
        {/* Header */}
        <View style={styles.submissionHeader}>
          <View style={styles.submissionLeft}>
            <View style={[styles.typeIcon, { backgroundColor: typeColor }]}>
              <TypeIcon size={16} color="#FFFFFF" />
            </View>
            <View style={styles.submissionInfo}>
              <Text style={styles.submissionTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.submissionMeta}>
                by {item.submittedBy} • {item.team}
              </Text>
            </View>
          </View>
          <View style={styles.submissionRight}>
            <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Clock size={12} color="#666666" />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={styles.submissionDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Content Preview */}
        {item.content ? (
          <Text style={styles.contentPreview} numberOfLines={3}>
            {item.content}
          </Text>
        ) : null}

        {/* File/Image counts */}
        {(item.filesCount > 0 || item.imagesCount > 0) && (
          <View style={styles.attachments}>
            {item.filesCount > 0 && (
              <View style={styles.attachmentCount}>
                <File size={12} color="#666666" />
                <Text style={styles.attachmentText}>{item.filesCount} files</Text>
              </View>
            )}
            {item.imagesCount > 0 && (
              <View style={styles.attachmentCount}>
                <Camera size={12} color="#666666" />
                <Text style={styles.attachmentText}>{item.imagesCount} images</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.submissionFooter}>
          <Text style={styles.submissionDate}>
            Submitted {formatDate(item.submittedAt)}
          </Text>
          
          {item.status === 'pending' && (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() => onViewDetails && onViewDetails(item)}
              >
                <Eye size={14} color="#666666" />
                <Text style={styles.viewText}>View</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleReject(item.id)}
                disabled={isLoading}
              >
                <X size={14} color="#DC2626" />
                <Text style={styles.rejectText}>Reject</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApprove(item.id)}
                disabled={isLoading}
              >
                <Check size={14} color="#FFFFFF" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Shield size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Super Engineer Dashboard</Text>
            <Text style={styles.headerSubtitle}>Review and approve brain submissions</Text>
          </View>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'approved', label: 'Approved' },
            { key: 'rejected', label: 'Rejected' },
          ].map(filter => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterButton,
                selectedFilter === filter.key && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter.key && styles.filterTextActive,
                ]}
              >
                {filter.label} ({getFilterCount(filter.key)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Submissions List */}
      <FlatList
        data={filteredSubmissions}
        keyExtractor={item => item.id}
        renderItem={renderSubmissionItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Shield size={48} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>No submissions found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'pending' 
                ? 'All caught up! No pending submissions to review.'
                : `No ${selectedFilter} submissions found.`}
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#000000',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  filters: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#000000',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  submissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  submissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  submissionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  submissionInfo: {
    flex: 1,
  },
  submissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  submissionMeta: {
    fontSize: 12,
    color: '#666666',
  },
  submissionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#666666',
    textTransform: 'capitalize',
  },
  submissionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  contentPreview: {
    fontSize: 13,
    color: '#999999',
    lineHeight: 17,
    fontStyle: 'italic',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  attachments: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  attachmentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attachmentText: {
    fontSize: 12,
    color: '#666666',
  },
  submissionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  submissionDate: {
    fontSize: 12,
    color: '#999999',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  viewText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    gap: 4,
  },
  rejectText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#10B981',
    gap: 4,
  },
  approveText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    maxWidth: 300,
  },
});

export default SuperEngineerDashboard;
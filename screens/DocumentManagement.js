// screens/DocumentManagement.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import {
  FileText,
  Search,
  X,
  Eye,
  Edit,
  Trash2,
  Users,
  Lock,
  Calendar,
  Download,
  Filter,
  Check,
  Lightbulb,
  Camera,
  BookOpen,
  File,
} from 'lucide-react-native';

export default function DocumentManagement() {
  // Sample data with different content types
  const [documents, setDocuments] = useState([
    // Tips & Tricks
    {
      id: '1',
      name: 'Quick Network Troubleshooting Steps',
      type: 'tip',
      content: 'When network issues occur, always start with these steps: 1. Check physical connections, 2. Restart network equipment, 3. Check IP configuration...',
      uploadedBy: 'John Doe',
      uploadDate: '2024-01-15',
      teams: ['1'], // Engineering team only
      isPublic: false,
      description: 'Essential troubleshooting steps for network connectivity issues',
    },
    {
      id: '2',
      name: 'Effective Code Review Practices',
      type: 'tip',
      content: 'Code reviews should focus on: logic correctness, security vulnerabilities, performance implications, and code readability...',
      uploadedBy: 'Jane Smith',
      uploadDate: '2024-01-18',
      teams: ['1'], // Engineering team
      isPublic: true,
      description: 'Best practices for conducting thorough and effective code reviews',
    },
    // Images
    {
      id: '3',
      name: 'Network Architecture Diagram',
      type: 'image',
      imageUri: 'https://picsum.photos/400/300?random=1',
      uploadedBy: 'John Doe',
      uploadDate: '2024-01-20',
      teams: ['1'], // Engineering team
      isPublic: false,
      description: 'Current network topology and connection points',
    },
    {
      id: '4',
      name: 'UI Design Mockups',
      type: 'image',
      imageUri: 'https://picsum.photos/400/300?random=2',
      uploadedBy: 'Jane Smith',
      uploadDate: '2024-01-22',
      teams: ['2'], // Design team
      isPublic: false,
      description: 'Latest UI design mockups for the dashboard redesign',
    },
    // Manuals
    {
      id: '5',
      name: 'Server Installation Guide v3.2.pdf',
      type: 'manual',
      size: '2.4 MB',
      uploadedBy: 'Admin',
      uploadDate: '2024-01-10',
      teams: ['1'], // Engineering team
      isPublic: false,
      description: 'Complete guide for server hardware installation and configuration',
    },
    {
      id: '6',
      name: 'Design System Guidelines.pdf',
      type: 'manual',
      size: '1.8 MB',
      uploadedBy: 'Jane Smith',
      uploadDate: '2024-01-25',
      teams: ['2'], // Design team
      isPublic: true,
      description: 'Comprehensive design system documentation and usage guidelines',
    },
    // Documents
    {
      id: '7',
      name: 'Project Requirements.docx',
      type: 'document',
      size: '856 KB',
      uploadedBy: 'Project Manager',
      uploadDate: '2024-01-28',
      teams: ['1', '2'], // Both teams
      isPublic: false,
      description: 'Detailed project requirements and specifications document',
    },
    {
      id: '8',
      name: 'Company Handbook.pdf',
      type: 'document',
      size: '3.2 MB',
      uploadedBy: 'HR Admin',
      uploadDate: '2024-01-12',
      teams: ['1', '2'], // Both teams
      isPublic: true,
      description: 'General company policies, procedures, and guidelines',
    },
  ]);

  const [teams, setTeams] = useState([
    { id: '1', name: 'Engineering' },
    { id: '2', name: 'Design' },
  ]);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContentType, setSelectedContentType] = useState('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Edit form
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    selectedTeams: [],
    isPublic: false,
  });

  // Content type tabs
  const contentTypes = [
    { id: 'all', name: 'All Content', icon: FileText },
    { id: 'tip', name: 'Tips & Tricks', icon: Lightbulb },
    { id: 'image', name: 'Images', icon: Camera },
    { id: 'manual', name: 'Manuals', icon: BookOpen },
    { id: 'document', name: 'Documents', icon: File },
  ];

  // Filter and search documents
  const getFilteredDocuments = () => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.content && doc.content.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply content type filter
    if (selectedContentType !== 'all') {
      filtered = filtered.filter(doc => doc.type === selectedContentType);
    }

    // Apply team filter
    if (selectedTeamFilter !== 'all') {
      if (selectedTeamFilter === 'public') {
        filtered = filtered.filter(doc => doc.isPublic);
      } else {
        filtered = filtered.filter(doc => doc.teams.includes(selectedTeamFilter));
      }
    }

    return filtered;
  };

  // Handle edit document
  const handleEditDocument = () => {
    if (!editForm.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a name',
      });
      return;
    }

    if (!editForm.isPublic && editForm.selectedTeams.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select at least one team or make it public',
      });
      return;
    }

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              name: editForm.name,
              description: editForm.description,
              teams: editForm.selectedTeams,
              isPublic: editForm.isPublic,
            }
          : doc
      )
    );

    setShowEditModal(false);
    setSelectedDocument(null);

    Toast.show({
      type: 'success',
      text1: 'Content Updated',
      text2: 'Content permissions have been updated',
    });
  };

  // Handle delete document
  const handleDeleteDocument = (doc) => {
    Alert.alert(
      'Delete Content',
      `Are you sure you want to delete "${doc.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(d => d.id !== doc.id));
            Toast.show({
              type: 'success',
              text1: 'Content Deleted',
              text2: 'Content has been removed successfully',
            });
          },
        },
      ]
    );
  };

  // Open edit modal
  const openEditModal = (doc) => {
    setSelectedDocument(doc);
    setEditForm({
      name: doc.name,
      description: doc.description,
      selectedTeams: doc.teams,
      isPublic: doc.isPublic,
    });
    setShowEditModal(true);
  };

  // Open permissions modal
  const openPermissionsModal = (doc) => {
    setSelectedDocument(doc);
    setShowPermissionsModal(true);
  };

  // Toggle team selection
  const toggleTeamSelection = (teamId) => {
    if (editForm.selectedTeams.includes(teamId)) {
      setEditForm(prev => ({
        ...prev,
        selectedTeams: prev.selectedTeams.filter(id => id !== teamId),
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        selectedTeams: [...prev.selectedTeams, teamId],
      }));
    }
  };

  // Get content type icon
  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'tip':
        return <Lightbulb size={20} color="#D97706" />;
      case 'image':
        return <Camera size={20} color="#059669" />;
      case 'manual':
        return <BookOpen size={20} color="#2563EB" />;
      case 'document':
        return <FileText size={20} color="#666666" />;
      default:
        return <FileText size={20} color="#666666" />;
    }
  };

  // Get team names
  const getTeamNames = (teamIds) => {
    return teams
      .filter(team => teamIds.includes(team.id))
      .map(team => team.name)
      .join(', ');
  };

  // Render document item
  const renderDocument = ({ item: doc }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <View style={styles.documentIcon}>
            {getContentTypeIcon(doc.type)}
          </View>
          <View style={styles.documentDetails}>
            <Text style={styles.documentName}>{doc.name}</Text>
            <Text style={styles.documentDescription}>{doc.description}</Text>
            
            {/* Show content preview for tips */}
            {doc.type === 'tip' && doc.content && (
              <Text style={styles.tipPreview} numberOfLines={2}>
                {doc.content}
              </Text>
            )}
            
            {/* Show image preview for images */}
            {doc.type === 'image' && doc.imageUri && (
              <Image source={{ uri: doc.imageUri }} style={styles.imagePreview} />
            )}
            
            <View style={styles.documentMeta}>
              <Text style={styles.documentMetaText}>
                {doc.size ? `${doc.size} • ` : ''}Uploaded by {doc.uploadedBy}
              </Text>
              <Text style={styles.documentDate}>
                {new Date(doc.uploadDate).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openPermissionsModal(doc)}
          >
            <Eye size={16} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(doc)}
          >
            <Edit size={16} color="#666666" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDocument(doc)}
          >
            <Trash2 size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.documentPermissions}>
        <View style={styles.permissionItem}>
          <Lock size={14} color="#666666" />
          <Text style={styles.permissionText}>
            {doc.isPublic ? 'Public Access' : `Teams: ${getTeamNames(doc.teams)}`}
          </Text>
        </View>
      </View>
    </View>
  );

  const filteredDocuments = getFilteredDocuments();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Content</Text>
        <Text style={styles.headerSubtitle}>
          Organize content and manage team permissions
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#666666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search content..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#666666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content Type Tabs */}
      <View style={styles.tabsCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {contentTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.tab,
                    selectedContentType === type.id && styles.tabActive,
                  ]}
                  onPress={() => setSelectedContentType(type.id)}
                >
                  <IconComponent 
                    size={16} 
                    color={selectedContentType === type.id ? '#FFFFFF' : '#666666'} 
                  />
                  <Text
                    style={[
                      styles.tabText,
                      selectedContentType === type.id && styles.tabTextActive,
                    ]}
                  >
                    {type.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Team Filters */}
      <View style={styles.filtersCard}>
        <View style={styles.filterHeader}>
          <Filter size={16} color="#000000" />
          <Text style={styles.filterTitle}>Filter by Team</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterTabs}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedTeamFilter === 'all' && styles.filterTabActive,
              ]}
              onPress={() => setSelectedTeamFilter('all')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedTeamFilter === 'all' && styles.filterTabTextActive,
                ]}
              >
                All Content
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterTab,
                selectedTeamFilter === 'public' && styles.filterTabActive,
              ]}
              onPress={() => setSelectedTeamFilter('public')}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedTeamFilter === 'public' && styles.filterTabTextActive,
                ]}
              >
                Public
              </Text>
            </TouchableOpacity>
            {teams.map(team => (
              <TouchableOpacity
                key={team.id}
                style={[
                  styles.filterTab,
                  selectedTeamFilter === team.id && styles.filterTabActive,
                ]}
                onPress={() => setSelectedTeamFilter(team.id)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedTeamFilter === team.id && styles.filterTabTextActive,
                  ]}
                >
                  {team.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content List */}
      <View style={styles.documentsCard}>
        <View style={styles.documentsHeader}>
          <Text style={styles.documentsTitle}>
            Content ({filteredDocuments.length})
          </Text>
        </View>

        {filteredDocuments.length > 0 ? (
          <FlatList
            data={filteredDocuments}
            keyExtractor={item => item.id}
            renderItem={renderDocument}
            scrollEnabled={false}
            contentContainerStyle={styles.documentsList}
          />
        ) : (
          <View style={styles.emptyState}>
            <FileText size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>No content found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || selectedContentType !== 'all' || selectedTeamFilter !== 'all'
                ? 'No content matches your current filters'
                : 'Content uploaded in Brain will appear here'}
            </Text>
          </View>
        )}
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Content</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter name"
                  value={editForm.name}
                  onChangeText={text => setEditForm(prev => ({ ...prev, name: text }))}
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Enter description (optional)"
                  value={editForm.description}
                  onChangeText={text =>
                    setEditForm(prev => ({ ...prev, description: text }))
                  }
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.checkboxContainer}>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      editForm.isPublic && styles.checkboxActive,
                    ]}
                    onPress={() =>
                      setEditForm(prev => ({ ...prev, isPublic: !prev.isPublic }))
                    }
                  >
                    {editForm.isPublic && <Check size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                  <Text style={styles.checkboxLabel}>Make content public</Text>
                </View>
              </View>

              {!editForm.isPublic && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Team Access</Text>
                  <View style={styles.teamSelector}>
                    {teams.map(team => (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamOption,
                          editForm.selectedTeams.includes(team.id) &&
                            styles.teamOptionActive,
                        ]}
                        onPress={() => toggleTeamSelection(team.id)}
                      >
                        <Text
                          style={[
                            styles.teamOptionText,
                            editForm.selectedTeams.includes(team.id) &&
                              styles.teamOptionTextActive,
                          ]}
                        >
                          {team.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleEditDocument}
              >
                <Text style={styles.modalPrimaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Permissions Modal */}
      <Modal
        visible={showPermissionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPermissionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Content Permissions</Text>
              <TouchableOpacity
                onPress={() => setShowPermissionsModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {selectedDocument && (
                <>
                  <View style={styles.permissionInfo}>
                    <Text style={styles.permissionDocName}>{selectedDocument.name}</Text>
                    <Text style={styles.permissionDocDesc}>
                      {selectedDocument.description}
                    </Text>
                  </View>

                  <View style={styles.permissionSection}>
                    <Text style={styles.permissionSectionTitle}>Access Level</Text>
                    <View style={styles.accessLevel}>
                      {selectedDocument.isPublic ? (
                        <View style={styles.publicAccess}>
                          <Users size={20} color="#000000" />
                          <Text style={styles.publicAccessText}>Public Access</Text>
                          <Text style={styles.publicAccessDesc}>
                            Available to all team members
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.teamAccess}>
                          <Lock size={20} color="#666666" />
                          <Text style={styles.teamAccessText}>Team Restricted</Text>
                          <Text style={styles.teamAccessDesc}>
                            Only available to: {getTeamNames(selectedDocument.teams)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.permissionSection}>
                    <Text style={styles.permissionSectionTitle}>Upload Details</Text>
                    <View style={styles.uploadDetails}>
                      <View style={styles.uploadDetailRow}>
                        <Text style={styles.uploadDetailLabel}>Content Type</Text>
                        <Text style={styles.uploadDetailValue}>
                          {selectedDocument.type.charAt(0).toUpperCase() + selectedDocument.type.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.uploadDetailRow}>
                        <Text style={styles.uploadDetailLabel}>Uploaded by</Text>
                        <Text style={styles.uploadDetailValue}>
                          {selectedDocument.uploadedBy}
                        </Text>
                      </View>
                      <View style={styles.uploadDetailRow}>
                        <Text style={styles.uploadDetailLabel}>Upload date</Text>
                        <Text style={styles.uploadDetailValue}>
                          {new Date(selectedDocument.uploadDate).toLocaleDateString()}
                        </Text>
                      </View>
                      {selectedDocument.size && (
                        <View style={styles.uploadDetailRow}>
                          <Text style={styles.uploadDetailLabel}>File size</Text>
                          <Text style={styles.uploadDetailValue}>
                            {selectedDocument.size}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '400',
  },

  // Search Card
  searchCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },

  // Content Type Tabs
  tabsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#000000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },

  // Filters Card
  filtersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#000000',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // Documents Card
  documentsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  documentsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  documentsList: {
    paddingBottom: 8,
  },

  // Document Card
  documentCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  documentIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentDetails: {
    flex: 1,
  },
  documentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  documentDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
    lineHeight: 20,
  },
  tipPreview: {
    fontSize: 13,
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    lineHeight: 18,
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentMetaText: {
    fontSize: 12,
    color: '#999999',
  },
  documentDate: {
    fontSize: 12,
    color: '#999999',
  },
  documentActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },
  documentPermissions: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  permissionText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
  teamSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  teamOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
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
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  modalSecondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  modalPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Permissions Modal Content
  permissionInfo: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  permissionDocName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  permissionDocDesc: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  permissionSection: {
    marginBottom: 20,
  },
  permissionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  accessLevel: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
  },
  publicAccess: {
    alignItems: 'center',
  },
  publicAccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 8,
    marginBottom: 4,
  },
  publicAccessDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  teamAccess: {
    alignItems: 'center',
  },
  teamAccessText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 8,
    marginBottom: 4,
  },
  teamAccessDesc: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  uploadDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
  },
  uploadDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadDetailLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  uploadDetailValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 40,
  },
});
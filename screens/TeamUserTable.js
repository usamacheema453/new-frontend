// screenss/TeamUserTable.js - Focused solely on team and user management

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Calendar, 
  Shield, 
  Plus, 
  Search, 
  X,
  Settings,
  Crown,
  Edit,
  Key,
  Clock
} from 'lucide-react-native';

export default function TeamUserTable() {
  // Dummy data focused on team management
  const initialAllUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@company.com',
      role: 'team_admin',
      status: 'active',
      joinedDate: '2024-01-15',
      lastActive: '2024-01-20',
      permissions: ['full_access', 'manage_users', 'view_analytics'],
      department: 'Engineering',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@company.com',
      role: 'team_member',
      status: 'active',
      joinedDate: '2024-01-18',
      lastActive: '2024-01-19',
      permissions: ['basic_access', 'upload_content'],
      department: 'Engineering',
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@company.com',
      role: 'team_member',
      status: 'pending',
      joinedDate: '2024-01-20',
      lastActive: null,
      permissions: ['basic_access'],
      department: 'Design',
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      email: 'sarah@company.com',
      role: 'team_member',
      status: 'inactive',
      joinedDate: '2024-01-10',
      lastActive: '2024-01-12',
      permissions: ['basic_access'],
      department: 'Engineering',
    }
  ];

  const initialTeams = [
    { id: '1', name: 'Engineering', memberCount: 3, description: 'Technical development team' },
    { id: '2', name: 'Design', memberCount: 1, description: 'UI/UX design team' },
  ];

  const initialTeamMembersMap = {
    '1': ['1', '2', '4'], // Engineering: John, Jane, Sarah
    '2': ['3'],           // Design: Mike
  };

  // State
  const [allUsers, setAllUsers] = useState(initialAllUsers);
  const [teams, setTeams] = useState(initialTeams);
  const [teamMembersMap, setTeamMembersMap] = useState(initialTeamMembersMap);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'team_member',
    department: '',
    permissions: ['basic_access']
  });

  const [editForm, setEditForm] = useState({
    role: '',
    status: '',
    permissions: [],
    department: ''
  });

  const [newTeamForm, setNewTeamForm] = useState({
    name: '',
    description: ''
  });

  // Permission options
  const availablePermissions = [
    { id: 'basic_access', name: 'Basic Access', description: 'Can use the chat system' },
    { id: 'upload_content', name: 'Upload Content', description: 'Can upload files to brain' },
    { id: 'manage_documents', name: 'Manage Documents', description: 'Can organize team documents' },
    { id: 'view_analytics', name: 'View Analytics', description: 'Can see usage statistics' },
    { id: 'manage_users', name: 'Manage Users', description: 'Can invite and manage team members' },
    { id: 'full_access', name: 'Full Access', description: 'Complete administrative access' }
  ];

  // Helpers
  const getTeamMembers = () => {
    const ids = teamMembersMap[selectedTeamId] || [];
    let members = allUsers.filter(u => ids.includes(u.id));
    
    // Apply search filter
    if (searchQuery.trim()) {
      members = members.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.department.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      members = members.filter(member => member.status === statusFilter);
    }
    
    return members;
  };

  // Get role display info
  const getRoleInfo = (role) => {
    switch (role) {
      case 'team_admin':
        return { icon: Crown, color: '#F59E0B', label: 'Admin' };
      case 'team_member':
        return { icon: Users, color: '#6B7280', label: 'Member' };
      default:
        return { icon: Users, color: '#6B7280', label: 'Member' };
    }
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: '#10B981', label: 'Active' };
      case 'pending':
        return { color: '#F59E0B', label: 'Pending' };
      case 'inactive':
        return { color: '#EF4444', label: 'Inactive' };
      default:
        return { color: '#6B7280', label: 'Unknown' };
    }
  };

  // Handle user actions
  const handleRemoveMember = (memberId, memberName) => {
    setTeamMembersMap(prev => ({
      ...prev,
      [selectedTeamId]: (prev[selectedTeamId] || []).filter(id => id !== memberId),
    }));
    Toast.show({
      type: 'success',
      text1: 'Member Removed',
      text2: `${memberName} has been removed from the team.`,
    });
  };

  const handleInviteMember = () => {
    if (!inviteForm.email.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter an email address.',
      });
      return;
    }

    const newMember = {
      id: Date.now().toString(),
      name: inviteForm.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      email: inviteForm.email.trim(),
      role: inviteForm.role,
      status: 'pending',
      joinedDate: new Date().toISOString().split('T')[0],
      lastActive: null,
      permissions: inviteForm.permissions,
      department: inviteForm.department || teams.find(t => t.id === selectedTeamId)?.name || ''
    };

    setAllUsers(prev => [...prev, newMember]);
    setTeamMembersMap(prev => ({
      ...prev,
      [selectedTeamId]: [...(prev[selectedTeamId] || []), newMember.id],
    }));

    setShowInviteModal(false);
    setInviteForm({
      email: '',
      role: 'team_member',
      department: '',
      permissions: ['basic_access']
    });

    Toast.show({
      type: 'success',
      text1: 'Invitation Sent',
      text2: `An invitation has been sent to ${newMember.email}.`,
    });
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      role: user.role,
      status: user.status,
      permissions: [...user.permissions],
      department: user.department
    });
    setShowEditUserModal(true);
  };

  const handleSaveUserEdit = () => {
    setAllUsers(prev => prev.map(user => 
      user.id === selectedUser.id 
        ? { 
            ...user, 
            role: editForm.role,
            status: editForm.status,
            permissions: editForm.permissions,
            department: editForm.department
          }
        : user
    ));

    setShowEditUserModal(false);
    setSelectedUser(null);

    Toast.show({
      type: 'success',
      text1: 'User Updated',
      text2: 'User information has been updated successfully.',
    });
  };

  const handleCreateTeam = () => {
    if (!newTeamForm.name.trim()) return;
    
    const id = Date.now().toString();
    const newTeam = {
      id,
      name: newTeamForm.name.trim(),
      description: newTeamForm.description.trim(),
      memberCount: 0
    };

    setTeams(prev => [...prev, newTeam]);
    setTeamMembersMap(prev => ({ ...prev, [id]: [] }));
    setSelectedTeamId(id);
    setShowCreateTeamModal(false);
    setNewTeamForm({ name: '', description: '' });

    Toast.show({
      type: 'success',
      text1: 'Team Created',
      text2: `Team "${newTeam.name}" created successfully.`,
    });
  };

  // Toggle permission
  const togglePermission = (permissionId, isInvite = false) => {
    const form = isInvite ? inviteForm : editForm;
    const setForm = isInvite ? setInviteForm : setEditForm;

    if (form.permissions.includes(permissionId)) {
      setForm(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => id !== permissionId)
      }));
    } else {
      setForm(prev => ({
        ...prev,
        permissions: [...prev.permissions, permissionId]
      }));
    }
  };

  // Render member item
  const renderMember = ({ item: member }) => {
    const roleInfo = getRoleInfo(member.role);
    const statusInfo = getStatusInfo(member.status);
    const RoleIcon = roleInfo.icon;

    return (
      <View style={styles.memberCard}>
        <View style={styles.memberHeader}>
          <View style={styles.memberMainInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
            </View>
            <View style={styles.memberDetails}>
              <View style={styles.memberNameRow}>
                <Text style={styles.memberName}>{member.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>
              <View style={styles.memberEmailRow}>
                <Mail size={14} color="#666666" />
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberDepartmentRow}>
                <Text style={styles.memberDepartment}>{member.department}</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.memberActions}>
            <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}15` }]}>
              <RoleIcon size={12} color={roleInfo.color} />
              <Text style={[styles.roleBadgeText, { color: roleInfo.color }]}>
                {roleInfo.label}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditUser(member)}
              >
                <Edit size={16} color="#666666" />
              </TouchableOpacity>
              {member.role !== 'team_admin' && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleRemoveMember(member.id, member.name)}
                >
                  <Trash2 size={16} color="#DC2626" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.memberStats}>
          <View style={styles.statItem}>
            <Calendar size={14} color="#666666" />
            <Text style={styles.statLabel}>Joined</Text>
            <Text style={styles.statValue}>
              {new Date(member.joinedDate).toLocaleDateString()}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Clock size={14} color="#666666" />
            <Text style={styles.statLabel}>Last Active</Text>
            <Text style={styles.statValue}>
              {member.lastActive 
                ? new Date(member.lastActive).toLocaleDateString()
                : 'Never'}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Key size={14} color="#666666" />
            <Text style={styles.statLabel}>Permissions</Text>
            <Text style={styles.statValue}>{member.permissions.length}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading team members...</Text>
      </View>
    );
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamMembers = getTeamMembers();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team Management</Text>
        <Text style={styles.headerSubtitle}>Manage team members, roles, and permissions</Text>
      </View>

      {/* Team Selector */}
      <View style={styles.teamSelectorCard}>
        <View style={styles.teamSelectorHeader}>
          <View style={styles.teamSelectorLeft}>
            <Users size={20} color="#000000" />
            <Text style={styles.teamSelectorTitle}>Teams</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateTeamModal(true)}
            style={styles.createTeamButton}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.createTeamText}>New Team</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamTabs}>
          {teams.map(team => (
            <TouchableOpacity
              key={team.id}
              onPress={() => setSelectedTeamId(team.id)}
              style={[
                styles.teamTab,
                selectedTeamId === team.id && styles.teamTabActive
              ]}
            >
              <Text style={[
                styles.teamTabText,
                selectedTeamId === team.id && styles.teamTabTextActive
              ]}>
                {team.name}
              </Text>
              <Text style={[
                styles.teamTabCount,
                selectedTeamId === team.id && styles.teamTabCountActive
              ]}>
                {(teamMembersMap[team.id] || []).length} members
              </Text>
              {team.description && (
                <Text style={[
                  styles.teamTabDesc,
                  selectedTeamId === team.id && styles.teamTabDescActive
                ]}>
                  {team.description}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filters and Actions */}
      <View style={styles.actionsCard}>
        <View style={styles.filtersRow}>
          <View style={styles.searchContainer}>
            <Search size={18} color="#666666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search members..."
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

          <View style={styles.statusFilterContainer}>
            {['all', 'active', 'pending', 'inactive'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusFilterButton,
                  statusFilter === status && styles.statusFilterButtonActive
                ]}
                onPress={() => setStatusFilter(status)}
              >
                <Text style={[
                  styles.statusFilterText,
                  statusFilter === status && styles.statusFilterTextActive
                ]}>
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.inviteButton}
          onPress={() => setShowInviteModal(true)}
        >
          <UserPlus size={16} color="#FFFFFF" />
          <Text style={styles.inviteButtonText}>Invite Member</Text>
        </TouchableOpacity>
      </View>

      {/* Members List */}
      <View style={styles.membersCard}>
        <View style={styles.membersHeader}>
          <Text style={styles.membersTitle}>
            {selectedTeam?.name} Team ({teamMembers.length})
          </Text>
        </View>

        {teamMembers.length > 0 ? (
          <FlatList
            data={teamMembers}
            keyExtractor={item => item.id}
            renderItem={renderMember}
            contentContainerStyle={styles.membersList}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Users size={48} color="#CCCCCC" />
            <Text style={styles.emptyStateTitle}>No team members</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || statusFilter !== 'all'
                ? 'No members match your current filters'
                : 'Start by inviting members to your team'}
            </Text>
          </View>
        )}
      </View>

      {/* Invite Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite Team Member</Text>
              <TouchableOpacity 
                onPress={() => setShowInviteModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter email address"
                  value={inviteForm.email}
                  onChangeText={text => setInviteForm(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleSelector}>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      inviteForm.role === 'team_member' && styles.roleOptionActive,
                    ]}
                    onPress={() => setInviteForm(prev => ({ ...prev, role: 'team_member' }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      inviteForm.role === 'team_member' && styles.roleOptionTextActive,
                    ]}>
                      Member
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleOption,
                      inviteForm.role === 'team_admin' && styles.roleOptionActive,
                    ]}
                    onPress={() => setInviteForm(prev => ({ ...prev, role: 'team_admin' }))}
                  >
                    <Text style={[
                      styles.roleOptionText,
                      inviteForm.role === 'team_admin' && styles.roleOptionTextActive,
                    ]}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Department</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. Engineering, Design"
                  value={inviteForm.department}
                  onChangeText={text => setInviteForm(prev => ({ ...prev, department: text }))}
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Permissions</Text>
                <View style={styles.permissionsContainer}>
                  {availablePermissions.map(permission => (
                    <TouchableOpacity
                      key={permission.id}
                      style={[
                        styles.permissionItem,
                        inviteForm.permissions.includes(permission.id) && styles.permissionItemActive
                      ]}
                      onPress={() => togglePermission(permission.id, true)}
                    >
                      <View style={[
                        styles.permissionCheckbox,
                        inviteForm.permissions.includes(permission.id) && styles.permissionCheckboxActive
                      ]}>
                        {inviteForm.permissions.includes(permission.id) && (
                          <X size={12} color="#FFFFFF" />
                        )}
                      </View>
                      <View style={styles.permissionInfo}>
                        <Text style={styles.permissionName}>{permission.name}</Text>
                        <Text style={styles.permissionDesc}>{permission.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowInviteModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleInviteMember}
              >
                <Text style={styles.modalPrimaryButtonText}>Send Invitation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        visible={showEditUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditUserModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit User</Text>
              <TouchableOpacity 
                onPress={() => setShowEditUserModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedUser && (
                <>
                  <View style={styles.userInfoSection}>
                    <Text style={styles.userInfoName}>{selectedUser.name}</Text>
                    <Text style={styles.userInfoEmail}>{selectedUser.email}</Text>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Role</Text>
                    <View style={styles.roleSelector}>
                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          editForm.role === 'team_member' && styles.roleOptionActive,
                        ]}
                        onPress={() => setEditForm(prev => ({ ...prev, role: 'team_member' }))}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          editForm.role === 'team_member' && styles.roleOptionTextActive,
                        ]}>
                          Member
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.roleOption,
                          editForm.role === 'team_admin' && styles.roleOptionActive,
                        ]}
                        onPress={() => setEditForm(prev => ({ ...prev, role: 'team_admin' }))}
                      >
                        <Text style={[
                          styles.roleOptionText,
                          editForm.role === 'team_admin' && styles.roleOptionTextActive,
                        ]}>
                          Admin
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Status</Text>
                    <View style={styles.statusSelector}>
                      {['active', 'pending', 'inactive'].map(status => (
                        <TouchableOpacity
                          key={status}
                          style={[
                            styles.statusOption,
                            editForm.status === status && styles.statusOptionActive,
                          ]}
                          onPress={() => setEditForm(prev => ({ ...prev, status }))}
                        >
                          <Text style={[
                            styles.statusOptionText,
                            editForm.status === status && styles.statusOptionTextActive,
                          ]}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Department</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="e.g. Engineering, Design"
                      value={editForm.department}
                      onChangeText={text => setEditForm(prev => ({ ...prev, department: text }))}
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Permissions</Text>
                    <View style={styles.permissionsContainer}>
                      {availablePermissions.map(permission => (
                        <TouchableOpacity
                          key={permission.id}
                          style={[
                            styles.permissionItem,
                            editForm.permissions.includes(permission.id) && styles.permissionItemActive
                          ]}
                          onPress={() => togglePermission(permission.id, false)}
                        >
                          <View style={[
                            styles.permissionCheckbox,
                            editForm.permissions.includes(permission.id) && styles.permissionCheckboxActive
                          ]}>
                            {editForm.permissions.includes(permission.id) && (
                              <X size={12} color="#FFFFFF" />
                            )}
                          </View>
                          <View style={styles.permissionInfo}>
                            <Text style={styles.permissionName}>{permission.name}</Text>
                            <Text style={styles.permissionDesc}>{permission.description}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowEditUserModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleSaveUserEdit}
              >
                <Text style={styles.modalPrimaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Team Modal */}
      <Modal
        visible={showCreateTeamModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateTeamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Team</Text>
              <TouchableOpacity 
                onPress={() => setShowCreateTeamModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Team Name</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter team name"
                  value={newTeamForm.name}
                  onChangeText={text => setNewTeamForm(prev => ({ ...prev, name: text }))}
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  placeholder="Describe the team's purpose"
                  value={newTeamForm.description}
                  onChangeText={text => setNewTeamForm(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999999"
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowCreateTeamModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleCreateTeam}
              >
                <Text style={styles.modalPrimaryButtonText}>Create Team</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

// Helper function
const getInitials = name =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
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

  // Team Selector Card
  teamSelectorCard: {
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
  teamSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  teamSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamSelectorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createTeamText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  teamTabs: {
    flexDirection: 'row',
  },
  teamTab: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 12,
    minWidth: 140,
  },
  teamTabActive: {
    backgroundColor: '#000000',
  },
  teamTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 2,
  },
  teamTabTextActive: {
    color: '#FFFFFF',
  },
  teamTabCount: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 2,
  },
  teamTabCountActive: {
    color: '#CCCCCC',
  },
  teamTabDesc: {
    fontSize: 11,
    color: '#999999',
    lineHeight: 14,
  },
  teamTabDescActive: {
    color: '#CCCCCC',
  },

  // Actions Card
  actionsCard: {
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
  filtersRow: {
    marginBottom: 16,
    gap: 12,
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
  statusFilterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusFilterButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusFilterButtonActive: {
    backgroundColor: '#000000',
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
  },
  statusFilterTextActive: {
    color: '#FFFFFF',
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    alignSelf: 'flex-start',
  },
  inviteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Members Card
  membersCard: {
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
  membersHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  membersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  membersList: {
    paddingBottom: 8,
  },

  // Member Card
  memberCard: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  memberMainInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000000',
    fontWeight: '700',
    fontSize: 16,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  memberEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  memberDepartmentRow: {
    marginBottom: 4,
  },
  memberDepartment: {
    fontSize: 13,
    color: '#999999',
    fontWeight: '500',
  },
  memberActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },

  // Member Stats
  memberStats: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 16,
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    textAlign: 'center',
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
    maxHeight: 500,
  },
  userInfoSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  userInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  userInfoEmail: {
    fontSize: 14,
    color: '#666666',
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
  roleSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  roleOptionActive: {
    backgroundColor: '#000000',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  roleOptionTextActive: {
    color: '#FFFFFF',
  },
  statusSelector: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    overflow: 'hidden',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statusOptionActive: {
    backgroundColor: '#000000',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  statusOptionTextActive: {
    color: '#FFFFFF',
  },
  permissionsContainer: {
    gap: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  permissionItemActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  permissionCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  permissionCheckboxActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  permissionDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
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

  bottomSpacer: {
    height: 40,
  },
});
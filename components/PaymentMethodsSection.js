// components/PaymentMethodsSection.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CreditCard,
  Plus,
  Trash2,
  Check,
  X,
  ArrowLeft,
  Star,
  Lock,
  Calendar,
  User,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

export default function PaymentMethodsSection({ onBack, isMobile = false }) {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: '',
  });

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('paymentMethods');
      if (stored) {
        setPaymentMethods(JSON.parse(stored));
      } else {
        const demoMethods = [
          {
            id: 'pm_1234567890',
            brand: 'visa',
            last4: '4242',
            expMonth: 12,
            expYear: 2025,
            isDefault: true,
            name: 'John Doe',
          }
        ];
        setPaymentMethods(demoMethods);
        await AsyncStorage.setItem('paymentMethods', JSON.stringify(demoMethods));
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async () => {
    if (!newCard.number || !newCard.expiry || !newCard.cvc || !newCard.name) {
      Alert.alert('Error', 'Please fill in all card details');
      return;
    }

    setLoading(true);
    try {
      const [expMonth, expYear] = newCard.expiry.split('/');
      const mockPaymentMethod = {
        id: `pm_${Date.now()}`,
        brand: getBrandFromNumber(newCard.number),
        last4: newCard.number.slice(-4),
        expMonth: parseInt(expMonth),
        expYear: parseInt(`20${expYear}`),
        isDefault: paymentMethods.length === 0,
        name: newCard.name,
      };

      const updatedMethods = [...paymentMethods, mockPaymentMethod];
      setPaymentMethods(updatedMethods);
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));

      setNewCard({ number: '', expiry: '', cvc: '', name: '' });
      setShowAddModal(false);
      Alert.alert('Success', 'Payment method added successfully');
    } catch (error) {
      console.error('Error adding payment method:', error);
      Alert.alert('Error', 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const removePaymentMethod = async (methodId) => {
    console.log('Remove button pressed for method:', methodId);
    console.log('Platform:', Platform.OS);
    
    Alert.alert(
      'Remove Payment Method',
      'Are you sure you want to remove this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('User confirmed removal');
              setLoading(true);
              
              const methodToRemove = paymentMethods.find(m => m.id === methodId);
              let updatedMethods = paymentMethods.filter(method => method.id !== methodId);
              
              if (updatedMethods.length > 0 && methodToRemove?.isDefault) {
                updatedMethods[0].isDefault = true;
              }

              setPaymentMethods(updatedMethods);
              await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
              console.log('Payment method removed successfully');
              Alert.alert('Success', 'Payment method removed successfully');
            } catch (error) {
              console.error('Error removing payment method:', error);
              Alert.alert('Error', 'Failed to remove payment method');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const setDefaultPaymentMethod = async (methodId) => {
    try {
      const updatedMethods = paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === methodId,
      }));

      setPaymentMethods(updatedMethods);
      await AsyncStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      Alert.alert('Success', 'Default payment method updated');
    } catch (error) {
      console.error('Error setting default payment method:', error);
      Alert.alert('Error', 'Failed to update default payment method');
    }
  };

  const getBrandFromNumber = (number) => {
    const firstDigit = number.charAt(0);
    if (firstDigit === '4') return 'visa';
    if (firstDigit === '5') return 'mastercard';
    if (firstDigit === '3') return 'amex';
    return 'unknown';
  };

  const getBrandIcon = (brand) => {
    switch (brand) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'amex':
        return '💳';
      default:
        return '💳';
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleDeleteClick = (methodId) => {
    console.log('Delete button clicked for:', methodId);
    
    if (Platform.OS === 'web') {
      // Immediate feedback for web
      const confirmed = confirm('Are you sure you want to remove this payment method?');
      if (confirmed) {
        removePaymentMethod(methodId);
      }
    } else {
      removePaymentMethod(methodId);
    }
  };

  const renderHeader = () => (
    <View style={isMobile ? styles.mobileHeader : styles.desktopHeader}>
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
      )}
      <Text style={isMobile ? styles.mobileHeaderTitle : styles.desktopHeaderTitle}>
        Payment Methods
      </Text>
      {isMobile && onBack && <View style={{ width: 32 }} />}
    </View>
  );

  const renderPaymentMethodCard = (method) => (
    <View key={method.id} style={styles.paymentMethodCard}>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardBrand}>
              {getBrandIcon(method.brand)} {method.brand.toUpperCase()}
            </Text>
            <Text style={styles.cardNumber}>•••• •••• •••• {method.last4}</Text>
            <Text style={styles.cardExpiry}>
              Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
            </Text>
            <Text style={styles.cardName}>{method.name}</Text>
          </View>
          
          <View style={styles.cardActions}>
            {method.isDefault && (
              <View style={styles.currentBadge}>
                <Star size={12} color="#FFFFFF" />
                <Text style={styles.currentText}>Current</Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                method.isDefault && styles.currentActionButton
              ]}
              onPress={() => !method.isDefault && setDefaultPaymentMethod(method.id)}
              disabled={method.isDefault}
            >
              <Text style={[
                styles.actionButtonText,
                method.isDefault && styles.currentActionButtonText
              ]}>
                {method.isDefault ? 'Default' : 'Set Default'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.removeButton,
                Platform.OS === 'web' && hoveredButton === method.id && styles.removeButtonHovered
              ]}
              onPress={() => handleDeleteClick(method.id)}
              onMouseEnter={Platform.OS === 'web' ? () => setHoveredButton(method.id) : undefined}
              onMouseLeave={Platform.OS === 'web' ? () => setHoveredButton(null) : undefined}
              activeOpacity={Platform.OS === 'web' ? 1 : 0.7}
              hitSlop={Platform.OS !== 'web' ? { top: 10, bottom: 10, left: 10, right: 10 } : undefined}
            >
              <Trash2 
                size={16} 
                color={Platform.OS === 'web' && hoveredButton === method.id ? "#FFFFFF" : "#EF4444"} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const renderAddModal = () => (
    <Modal
      visible={showAddModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowAddModal(false)}
      statusBarTranslucent={true}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowAddModal(false)}
            >
              <X size={20} color="#666666" />
            </TouchableOpacity>

            <ScrollView 
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Payment Method</Text>
              </View>

              <View style={styles.securityNotice}>
                <Lock size={16} color="#10B981" />
                <Text style={styles.securityText}>Your payment information is encrypted and secure</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cardholder Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="John Doe"
                    value={newCard.name}
                    onChangeText={(value) => setNewCard(prev => ({ ...prev, name: value }))}
                    autoCapitalize="words"
                    placeholderTextColor="#CCCCCC"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="1234 5678 9012 3456"
                    value={newCard.number}
                    onChangeText={(value) => setNewCard(prev => ({ ...prev, number: formatCardNumber(value) }))}
                    keyboardType="numeric"
                    maxLength={19}
                    placeholderTextColor="#CCCCCC"
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.inputLabel}>Expiry Date</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="MM/YY"
                      value={newCard.expiry}
                      onChangeText={(value) => setNewCard(prev => ({ ...prev, expiry: formatExpiry(value) }))}
                      keyboardType="numeric"
                      maxLength={5}
                      placeholderTextColor="#CCCCCC"
                    />
                  </View>
                  <View style={styles.inputGroupHalf}>
                    <Text style={styles.inputLabel}>CVC</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="123"
                      value={newCard.cvc}
                      onChangeText={(value) => setNewCard(prev => ({ ...prev, cvc: value.replace(/\D/g, '') }))}
                      keyboardType="numeric"
                      maxLength={4}
                      secureTextEntry
                      placeholderTextColor="#CCCCCC"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addPaymentMethod}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addButtonText}>Add Card</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionDescription}>
            Manage your payment methods. Your default payment method will be used for subscription billing.
          </Text>
        </View>

        {loading && paymentMethods.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading payment methods...</Text>
          </View>
        ) : (
          <>
            {paymentMethods.map(renderPaymentMethodCard)}
            
            <View style={styles.addMethodContainer}>
              <TouchableOpacity
                style={styles.addMethodButton}
                onPress={() => setShowAddModal(true)}
              >
                <Plus size={20} color="#000000" />
                <Text style={styles.addMethodText}>Add New Payment Method</Text>
              </TouchableOpacity>
            </View>

            {paymentMethods.length === 0 && (
              <View style={styles.emptyState}>
                <CreditCard size={48} color="#CCCCCC" />
                <Text style={styles.emptyTitle}>No Payment Methods</Text>
                <Text style={styles.emptyDescription}>
                  Add a payment method to manage your subscription billing
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {renderAddModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Headers
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 24, // Added top padding
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  desktopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20, // Added top padding
    paddingBottom: 0,
    marginBottom: 24,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mobileHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  desktopHeaderTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: IS_MOBILE ? 40 : 20,
  },
  
  // Description with padding
  descriptionContainer: {
    paddingHorizontal: 20, // Added padding to description
    marginBottom: 24,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // Payment Method Cards - Full width backgrounds
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20, // Only horizontal margin, no padding
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Card content with padding
  cardContent: {
    padding: 20, // Padding only for content inside the card
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1,
  },
  cardExpiry: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
    fontWeight: '500',
  },
  cardName: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  cardActions: {
    alignItems: 'flex-end',
    marginLeft: 20,
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  currentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
    minWidth: 90,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  currentActionButton: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
  },
  currentActionButtonText: {
    color: '#059669',
  },
  removeButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
      userSelect: 'none',
    }),
  },
  removeButtonHovered: {
    backgroundColor: '#F87171',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  // Add Method Button with padding
  addMethodContainer: {
    paddingHorizontal: 20, // Added padding to container
    marginTop: 8,
  },
  addMethodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addMethodText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 8,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20, // Added padding to empty state
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  // Loading
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20, // Added padding to loading state
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 70 : 40,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxHeight: SCREEN_HEIGHT - (Platform.OS === 'ios' ? 110 : 60),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  scrollContainer: {},
  scrollContent: {
    padding: Platform.OS === 'web' ? 24 : 20,
    paddingTop: Platform.OS === 'web' ? 32 : 28,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Platform.OS === 'web' ? 24 : 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: Platform.OS === 'web' ? 24 : 16,
  },
  modalTitle: {
    fontSize: Platform.OS === 'web' ? 20 : 18,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
  },

  // Security Notice
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: Platform.OS === 'web' ? 16 : 12,
    marginBottom: Platform.OS === 'web' ? 24 : 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  securityText: {
    fontSize: Platform.OS === 'web' ? 13 : 12,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
    lineHeight: Platform.OS === 'web' ? 18 : 16,
  },

  // Form Container
  formContainer: {
    marginBottom: Platform.OS === 'web' ? 24 : 16,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: Platform.OS === 'web' ? 20 : 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginBottom: Platform.OS === 'web' ? 20 : 16,
  },
  inputLabel: {
    fontSize: Platform.OS === 'web' ? 15 : 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    fontSize: Platform.OS === 'web' ? 16 : 15,
    color: '#000000',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },

  // Modal Buttons
  cancelButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    fontWeight: '600',
    color: '#666666',
  },
  addButton: {
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: Platform.OS === 'web' ? 16 : 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
// screens/PlanManagement.js - Enhanced with detailed billing and payment views

import React, { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native'
import {
  CreditCard,
  DollarSign,
  Calendar,
  Check,
  ArrowRight,
  Crown,
  Download,
  Settings,
  AlertCircle,
  TrendingUp,
  Receipt,
  Building,
  Globe,
  Lock,
  RefreshCw,
  X,
  Edit,
  ArrowLeft,
} from 'lucide-react-native'

// Import the detailed components
import BillingHistorySection from '../components/BillingHistorySection';
import PaymentMethodsSection from '../components/PaymentMethodsSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const IS_MOBILE = SCREEN_WIDTH < 768

export default function PlanManagement() {
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBillingModal, setShowBillingModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  
  // Navigation state for detailed views
  const [currentView, setCurrentView] = useState('main')

  // Billing information state
  const [billingInfo, setBillingInfo] = useState({
    company: 'Super Power Engineering Ltd.',
    email: 'billing@superpowereng.com',
    address: '123 Engineering St, Tech City, TC 12345',
    taxId: 'GB123456789',
    paymentMethod: '•••• •••• •••• 4242',
    cardExpiry: '12/26',
    cardType: 'Visa'
  })

  // Invoice data
  const [invoices] = useState([
    { 
      id: 'INV-2024-003', 
      date: '2024-01-15', 
      amount: 20.00, 
      status: 'paid', 
      period: 'January 2024',
      downloadUrl: '#'
    },
    { 
      id: 'INV-2024-002', 
      date: '2023-12-15', 
      amount: 20.00, 
      status: 'paid', 
      period: 'December 2023',
      downloadUrl: '#'
    },
    { 
      id: 'INV-2024-001', 
      date: '2023-11-15', 
      amount: 20.00, 
      status: 'paid', 
      period: 'November 2023',
      downloadUrl: '#'
    },
    { 
      id: 'INV-2023-012', 
      date: '2023-10-15', 
      amount: 20.00, 
      status: 'paid', 
      period: 'October 2023',
      downloadUrl: '#'
    },
  ])

  // Subscription details
  const [subscriptionDetails] = useState({
    planName: 'Team Plan',
    billingCycle: 'monthly',
    nextBilling: '2024-02-15',
    amount: 20.00,
    currency: 'GBP',
    autoRenew: true,
    trialEndsAt: null,
    discounts: [
      {
        name: 'Early Adopter Discount',
        amount: 5.00,
        type: 'fixed',
        expiresAt: '2024-06-15'
      }
    ]
  })

  // Usage-based billing (if applicable)
  const [usageBilling] = useState({
    basePrice: 15.00,
    additionalUsers: 2,
    additionalUserPrice: 2.50,
    storageOverage: 0,
    storageOveragePrice: 0.10, // per GB
    apiCalls: 0,
    apiCallPrice: 0.001 // per call
  })

  const handleManageSubscription = () => {
    setIsLoadingSubscription(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoadingSubscription(false)
      Alert.alert(
        'Redirecting to Stripe',
        'Opening subscription management portal...',
        [
          {
            text: 'OK',
            onPress: () =>
              // In a real app, this would open Stripe portal
              Alert.alert('Opened Stripe portal'),
          },
        ]
      )
    }, 1500)
  }

  const handleDownloadInvoice = (invoice) => {
    Alert.alert('Download Started', `Invoice ${invoice.id} is being downloaded...`)
  }

  const handleUpdateBilling = () => {
    setShowBillingModal(false)
    Alert.alert('Success', 'Billing information updated successfully')
  }

  const calculateTotal = () => {
    const base = usageBilling.basePrice
    const additionalUsers = usageBilling.additionalUsers * usageBilling.additionalUserPrice
    const storage = usageBilling.storageOverage * usageBilling.storageOveragePrice
    const api = usageBilling.apiCalls * usageBilling.apiCallPrice
    return base + additionalUsers + storage + api
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#10B981'
      case 'pending': return '#F59E0B'
      case 'failed': return '#EF4444'
      default: return '#6B7280'
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'paid': return 'Paid'
      case 'pending': return 'Pending'
      case 'failed': return 'Failed'
      default: return 'Unknown'
    }
  }

  const planFeatures = [
    'Unlimited AI queries for team',
    'Priority customer support',
    'Advanced team collaboration',
    'Usage analytics dashboard',
    'Admin management portal',
    'Custom integrations (API)',
    'Data export capabilities',
    'SSO integration ready'
  ]

  // Handle navigation to detailed views
  const navigateToPaymentMethods = () => {
    setCurrentView('payment')
  }

  const navigateToBillingHistory = () => {
    setCurrentView('billing')
  }

  const handleBackToMain = () => {
    setCurrentView('main')
  }

  // Render detailed views
  if (currentView === 'payment') {
    return (
      <PaymentMethodsSection 
        onBack={handleBackToMain}
        isMobile={IS_MOBILE}
      />
    )
  }

  if (currentView === 'billing') {
    return (
      <BillingHistorySection 
        onBack={handleBackToMain}
        isMobile={IS_MOBILE}
      />
    )
  }

  // Main view rendering
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Billing & Subscriptions</Text>
        <Text style={styles.headerSubtitle}>Manage your subscription, billing, and payment methods</Text>
      </View>

      {/* Current Subscription Overview */}
      <View style={styles.mainCard}>
        <View style={styles.planHeader}>
          <View style={styles.planBadge}>
            <Crown size={16} color="#FFFFFF" />
            <Text style={styles.planBadgeText}>TEAM PLAN</Text>
          </View>
          <View style={styles.planStatus}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>

        <View style={styles.planContent}>
          <View style={styles.planMainSection}>
            <View style={styles.planLeftSection}>
              <Text style={styles.planTitle}>{subscriptionDetails.planName}</Text>
              <Text style={styles.planDescription}>
                Professional features for growing engineering teams
              </Text>

              <View style={styles.priceContainer}>
                <Text style={styles.currency}>£</Text>
                <Text style={styles.price}>{subscriptionDetails.amount}</Text>
                <Text style={styles.period}>/{subscriptionDetails.billingCycle}</Text>
              </View>

              {subscriptionDetails.discounts.length > 0 && (
                <View style={styles.discountContainer}>
                  {subscriptionDetails.discounts.map((discount, idx) => (
                    <View key={idx} style={styles.discountItem}>
                      <Text style={styles.discountText}>
                        {discount.name}: -£{discount.amount.toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.planRightSection}>
              <View style={styles.billingInfoCard}>
                <Calendar size={18} color="#666666" />
                <View style={styles.billingInfoContent}>
                  <Text style={styles.billingInfoLabel}>Next billing</Text>
                  <Text style={styles.billingInfoValue}>
                    {new Date(subscriptionDetails.nextBilling).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.billingInfoCard}
                onPress={navigateToPaymentMethods}
                activeOpacity={0.7}
              >
                <CreditCard size={18} color="#666666" />
                <View style={styles.billingInfoContent}>
                  <Text style={styles.billingInfoLabel}>Payment method</Text>
                  <Text style={styles.billingInfoValue}>{billingInfo.paymentMethod}</Text>
                </View>
                <ArrowRight size={14} color="#999999" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>What's included</Text>
          <View style={styles.featuresGrid}>
            {planFeatures.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <View style={styles.checkIcon}>
                  <Check size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Usage-Based Billing Breakdown */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Receipt size={20} color="#000000" />
          </View>
          <Text style={styles.sectionTitle}>Billing Breakdown</Text>
        </View>

        <View style={styles.usageBillingContainer}>
          <View style={styles.usageBillingItem}>
            <Text style={styles.usageBillingLabel}>Base plan (12 users included)</Text>
            <Text style={styles.usageBillingValue}>£{usageBilling.basePrice.toFixed(2)}</Text>
          </View>
          
          <View style={styles.usageBillingItem}>
            <Text style={styles.usageBillingLabel}>
              Additional users ({usageBilling.additionalUsers} × £{usageBilling.additionalUserPrice})
            </Text>
            <Text style={styles.usageBillingValue}>
              £{(usageBilling.additionalUsers * usageBilling.additionalUserPrice).toFixed(2)}
            </Text>
          </View>

          <View style={styles.usageBillingItem}>
            <Text style={styles.usageBillingLabel}>Storage overage</Text>
            <Text style={styles.usageBillingValue}>
              £{(usageBilling.storageOverage * usageBilling.storageOveragePrice).toFixed(2)}
            </Text>
          </View>

          <View style={styles.usageBillingItem}>
            <Text style={styles.usageBillingLabel}>API calls</Text>
            <Text style={styles.usageBillingValue}>
              £{(usageBilling.apiCalls * usageBilling.apiCallPrice).toFixed(2)}
            </Text>
          </View>

          <View style={styles.usageBillingDivider} />
          
          <View style={styles.usageBillingTotal}>
            <Text style={styles.usageBillingTotalLabel}>Total this month</Text>
            <Text style={styles.usageBillingTotalValue}>£{calculateTotal().toFixed(2)}</Text>
          </View>
        </View>
      </View>

      {/* Billing Information */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Building size={20} color="#000000" />
          </View>
          <Text style={styles.sectionTitle}>Billing Information</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowBillingModal(true)}
          >
            <Edit size={16} color="#666666" />
          </TouchableOpacity>
        </View>

        <View style={styles.billingGrid}>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Company</Text>
            <Text style={styles.billingValue}>{billingInfo.company}</Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Billing email</Text>
            <Text style={styles.billingValue}>{billingInfo.email}</Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Address</Text>
            <Text style={styles.billingValue}>{billingInfo.address}</Text>
          </View>
          <View style={styles.billingItem}>
            <Text style={styles.billingLabel}>Tax ID</Text>
            <Text style={styles.billingValue}>{billingInfo.taxId}</Text>
          </View>
        </View>
      </View>

      {/* Payment Method - Enhanced with Navigation */}
      <TouchableOpacity 
        style={[styles.card, styles.clickableCard]}
        onPress={navigateToPaymentMethods}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <CreditCard size={20} color="#000000" />
          </View>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <ArrowRight size={20} color="#666666" />
        </View>

        <View style={styles.paymentMethodContainer}>
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentMethodInfo}>
              <View style={styles.cardTypeIcon}>
                <CreditCard size={20} color="#000000" />
              </View>
              <View style={styles.cardDetails}>
                <Text style={styles.cardNumber}>{billingInfo.paymentMethod}</Text>
                <Text style={styles.cardExpiry}>Expires {billingInfo.cardExpiry}</Text>
                <Text style={styles.cardType}>{billingInfo.cardType}</Text>
              </View>
            </View>
            <View style={styles.manageCardsHint}>
              <Text style={styles.manageCardsText}>Tap to manage</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Management Actions */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Settings size={20} color="#000000" />
          </View>
          <Text style={styles.sectionTitle}>Subscription Management</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.primaryAction, isLoadingSubscription && styles.actionDisabled]}
            onPress={handleManageSubscription}
            disabled={isLoadingSubscription}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionLeft}>
                <View style={styles.actionIcon}>
                  {isLoadingSubscription ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <CreditCard size={20} color="#FFFFFF" />
                  )}
                </View>
                <View>
                  <Text style={styles.actionTitle}>
                    {isLoadingSubscription ? 'Opening Portal...' : 'Manage Subscription'}
                  </Text>
                  <Text style={styles.actionSubtitle}>
                    Update payment, cancel, or change plans
                  </Text>
                </View>
              </View>
              <ArrowRight size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryAction}>
              <RefreshCw size={16} color="#000000" />
              <Text style={styles.secondaryActionText}>Sync Billing</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryAction}>
              <Globe size={16} color="#000000" />
              <Text style={styles.secondaryActionText}>Tax Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Billing History - Enhanced with Navigation */}
      <TouchableOpacity 
        style={[styles.card, styles.clickableCard]}
        onPress={navigateToBillingHistory}
        activeOpacity={0.7}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionIcon}>
            <Receipt size={20} color="#000000" />
          </View>
          <Text style={styles.sectionTitle}>Billing History</Text>
          <ArrowRight size={20} color="#666666" />
        </View>

        <View style={styles.historyContainer}>
          <Text style={styles.historyPreviewText}>Recent invoices</Text>
          {invoices.slice(0, 3).map((invoice, idx) => (
            <View key={idx} style={styles.historyItemPreview}>
              <View style={styles.historyInfo}>
                <View style={styles.historyMainInfo}>
                  <Text style={styles.historyInvoiceId}>{invoice.id}</Text>
                  <Text style={styles.historyPeriod}>{invoice.period}</Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyAmount}>£{invoice.amount.toFixed(2)}</Text>
                  <View style={[styles.historyStatus, { backgroundColor: `${getStatusColor(invoice.status)}15` }]}>
                    <View style={[styles.historyStatusDot, { backgroundColor: getStatusColor(invoice.status) }]} />
                    <Text style={[styles.historyStatusText, { color: getStatusColor(invoice.status) }]}>
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
          <Text style={styles.viewAllText}>Tap to view all invoices</Text>
        </View>
      </TouchableOpacity>

      {/* Enterprise Upgrade */}
      <View style={styles.upgradeCard}>
        <View style={styles.upgradeContent}>
          <View style={styles.upgradeHeader}>
            <Text style={styles.upgradeTitle}>Need more advanced features?</Text>
            <Text style={styles.upgradeSubtitle}>
              Upgrade to Enterprise for custom AI models, dedicated support, and advanced analytics
            </Text>
          </View>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Contact Sales</Text>
            <ArrowRight size={16} color="#000000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Billing Information Edit Modal */}
      <Modal
        visible={showBillingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBillingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Billing Information</Text>
              <TouchableOpacity 
                onPress={() => setShowBillingModal(false)}
                style={styles.modalCloseButton}
              >
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Company Name</Text>
                <TextInput
                  style={styles.modalInput}
                  value={billingInfo.company}
                  onChangeText={text => setBillingInfo(prev => ({ ...prev, company: text }))}
                  placeholder="Enter company name"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Billing Email</Text>
                <TextInput
                  style={styles.modalInput}
                  value={billingInfo.email}
                  onChangeText={text => setBillingInfo(prev => ({ ...prev, email: text }))}
                  placeholder="Enter billing email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Billing Address</Text>
                <TextInput
                  style={[styles.modalInput, styles.textArea]}
                  value={billingInfo.address}
                  onChangeText={text => setBillingInfo(prev => ({ ...prev, address: text }))}
                  placeholder="Enter full billing address"
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#999999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tax ID / VAT Number</Text>
                <TextInput
                  style={styles.modalInput}
                  value={billingInfo.taxId}
                  onChangeText={text => setBillingInfo(prev => ({ ...prev, taxId: text }))}
                  placeholder="Enter tax ID or VAT number"
                  placeholderTextColor="#999999"
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={() => setShowBillingModal(false)}
              >
                <Text style={styles.modalSecondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleUpdateBilling}
              >
                <Text style={styles.modalPrimaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  )
}

const { width } = Dimensions.get('window')

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

  // Main Plan Card
  mainCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  planBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  planStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: '#10B981',
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  planContent: {
    padding: 20,
  },
  planMainSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  planLeftSection: {
    flex: 1,
    paddingRight: 20,
  },
  planRightSection: {
    gap: 12,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 6,
  },
  planDescription: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 24,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  currency: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  price: {
    fontSize: 48,
    fontWeight: '800',
    color: '#000000',
  },
  period: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '500',
  },
  discountContainer: {
    marginTop: 8,
  },
  discountItem: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  discountText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  billingInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
    minWidth: 200,
  },
  billingInfoContent: {
    flex: 1,
  },
  billingInfoLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 2,
  },
  billingInfoValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  featuresContainer: {
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '45%',
    flex: 1,
  },
  checkIcon: {
    width: 16,
    height: 16,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  featureText: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
  },

  // Standard Cards
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  clickableCard: {
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
  },

  // Usage Billing
  usageBillingContainer: {
    gap: 12,
  },
  usageBillingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  usageBillingLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  usageBillingValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
  },
  usageBillingDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  usageBillingTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  usageBillingTotalLabel: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  usageBillingTotalValue: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '700',
  },

  // Billing Information
  billingGrid: {
    gap: 16,
  },
  billingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  billingLabel: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  billingValue: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },

  // Payment Method
  paymentMethodContainer: {
    gap: 12,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTypeIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'Courier',
    letterSpacing: 1,
  },
  cardExpiry: {
    fontSize: 13,
    color: '#666666',
    marginBottom: 2,
  },
  cardType: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  manageCardsHint: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageCardsText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },

  // Actions
  actionContainer: {
    gap: 16,
  },
  primaryAction: {
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionDisabled: {
    backgroundColor: '#999999',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },

  // Billing History Preview
  historyContainer: {
    gap: 12,
  },
  historyPreviewText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 8,
  },
  historyItemPreview: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyMainInfo: {
    marginBottom: 4,
  },
  historyInvoiceId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  historyPeriod: {
    fontSize: 12,
    color: '#666666',
  },
  historyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyAmount: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  historyStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  historyStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 13,
    color: '#666666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  // Upgrade Card
  upgradeCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  upgradeContent: {
    padding: 24,
    alignItems: 'center',
  },
  upgradeHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  upgradeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  upgradeSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
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
})
// components/BillingHistorySection.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  ArrowLeft,
  Receipt,
  Mail,
  Eye,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_MOBILE = SCREEN_WIDTH < 768;

export default function BillingHistorySection({ onBack, isMobile = false }) {
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, paid, failed, pending

  useEffect(() => {
    loadBillingHistory();
  }, []);

  const loadBillingHistory = async () => {
    try {
      setLoading(true);
      // Load from AsyncStorage first (for demo purposes)
      const stored = await AsyncStorage.getItem('billingHistory');
      if (stored) {
        setBillingHistory(JSON.parse(stored));
      } else {
        // Default demo data
        const demoHistory = [
          {
            id: 'inv_1234567890',
            number: 'INV-2024-001',
            date: '2024-12-15',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            plan: 'Pro Plan',
            period: 'Dec 2024 - Jan 2025',
            paymentMethod: '**** 4242',
            downloadUrl: 'https://example.com/invoice/inv_1234567890.pdf',
          },
          {
            id: 'inv_1234567891',
            number: 'INV-2024-002',
            date: '2024-11-15',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            plan: 'Pro Plan',
            period: 'Nov 2024 - Dec 2024',
            paymentMethod: '**** 4242',
            downloadUrl: 'https://example.com/invoice/inv_1234567891.pdf',
          },
          {
            id: 'inv_1234567892',
            number: 'INV-2024-003',
            date: '2024-10-15',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            plan: 'Pro Plan',
            period: 'Oct 2024 - Nov 2024',
            paymentMethod: '**** 4242',
            downloadUrl: 'https://example.com/invoice/inv_1234567892.pdf',
          },
          {
            id: 'inv_1234567893',
            number: 'INV-2024-004',
            date: '2024-09-15',
            amount: 29.99,
            currency: 'USD',
            status: 'failed',
            plan: 'Pro Plan',
            period: 'Sep 2024 - Oct 2024',
            paymentMethod: '**** 4242',
            downloadUrl: null,
            failureReason: 'Insufficient funds',
          },
          {
            id: 'inv_1234567894',
            number: 'INV-2024-005',
            date: '2024-08-15',
            amount: 29.99,
            currency: 'USD',
            status: 'paid',
            plan: 'Pro Plan',
            period: 'Aug 2024 - Sep 2024',
            paymentMethod: '**** 4242',
            downloadUrl: 'https://example.com/invoice/inv_1234567894.pdf',
          },
        ];
        setBillingHistory(demoHistory);
        await AsyncStorage.setItem('billingHistory', JSON.stringify(demoHistory));
      }
    } catch (error) {
      console.error('Error loading billing history:', error);
      Alert.alert('Error', 'Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (invoice) => {
    if (!invoice.downloadUrl) {
      Alert.alert('Error', 'Invoice download not available');
      return;
    }

    try {
      // In a real app, you would implement actual download functionality
      // For demo purposes, we'll just show an alert
      Alert.alert(
        'Download Invoice',
        `Invoice ${invoice.number} would be downloaded in a real app.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open in Browser', 
            onPress: () => {
              // Linking.openURL(invoice.downloadUrl);
              Alert.alert('Success', 'Invoice downloaded successfully!');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error downloading invoice:', error);
      Alert.alert('Error', 'Failed to download invoice');
    }
  };

  const resendInvoice = async (invoice) => {
    try {
      // In a real app, you would call your API to resend the invoice
      Alert.alert('Success', `Invoice ${invoice.number} has been resent to your email.`);
    } catch (error) {
      console.error('Error resending invoice:', error);
      Alert.alert('Error', 'Failed to resend invoice');
    }
  };

  const retryPayment = async (invoice) => {
    Alert.alert(
      'Retry Payment',
      `Retry payment for ${invoice.plan}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Retry',
          onPress: async () => {
            try {
              // In a real app, you would process the payment retry
              Alert.alert('Success', 'Payment retry initiated. You will receive a confirmation email.');
            } catch (error) {
              console.error('Error retrying payment:', error);
              Alert.alert('Error', 'Failed to retry payment');
            }
          }
        }
      ]
    );
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} color="#10B981" />;
      case 'failed':
        return <XCircle size={16} color="#EF4444" />;
      case 'pending':
        return <Clock size={16} color="#F59E0B" />;
      default:
        return <FileText size={16} color="#6B7280" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      case 'pending':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const filteredHistory = billingHistory.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  const renderHeader = () => (
    <View style={isMobile ? styles.mobileHeader : styles.desktopHeader}>
      {/* Always show back button if onBack is provided */}
      {onBack && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft size={20} color="#000000" />
        </TouchableOpacity>
      )}
      <Text style={isMobile ? styles.mobileHeaderTitle : styles.desktopHeaderTitle}>
        Billing History
      </Text>
      {isMobile && onBack && <View style={{ width: 32 }} />}
    </View>
  );

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <View style={styles.filterContent}>
        {[
          { key: 'all', label: 'All' },
          { key: 'paid', label: 'Paid' },
          { key: 'failed', label: 'Failed' },
          { key: 'pending', label: 'Pending' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.filterTab,
              filter === tab.key && styles.filterTabActive
            ]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[
              styles.filterTabText,
              filter === tab.key && styles.filterTabTextActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderInvoiceCard = (invoice) => (
    <View key={invoice.id} style={styles.invoiceCard}>
      <View style={styles.invoiceContent}>
        <View style={styles.invoiceHeader}>
          <View style={styles.invoiceInfo}>
            <View style={styles.invoiceNumberRow}>
              <Text style={styles.invoiceNumber}>{invoice.number}</Text>
              <View style={styles.statusBadge}>
                {getStatusIcon(invoice.status)}
                <Text style={[styles.statusText, { color: getStatusColor(invoice.status) }]}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.invoiceDateRow}>
              <Calendar size={12} color="#666666" />
              <Text style={styles.invoiceDate}>
                {formatDate(invoice.date)}
              </Text>
            </View>
            <Text style={styles.invoicePlan}>{invoice.plan}</Text>
            <Text style={styles.invoicePeriod}>{invoice.period}</Text>
          </View>
          <View style={styles.invoiceAmount}>
            <Text style={styles.amountText}>{formatAmount(invoice.amount, invoice.currency)}</Text>
            <Text style={styles.paymentMethod}>Paid with {invoice.paymentMethod}</Text>
          </View>
        </View>

        {invoice.status === 'failed' && (
          <View style={styles.failureNotice}>
            <XCircle size={16} color="#EF4444" />
            <Text style={styles.failureText}>{invoice.failureReason}</Text>
          </View>
        )}

        <View style={styles.invoiceActions}>
          {invoice.status === 'paid' && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => downloadInvoice(invoice)}
              >
                <Download size={16} color="#000000" />
                <Text style={styles.actionButtonText}>Download</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => resendInvoice(invoice)}
              >
                <Mail size={16} color="#000000" />
                <Text style={styles.actionButtonText}>Resend</Text>
              </TouchableOpacity>
            </>
          )}
          
          {invoice.status === 'failed' && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => retryPayment(invoice)}
            >
              <Text style={styles.retryButtonText}>Retry Payment</Text>
            </TouchableOpacity>
          )}

          {invoice.status === 'pending' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => Alert.alert('Pending', 'Payment is being processed. You will receive an email confirmation once completed.')}
            >
              <Eye size={16} color="#000000" />
              <Text style={styles.actionButtonText}>View Status</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Receipt size={48} color="#CCCCCC" />
      <Text style={styles.emptyTitle}>No Billing History</Text>
      <Text style={styles.emptyDescription}>
        {filter === 'all' 
          ? 'Your billing history will appear here once you have transactions.'
          : `No ${filter} invoices found.`
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <View style={styles.content}>
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionDescription}>
            View and manage your billing history, download invoices, and track payments.
          </Text>
        </View>

        {renderFilterTabs()}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000000" />
            <Text style={styles.loadingText}>Loading billing history...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.invoiceList}
            contentContainerStyle={styles.invoiceListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredHistory.length > 0 ? (
              filteredHistory.map(renderInvoiceCard)
            ) : (
              renderEmptyState()
            )}
          </ScrollView>
        )}
      </View>
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
    paddingHorizontal: 0, // Removed padding since wrapper will handle it
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
  
  // Description with padding
  descriptionContainer: {
    paddingHorizontal: 20, // Added padding to description
    paddingTop: 20,
    marginBottom: 20,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // Filter Tabs with padding
  filterContainer: {
    paddingHorizontal: 20, // Added padding container
    marginBottom: 20,
  },
  filterContent: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  filterTabTextActive: {
    color: '#000000',
    fontWeight: '600',
  },

  // Invoice List
  invoiceList: {
    flex: 1,
  },
  invoiceListContent: {
    paddingBottom: 40,
  },

  // Invoice Cards - Full width backgrounds with proper spacing
  invoiceCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 20, // Added horizontal margin for proper spacing
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  
  // Invoice content with padding
  invoiceContent: {
    padding: 18, // Padding only for content inside the card
  },
  
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  invoiceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 13,
    color: '#666666',
    marginLeft: 6,
  },
  invoicePlan: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  invoicePeriod: {
    fontSize: 12,
    color: '#666666',
  },
  invoiceAmount: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: '#666666',
  },

  // Failure Notice
  failureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  failureText: {
    fontSize: 13,
    color: '#DC2626',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },

  // Invoice Actions
  invoiceActions: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 6,
  },
  retryButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Empty State with padding
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20, // Added padding to empty state
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },

  // Loading with padding
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
});
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { X, CreditCard, Plus } from 'lucide-react-native';

export default function PaymentMethodPopup({
  visible,
  onClose,
  onUseSavedCard,
  onAddNewCard,
  planName,
  price,
  savedMethods = []
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const getBrandIcon = (brand) => {
    switch (brand) {
      case 'visa': return '💳';
      case 'mastercard': return '💳';
      case 'amex': return '💳';
      default: return '💳';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[
          styles.popup,
          { maxWidth: isWide ? 450 : width - 32 }
        ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Payment Method</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Plan Info */}
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{planName} Plan</Text>
            <Text style={styles.planPrice}>{price}</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Saved Payment Methods */}
            {savedMethods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your Saved Cards</Text>
                {savedMethods.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[styles.methodCard, method.is_default && styles.defaultCard]}
                    onPress={() => {
                      onUseSavedCard(method);
                      onClose();
                    }}
                  >
                    <View style={styles.methodInfo}>
                      <Text style={styles.methodBrand}>
                        {getBrandIcon(method.card_brand)} {method.card_brand?.toUpperCase()}
                      </Text>
                      <Text style={styles.methodNumber}>•••• •••• •••• {method.card_last4}</Text>
                      <Text style={styles.methodExpiry}>
                        {method.card_exp_month?.toString().padStart(2, '0')}/{method.card_exp_year}
                      </Text>
                    </View>
                    {method.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultText}>Default</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Add New Card Option */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {savedMethods.length > 0 ? 'Or Add New Card' : 'Payment Method'}
              </Text>
              <TouchableOpacity
                style={styles.addNewCard}
                onPress={() => {
                  onAddNewCard();
                  onClose();
                }}
              >
                <View style={styles.addNewIcon}>
                  <Plus size={20} color="#000000" />
                </View>
                <View style={styles.addNewText}>
                  <Text style={styles.addNewTitle}>Add New Payment Method</Text>
                  <Text style={styles.addNewDesc}>Credit or debit card</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '85%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planInfo: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defaultCard: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  methodInfo: {
    flex: 1,
  },
  methodBrand: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  methodNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  methodExpiry: {
    fontSize: 12,
    color: '#6B7280',
  },
  defaultBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  addNewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addNewIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  addNewText: {
    flex: 1,
  },
  addNewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  addNewDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    paddingHorizontal: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
});
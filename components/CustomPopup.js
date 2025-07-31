import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { X, AlertCircle, CheckCircle, CreditCard } from 'lucide-react-native';

export default function CustomPopup({
  visible,
  onClose,
  title,
  message,
  type = 'info', // 'info', 'success', 'error', 'payment'
  buttons = []
}) {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={32} color="#10B981" />;
      case 'error':
        return <AlertCircle size={32} color="#EF4444" />;
      case 'payment':
        return <CreditCard size={32} color="#3B82F6" />;
      default:
        return <AlertCircle size={32} color="#6B7280" />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'success': return '#F0FDF4';
      case 'error': return '#FEF2F2';
      case 'payment': return '#EFF6FF';
      default: return '#F9FAFB';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[
          styles.popup,
          { maxWidth: isWide ? 400 : width - 40 }
        ]}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}>
            {getIcon()}
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          {buttons.length > 0 && (
            <View style={styles.buttonContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    button.style === 'primary' && styles.primaryButton,
                    button.style === 'danger' && styles.dangerButton,
                    buttons.length === 1 && styles.singleButton
                  ]}
                  onPress={() => {
                    button.onPress?.();
                    if (button.autoClose !== false) onClose();
                  }}
                >
                  <Text style={[
                    styles.buttonText,
                    button.style === 'primary' && styles.primaryButtonText,
                    button.style === 'danger' && styles.dangerButtonText
                  ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  popup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  content: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  primaryButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  singleButton: {
    flex: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
});
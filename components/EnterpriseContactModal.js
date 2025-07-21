// components/EnterpriseContactModal.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  X,
  Building,
  CheckCircle,
  User,
  Mail,
  Phone,
  MessageSquare,
} from 'lucide-react-native';

export default function EnterpriseContactModal({ visible, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    teamSize: '',
    message: '',
  });
  const [isLoading, setIsLoading]     = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Prefill name & email
  useEffect(() => {
    (async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const name  = await AsyncStorage.getItem('userName');
      setFormData(f => ({ ...f, email: email || '', name: name || '' }));
    })();
  }, []);

  const handleInputChange = (field, value) =>
    setFormData(f => ({ ...f, [field]: value }));

  const handleSubmit = () => {
    const { name, email, company } = formData;
    if (!name.trim() || !email.trim() || !company.trim()) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        setFormData({
          name: '',
          email: '',
          company: '',
          phone: '',
          teamSize: '',
          message: '',
        });
      }, 2000);
    }, 1500);
  };

  const resetModal = () => {
    setShowSuccess(false);
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      teamSize: '',
      message: '',
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <CheckCircle size={48} color="#16A34A" style={styles.successIcon}/>
              <Text style={styles.successTitle}>Thank You!</Text>
              <Text style={styles.successText}>
                Your request has been submitted successfully. Our sales team will be in touch soon.
              </Text>
            </View>
          ) : (
            <>
              {/* ─── Close Button ────────────────────────────────── */}
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <X size={24} color="#374151" />
              </TouchableOpacity>

              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {/* ─── Header ───────────────────────────────────── */}
                <View style={styles.header}>
                  <Building size={32} color="#000" style={styles.headerIcon}/>
                  <Text style={styles.title}>Contact Enterprise Sales</Text>
                  <Text style={styles.subtitle}>
                    Tell us about your needs and our sales team will reach out shortly.
                  </Text>
                </View>

                {/* ─── Two-Column Row ────────────────────────────── */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Full Name *</Text>
                    <View style={styles.inputWrapper}>
                      <User size={16} color="#6B7280" style={styles.iconInline}/>
                      <TextInput
                        style={[styles.input, styles.withIcon]}
                        placeholder="Your full name"
                        value={formData.name}
                        onChangeText={t => handleInputChange('name', t)}
                        autoCapitalize="words"
                      />
                    </View>
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Email Address *</Text>
                    <View style={styles.inputWrapper}>
                      <Mail size={16} color="#6B7280" style={styles.iconInline}/>
                      <TextInput
                        style={[styles.input, styles.withIcon]}
                        placeholder="you@example.com"
                        value={formData.email}
                        onChangeText={t => handleInputChange('email', t)}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>

                {/* ─── Two-Column Row ────────────────────────────── */}
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>Company Name *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Company name"
                      value={formData.company}
                      onChangeText={t => handleInputChange('company', t)}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>Phone Number</Text>
                    <View style={styles.inputWrapper}>
                      <Phone size={16} color="#6B7280" style={styles.iconInline}/>
                      <TextInput
                        style={[styles.input, styles.withIcon]}
                        placeholder="Your phone number"
                        value={formData.phone}
                        onChangeText={t => handleInputChange('phone', t)}
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>
                </View>

                {/* ─── Single Row ────────────────────────────────── */}
                <View style={styles.fullWidth}>
                  <Text style={styles.label}>Team Size</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10-50 engineers"
                    value={formData.teamSize}
                    onChangeText={t => handleInputChange('teamSize', t)}
                  />
                </View>

                {/* ─── Message Box ────────────────────────────────── */}
                <View style={styles.fullWidth}>
                  <Text style={styles.label}>Tell us about your needs</Text>
                  <View style={[styles.inputWrapper, styles.textareaWrapper]}>
                    <MessageSquare size={16} color="#6B7280" style={styles.iconInlineTop}/>
                    <TextInput
                      style={[styles.textarea, styles.withIconTop]}
                      placeholder="Describe your requirements..."
                      value={formData.message}
                      onChangeText={t => handleInputChange('message', t)}
                      multiline
                    />
                  </View>
                </View>

                {/* ─── Submit ────────────────────────────────────── */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#FFF"/>
                    : <Text style={styles.submitText}>Contact Sales Team</Text>
                  }
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 12,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // rows
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  half: {
    width: '48%',
  },
  fullWidth: {
    width: '100%',
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },

  inputWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  iconInline: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  iconInlineTop: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#000',
  },
  withIcon: {
    paddingLeft: 40,
  },

  textareaWrapper: {
    height: 100,
  },
  textarea: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  withIconTop: {
    paddingLeft: 40,
  },

  submitButton: {
    width: '100%',
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: '#166534',
    textAlign: 'center',
  },
});

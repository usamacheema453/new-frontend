// screens/ManageFacilityMode.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Building } from 'lucide-react-native';   // any lucide icon you like

export default function ManageLocationMode() {
  const [isMobile, setIsMobile] = useState(false);

  // Simple breakpoint check so the card stays tidy on small screens
  useEffect(() => {
    const handleResize = () => {
      const width = Dimensions.get('window').width;
      setIsMobile(width < 768);
    };

    handleResize();                                   // initial run
    const sub = Dimensions.addEventListener('change', handleResize);

    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.card, isMobile && styles.cardMobile]}>
        <Building size={64} color="#000000" style={styles.icon} />

        <Text style={styles.title}>Coming&nbsp;Soon</Text>
        <Text style={styles.subtitle}>
          Manage Location Mode will be available in an upcoming release.
          We’re working hard. stay tuned!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* outer wrapper */
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  /* card styling (mirrors AdminDashboard) */
  card: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',

    // subtle elevation / border for light + dark modes
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardMobile: {
    width: '100%',
  },

  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

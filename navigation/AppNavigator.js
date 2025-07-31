// navigation/AppNavigator.js
import React from 'react';
import { Platform, Text, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';
import { ArrowLeft } from 'lucide-react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import HomePage            from '../screens/HomePage';
import LoginPage           from '../screens/LoginPage';
import SignupPage          from '../screens/SignupPage';
import PricingScreen       from '../screens/PricingScreen';
import Setup2FAPage        from '../screens/Setup2FAPage';
import TwoFactorPage       from '../screens/TwoFactorPage';
import ChatPage            from '../screens/ChatPage';
import AdminDashboard      from '../screens/AdminDashboard';
import SettingsPage        from '../screens/SettingsPage';
import ManageLocationMode  from '../screens/ManageLocationMode';
import ManageBrain         from '../screens/ManageBrain';
import SuperShare          from '../components/SuperShare';
;

import ProtectedRoute      from '../components/ProtectedRoute';
import AdminRoute          from '../components/AdminRoute';
import PaymentSuccessScreen from '../screens/PaymentSuccess';

// Mobile-only brain screens
let WriteTips, UploadPhoto, UploadManuals, UploadFile;
if (Platform.OS !== 'web') {
  try {
    WriteTips     = require('../../components/brain/WriteTips').default;
    UploadPhoto   = require('../../components/brain/UploadPhoto').default;
    UploadManuals = require('../../components/brain/UploadManuals').default;
    UploadFile    = require('../../components/brain/UploadFile').default;
  } catch (err) {
    console.warn('Brain components not found:', err);
  }
}

enableScreens();
const Stack = createNativeStackNavigator();

/* -------------------------------------------------------------------------- */
/*                                Header parts                                */
/* -------------------------------------------------------------------------- */
function ProfessionalTitle({ children }) {
  return (
    <Text
      style={{
        fontSize: 18,
        fontWeight: Platform.OS === 'ios' ? '600' : '500',
        letterSpacing: 0.15,
        color: '#fff',
        textAlign: 'center',
        lineHeight: 22,
      }}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {children}
    </Text>
  );
}

function CustomBackButton({ navigation }) {
  return (
    <TouchableOpacity
      style={{
        marginLeft: Platform.OS === 'ios' ? 0 : 4,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onPress={() => navigation.goBack()}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      activeOpacity={0.6}
    >
      <ArrowLeft color="#fff" size={24} strokeWidth={2.8} />
    </TouchableOpacity>
  );
}

function professionalHeaderOptions(title) {
  return ({ navigation }) => ({
    headerTitleAlign: 'center',
    headerTitle: () => <ProfessionalTitle>{title}</ProfessionalTitle>,
    headerStyle: {
      backgroundColor: '#000',
      borderBottomWidth: 0,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 8,
    },
    headerShadowVisible: true,
    headerLeft: () => <CustomBackButton navigation={navigation} />,
    headerLeftContainerStyle: { paddingLeft: 12 },
    headerRightContainerStyle: { paddingRight: 16 },
    headerTitleContainerStyle: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
  });
}

/* -------------------------------------------------------------------------- */
/*                       Navigator with safe-area handling                    */
/* -------------------------------------------------------------------------- */
function NavigatorInner() {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  // Screens that **do** show the native-stack header on web
  const headerScreens = [
    'Login',
    'Signup',
    'Settings',
    'ManageLocationMode',
    'ManageBrain',
    'SuperShare',
  ];

  // Screens that handle their own top / bottom safe area
  const selfHandledScreens = [
    'Home',
    'Pricing',
    'PaymentSuccess', // ✅ Add this
    'Setup2FA',
    'TwoFactor',
    'Chat',
    'Admin',
    'WriteTips',
    'UploadPhoto',
    'UploadManuals',
    'UploadFile',
  ];

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => {
        const hasNavHeader = isWeb && headerScreens.includes(route.name);

        /* -------------------------------- Top padding -------------------------------- */
        let paddingTop = 0;
        if (isWeb) {
          // No extra gap under the header on web
          paddingTop = 0;
        } else if (!selfHandledScreens.includes(route.name)) {
          // Native: push content below the *status* area (-8 keeps a nice tuck)
          paddingTop = Math.max(insets.top - 8, 0);
        }

        /* ------------------------------ Bottom padding ------------------------------ */
        let paddingBottom = 0;
        if (!isWeb && !selfHandledScreens.includes(route.name)) {
          // Native: respect the bottom safe-area inset (e.g. Home-indicator)
          paddingBottom = insets.bottom;
        }

        return {
          animation: 'fade_from_bottom',
          animationDuration: 350,
          gestureEnabled: true,
          headerBackTitleVisible: false,
          headerShown: hasNavHeader,
          contentStyle: { paddingTop, paddingBottom },
        };
      }}
    >
      {/* -------------------------------------------------------------------------- */}
      {/* Public screens                                                             */}
      {/* -------------------------------------------------------------------------- */}
      <Stack.Screen name="Home" component={HomePage} />

      <Stack.Screen
        name="Login"
        component={LoginPage}
        options={professionalHeaderOptions('Login')}
      />

      <Stack.Screen
        name="Signup"
        component={SignupPage}
        options={professionalHeaderOptions('Sign Up')}
      />

      <Stack.Screen 
        name="Pricing" 
        component={PricingScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen 
        name="PaymentSuccess"
        component={PaymentSuccessScreen}
        options={{
          headerShown: false,
          gestureEnabled:false
        }}
      />

      <Stack.Screen name="Setup2FA" component={Setup2FAPage} />
      <Stack.Screen name="TwoFactor" component={TwoFactorPage} />

      {/* -------------------------------------------------------------------------- */}
      {/* Protected                                                                  */}
      {/* -------------------------------------------------------------------------- */}
      <Stack.Screen name="Chat">
        {props => (
          <ProtectedRoute>
            <ChatPage {...props} />
          </ProtectedRoute>
        )}
      </Stack.Screen>

      <Stack.Screen name="Admin">
        {props => (
          <AdminRoute>
            <AdminDashboard {...props} />
          </AdminRoute>
        )}
      </Stack.Screen>

      <Stack.Screen
        name="Settings"
        component={SettingsPage}
        options={professionalHeaderOptions('Settings')}
      />

      {/* -------------------------------------------------------------------------- */}
      {/* Feature screens                                                            */}
      {/* -------------------------------------------------------------------------- */}
      <Stack.Screen
        name="ManageLocationMode"
        component={ManageLocationMode}
        options={professionalHeaderOptions('Manage Location Mode')}
      />
      <Stack.Screen
        name="ManageBrain"
        component={ManageBrain}
        options={professionalHeaderOptions('Manage Brain')}
      />
      <Stack.Screen
        name="SuperShare"
        component={SuperShare}
        options={professionalHeaderOptions('Super Share')}
      />

      {/* -------------------------------------------------------------------------- */}
      {/* Mobile-only screens                                                         */}
      {/* -------------------------------------------------------------------------- */}
      {Platform.OS !== 'web' && WriteTips && (
        <Stack.Screen name="WriteTips" component={WriteTips} />
      )}
      {Platform.OS !== 'web' && UploadPhoto && (
        <Stack.Screen name="UploadPhoto" component={UploadPhoto} />
      )}
      {Platform.OS !== 'web' && UploadManuals && (
        <Stack.Screen name="UploadManuals" component={UploadManuals} />
      )}
      {Platform.OS !== 'web' && UploadFile && (
        <Stack.Screen name="UploadFile" component={UploadFile} />
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <SafeAreaProvider>
      <NavigatorInner />
    </SafeAreaProvider>
  );
}
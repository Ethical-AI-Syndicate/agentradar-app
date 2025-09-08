import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FlashMessage from 'react-native-flash-message';

import ApiService from './services/ApiService';
import SocketService from './services/SocketService';
import { theme } from './styles/theme';

import AuthScreen from './screens/AuthScreen';
import DashboardScreen from './screens/DashboardScreen';
import AlertsScreen from './screens/AlertsScreen';
import AlertDetailScreen from './screens/AlertDetailScreen';
import MapScreen from './screens/MapScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import PreferencesScreen from './screens/PreferencesScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Alerts':
              iconName = focused ? 'notifications' : 'notifications-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Profile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          headerTitle: 'AgentRadar'
        }}
      />
      <Tab.Screen 
        name="Alerts" 
        component={AlertsScreen}
        options={{
          title: 'Alerts'
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          title: 'Map View'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile'
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={TabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AlertDetail"
            component={AlertDetailScreen}
            options={{ 
              title: 'Alert Details',
              headerBackTitleVisible: false
            }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
          <Stack.Screen
            name="Preferences"
            component={PreferencesScreen}
            options={{ title: 'Alert Preferences' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await SplashScreen.preventAutoHideAsync();
      
      await setupNotifications();
      
      const authenticated = await ApiService.isAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const userData = await AsyncStorage.getItem('user_data');
        if (userData) {
          setUser(JSON.parse(userData));
        }
        
        try {
          await SocketService.connect();
          console.log('Socket connected successfully');
        } catch (socketError) {
          console.warn('Socket connection failed:', socketError);
        }
      }
      
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  const setupNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('alerts', {
          name: 'Property Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: theme.colors.primary,
        });

        await Notifications.setNotificationChannelAsync('high_priority', {
          name: 'High Priority Alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: theme.colors.accent,
          sound: 'default',
        });
      }

      await Notifications.setNotificationCategoryAsync('alert', [
        {
          identifier: 'view',
          buttonTitle: 'View',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'bookmark',
          buttonTitle: 'Bookmark',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('high_priority', [
        {
          identifier: 'view',
          buttonTitle: 'View Now',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);

      const subscription = Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });

      const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
        const { notification } = response;
        const data = notification.request.content.data;
        
        if (data.alertId) {
          // Handle navigation to alert detail
          console.log('Navigate to alert:', data.alertId);
        }
      });

      return () => {
        subscription.remove();
        responseSubscription.remove();
      };

    } catch (error) {
      console.error('Notification setup error:', error);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: theme.colors.background 
          }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ 
              marginTop: 16, 
              fontSize: 16, 
              color: theme.colors.text.primary,
              fontWeight: '500'
            }}>
              Loading AgentRadar...
            </Text>
          </View>
          <StatusBar style="auto" />
        </PaperProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AppNavigator isAuthenticated={isAuthenticated} />
          <FlashMessage position="top" />
        </NavigationContainer>
        <StatusBar style="auto" />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
// 🔹 FILE: App.js (чистый с подключением красивого SplashScreen)
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import MessageScreen from './src/screens/MessageScreen';
import UserScreen from './src/screens/UserScreen';
import AnalyticsScreen from './src/screens/AnalyticsScreen';
import SplashScreen from './src/screens/SplashScreen';
import { AnalyticsProvider } from './src/context/AnalyticsContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Meters" component={MessageScreen} options={{ title: 'Счетчики' }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Аналитика' }} />
      <Tab.Screen name="User" component={UserScreen} options={{ title: 'Пользователь' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const loginTime = await AsyncStorage.getItem('login_time');

        if (token && loginTime) {
          const now = Date.now();
          const diff = now - parseInt(loginTime, 10);
          const oneDay = 86400000;

          if (diff < oneDay) {
            setInitialRoute('MainTabs');
          } else {
            await AsyncStorage.clear();
            setInitialRoute('LoginScreen');
          }
        } else {
          setInitialRoute('LoginScreen');
        }
      } catch (e) {
        setInitialRoute('LoginScreen');
      }
    };

    checkAuth();
  }, []);

  if (showSplash || initialRoute === null) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <AnalyticsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AnalyticsProvider>
  );
}

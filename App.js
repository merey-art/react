// 🔹 FILE: App.js (SplashScreen с логотипом и анимацией появления и исчезновения)
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
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

function SplashScreen({ onFinish }) {
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Image source={require('./assets/DEG Logo Full.png')} style={styles.logo} resizeMode="contain" />
        <ActivityIndicator size="large" color="#003366" style={{ marginTop: 24 }} />
      </Animated.View>
    </View>
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
  },
  logo: {
    width: 240,
    height: 100,
  },
});

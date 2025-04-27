// 🔹 FILE: App.js (обновлённый с навигацией регистрации и восстановления пароля)
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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

export default function App() {
  return (
    <AnalyticsProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="LoginScreen" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="ResetPasswordScreen" component={ResetPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </AnalyticsProvider>
  );
}

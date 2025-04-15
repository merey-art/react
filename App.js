import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react=-navigation/bottom-tabs';

import LoginScreen from './src/screens/LoginScreen';
import MessageScreen from './src/screens/MessageScreen';
import UserScreen from './src/screens/UserScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Вкладки после авторизации
function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Meters" component={MessageScreen} options={{ title: 'Счетчики' }} />
      <Tab.Screen name="User" component={UserScreen} options={{ title: 'Пользователь' }} />
    </Tab.Navigator>
  );
}

// Основной компонент приложения
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

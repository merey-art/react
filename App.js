// 🔹 FILE: App.js — добавлена вкладка «Ремонт»
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// screens
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';
import UserScreen from './src/screens/UserScreen';
import CombinedScreen from './src/screens/CombinedScreen';
import RepairScreen from './src/screens/RepairScreen';
import SplashScreen from './src/screens/SplashScreen';

import { AnalyticsProvider } from './src/context/AnalyticsContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: '#003366',
                tabBarInactiveTintColor: 'gray',
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    switch (route.name) {
                        case 'Meters':
                            iconName = 'gauge';
                            break;
                        case 'Repair':
                            iconName = 'hammer-wrench';
                            break;
                        case 'User':
                            iconName = 'account-circle';
                            break;
                        default:
                            iconName = 'circle';
                    }
                    return <Icon name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Meters" component={CombinedScreen} options={{ title: 'Счётчики' }} />
            <Tab.Screen name="Repair" component={RepairScreen} options={{ title: 'Ремонт' }} />
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
                    const fresh = Date.now() - parseInt(loginTime, 10) < 86_400_000; // 24h
                    setInitialRoute(fresh ? 'MainTabs' : 'LoginScreen');
                    if (!fresh) await AsyncStorage.clear();
                } else setInitialRoute('LoginScreen');
            } catch {
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

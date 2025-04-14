import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './src/screens/LoginScreen';
import MessageScreen from './src/screens/MessageScreen';

const Stack = createStackNavigator();

// Основной компонент приложения
export default function App() {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="Messages" component={MessageScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}

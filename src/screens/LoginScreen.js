import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Экран авторизации по email и паролю
export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Функция авторизации
    const login = async () => {
        try {
            const response = await axios.post('https://metering.beeline.kz:4443/api/auth/login', {
                email,
                password,
            });

            const token = response.data?.data?.access_token;
            await AsyncStorage.setItem('token', token);
            navigation.navigate('Messages');
        } catch (error) {
            Alert.alert('Ошибка авторизации', error.response?.data?.error?.msg || 'Не удалось войти');
        }
    };

    return (
        <View style={{ padding: 20 }}>
            <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
            <Button title="Войти" onPress={login} />
        </View>
    );
}

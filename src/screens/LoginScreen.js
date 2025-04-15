import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = async () => {
    try {
      const response = await axios.post('https://metering.beeline.kz:4443/api/auth/login', {
        email,
        password,
      });

      const token = response.data?.data?.access_token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('email', email);
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Ошибка авторизации', 'Токен не получен');
      }
    } catch (error) {
      Alert.alert('Ошибка авторизации', error.response?.data?.error?.msg || 'Не удалось войти');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          width: '100%',
          padding: 10,
          borderWidth: 1,
          borderRadius: 5,
          marginBottom: 10,
        }}
      />
      <TextInput
        placeholder="Пароль"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          width: '100%',
          padding: 10,
          borderWidth: 1,
          borderRadius: 5,
          marginBottom: 20,
        }}
      />
      <Button title="Войти" onPress={login} />
    </View>
  );
}

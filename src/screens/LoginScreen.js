// 🔹 FILE: src/screens/LoginScreen.js (обновлённый с получением access_token из data)
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!login.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Пожалуйста, введите логин и пароль');
      return;
    }

    try {
      const response = await axios.post('https://metering.beeline.kz:4443/api/auth/login', {
        email: login.trim(),
        password: password.trim(),
      });

      const token = response.data?.data?.access_token;
      if (token) {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('email', login.trim());
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Ошибка авторизации', 'Токен не получен');
      }
    } catch (error) {
      Alert.alert('Ошибка авторизации', error.response?.data?.error?.msg || 'Не удалось войти');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Логин</Text>

        <TextInput
          style={styles.input}
          placeholder="Логин"
          placeholderTextColor="#999"
          value={login}
          onChangeText={setLogin}
        />
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          secureTextEntry
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity activeOpacity={0.9} style={styles.shadowWrapper} onPress={handleLogin}>
          <LinearGradient
            colors={["rgba(0,51,102,1)", "rgba(0,153,153,1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.loginButton}
          >
            <Text style={styles.loginText}>Войти</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.linksRow}>
        <TouchableOpacity><Text style={styles.linkText}>Регистрация</Text></TouchableOpacity>
        <TouchableOpacity><Text style={styles.linkText}>Забыл пароль?</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 24,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderColor: '#d1d5db',
    borderWidth: 1,
    fontSize: 16,
  },
  shadowWrapper: {
    borderRadius: 16,
    marginBottom: 16,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(0,51,102,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingHorizontal: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#007b83',
  },
});

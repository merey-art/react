import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Ошибка', 'Введите ваш email');
      return;
    }

    try {
      await axios.post('https://metering.beeline.kz:4443/api/auth/password/create', { email: email.trim() });
      Alert.alert('Успех', 'Если email зарегистрирован, будет отправлено письмо');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', error.response?.data?.error?.msg || 'Не удалось отправить запрос');
    }
  };

  return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>{'<'} Назад</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Восстановление пароля</Text>
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />

          <TouchableOpacity activeOpacity={0.9} style={styles.shadowWrapper} onPress={handleResetPassword}>
            <LinearGradient colors={["rgba(0,51,102,1)", "rgba(0,153,153,1)"]} style={styles.loginButton}>
              <Text style={styles.loginText}>Отправить</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 1,
  },
  backText: {
    fontSize: 16,
    color: '#007b83',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});

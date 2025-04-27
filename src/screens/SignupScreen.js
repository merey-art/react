import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';

export default function SignupScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name || !companyName) {
      Alert.alert('Ошибка', 'Пожалуйста, заполните все поля');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    try {
      await axios.post('https://metering.beeline.kz:4443/api/auth/signup', {
        email,
        password,
        password_confirmation: confirmPassword,
        name,
        company_name: companyName,
        user_time_zone: 0,
        company_type_id: 0,
      });

      Alert.alert('Успех', 'Регистрация прошла успешно');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка регистрации', error.response?.data?.error?.msg || 'Не удалось зарегистрироваться');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Регистрация</Text>
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Пароль" value={password} onChangeText={setPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Подтвердите пароль" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Ваше имя" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Компания" value={companyName} onChangeText={setCompanyName} />
        <TouchableOpacity activeOpacity={0.9} style={styles.shadowWrapper} onPress={handleSignup}>
          <LinearGradient colors={["rgba(0,51,102,1)", "rgba(0,153,153,1)"]} style={styles.loginButton}>
            <Text style={styles.loginText}>Зарегистрироваться</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6f8', justifyContent: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#fff', padding: 24, borderRadius: 16, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 5 } }) },
  title: { fontSize: 24, fontWeight: 'bold', alignSelf: 'center', marginBottom: 24, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16, borderColor: '#d1d5db', borderWidth: 1, fontSize: 16 },
  shadowWrapper: { borderRadius: 16, marginBottom: 16 },
  loginButton: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
});

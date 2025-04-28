// 🔹 FILE: src/screens/UserScreen.js (обновление подтверждения выхода)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'https://metering.beeline.kz:4443';

export default function UserScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [objectId, setObjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);

  const getToken = async () => await AsyncStorage.getItem('token');

  const createUser = async () => {
    try {
      const token = await getToken();
      const res = await axios.post(`${BASE_URL}/api/user/create`, {
        name,
        email,
        password,
        password_confirmation: password,
        user_time_zone: 5,
        access_group_id: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Пользователь создан', `ID: ${res.data?.data?.id}`);
      setUserId(res.data?.data?.id?.toString() || '');
      fetchUsers();
    } catch (err) {
      Alert.alert('Ошибка', err.response?.data?.error?.msg || 'Ошибка создания пользователя');
    }
  };

  const tieUserToObject = async () => {
    try {
      const token = await getToken();
      await axios.post(`${BASE_URL}/api/objects/tie_users`, {
        object_id: objectId,
        user_ids: [parseInt(userId)]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert('Пользователь привязан к объекту');
    } catch (err) {
      Alert.alert('Ошибка привязки', err.response?.data?.error?.msg || 'Ошибка привязки пользователя');
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await axios.post(`${BASE_URL}/api/company/users`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      console.log('Ошибка загрузки пользователей', err.message);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = async () => {
    Alert.alert(
      'Выход',
      'Вы уверены, что хотите выйти из аккаунта?',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('email');
            navigation.replace('LoginScreen');
          },
        },
      ]
    );
  };

  const renderHeader = () => (
    <View style={{ padding: 20 }}>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>

      <Text>Имя</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} />

      <Text>Пароль</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />

      <Button title="Создать пользователя" onPress={createUser} />

      <Text style={{ marginTop: 20 }}>ID созданного пользователя</Text>
      <TextInput value={userId} onChangeText={setUserId} style={styles.input} />

      <Text>Object ID</Text>
      <TextInput value={objectId} onChangeText={setObjectId} style={styles.input} />

      <Button title="Привязать пользователя к объекту" onPress={tieUserToObject} />

      <Text style={{ marginVertical: 20, fontWeight: 'bold' }}>Пользователи компании</Text>
    </View>
  );

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      renderItem={({ item }) => (
        <Text style={{ marginBottom: 5 }}>
          {item.name} | ID: {item.id} | {item.email}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    borderRadius: 6,
    borderColor: '#ccc',
  },
  logoutButton: {
    alignSelf: 'center',
    marginBottom: 16,
    backgroundColor: '#ddd',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  logoutText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});

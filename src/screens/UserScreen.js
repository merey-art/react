import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://metering.beeline.kz:4443';

export default function UsersScreen() {
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

  const fetchUsers = async () => {
    try {
      const token = await getToken();
      const res = await axios.post(`${BASE_URL}/api/company/users`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data?.data?.users || []);
    } catch (err) {
      console.log('Ошибка загрузки пользователей', err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Имя</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Пароль</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />

      <Button title="Создать пользователя" onPress={createUser} />

      <Text style={{ marginTop: 20 }}>ID созданного пользователя</Text>
      <TextInput value={userId} onChangeText={setUserId} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Text>Object ID</Text>
      <TextInput value={objectId} onChangeText={setObjectId} style={{ borderWidth: 1, marginBottom: 10 }} />

      <Button title="Привязать пользователя к объекту" onPress={tieUserToObject} />

      <Text style={{ marginVertical: 20, fontWeight: 'bold' }}>Пользователи компании</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Text style={{ marginBottom: 5 }}>
            {item.name} | ID: {item.id} | {item.email}
          </Text>
        )}
      />
    </ScrollView>
  );
}

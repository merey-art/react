import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function UserScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userEmail = await AsyncStorage.getItem('email');
        setEmail(userEmail);

        const res = await axios.post(
          'https://metering.beeline.kz:4443/api/company/users',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/json',
              'X-CSRF-TOKEN': '',
            },
          }
        );

        const usersData = res.data?.data?.users || [];
        setUsers(usersData);
      } catch (err) {
        Alert.alert('Ошибка', 'Не удалось загрузить список пользователей');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('email');
    navigation.replace('Login');
  };

  const renderItem = ({ item }) => (
    <View style={{ marginBottom: 15 }}>
      <Text>👤 {item.name}</Text>
      <Text>📧 {item.email}</Text>
      {item.job_title && <Text>💼 {item.job_title}</Text>}
      {item.phone_number && <Text>📞 {item.phone_number}</Text>}
      {item.company_title && <Text>🏢 {item.company_title}</Text>}
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        Вы вошли как: {email}
      </Text>
      <Button title="Выйти" onPress={logout} />

      <Text style={{ fontSize: 18, marginVertical: 20 }}>Сотрудники компании:</Text>

      {loading ? (
        <Text>Загрузка...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

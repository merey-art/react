// 🔹 FILE: src/screens/MessageScreen.js (обновление на использование datetime и meter_number)
import React, { useState, useContext } from 'react';
import { View, Text, FlatList, Button, Platform, TextInput, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { AnalyticsContext } from '../context/AnalyticsContext';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import moment from 'moment';

const BASE_URL = 'https://metering.beeline.kz:4443';
const DEVICE_MESSAGES_ENDPOINT = '/api/device/messages';

export default function MessageScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [highlightThreshold, setHighlightThreshold] = useState(1);

  const { setAnalyticsData } = useContext(AnalyticsContext);

  const toUnix = (date) => Math.floor(date.getTime() / 1000);
  const getToken = async () => await AsyncStorage.getItem('token');

  const getMessages = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    let allMessages = [];

    const payload = {
      msgType: 1,
      msgGroup: 0,
      startDate: toUnix(startDate),
      stopDate: toUnix(endDate),
      paginate: true,
      per_page: 100,
      profile_type: 0,
      with_transformation_ratio: true,
      with_loss_factor: true,
    };

    try {
      const res = await axios.post(BASE_URL + DEVICE_MESSAGES_ENDPOINT, payload, { headers });
      const data = res.data?.data?.messages?.data || [];

      const sorted = data
        .sort((a, b) => (a.datetime || 0) - (b.datetime || 0))
        .map((entry) => ({
          ...entry,
          name: '—',
          meter_number: entry.meter_number?.toString() || '—',
        }));

      allMessages.push(...sorted);
    } catch (err) {
      console.log('Ошибка получения сообщений:', err.message);
    }

    let grouped = {};
    for (const msg of allMessages) {
      if (!grouped[msg.meter_number]) {
        grouped[msg.meter_number] = {
          meter_number: msg.meter_number,
          messages: [],
          totalUsage: 0,
        };
      }
      grouped[msg.meter_number].messages.push(msg);
      if (typeof msg.delta_in1 === 'number' && msg.delta_in1 > 0) {
        grouped[msg.meter_number].totalUsage += msg.delta_in1;
      }
    }

    const TARIFF = 120;
    Object.values(grouped).forEach((group) => {
      group.totalCost = group.totalUsage * TARIFF;
    });

    setMessages(Object.values(grouped));
    const flatMessages = Object.values(grouped).flatMap((g) => g.messages);
    setAnalyticsData(flatMessages);
    setLoading(false);
  };

  return (
    <View style={{ padding: 10 }}>
      <View>
        <Button title="Выбрать начальную дату" onPress={() => setShowStart(true)} />
        {showStart && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowStart(Platform.OS === 'ios');
              if (date) setStartDate(date);
            }}
          />
        )}
        <Button title="Выбрать конечную дату" onPress={() => setShowEnd(true)} />
        {showEnd && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(e, date) => {
              setShowEnd(Platform.OS === 'ios');
              if (date) setEndDate(date);
            }}
          />
        )}
        <TextInput
          style={{ borderWidth: 1, marginVertical: 10, padding: 5 }}
          keyboardType="numeric"
          placeholder="Порог для подсветки (delta_in1)"
          value={highlightThreshold.toString()}
          onChangeText={(text) => setHighlightThreshold(parseFloat(text) || 0)}
        />
        <Button title="Получить данные" onPress={getMessages} />
      </View>

      {loading ? (
        <SkeletonPlaceholder>
          <SkeletonPlaceholder.Item marginTop={10}>
            {[...Array(3)].map((_, idx) => (
              <SkeletonPlaceholder.Item key={idx} marginBottom={20}>
                <SkeletonPlaceholder.Item width="80%" height={20} borderRadius={4} />
                <SkeletonPlaceholder.Item marginTop={6} width="60%" height={20} borderRadius={4} />
              </SkeletonPlaceholder.Item>
            ))}
          </SkeletonPlaceholder.Item>
        </SkeletonPlaceholder>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold' }}>Серийный номер: {item.meter_number}</Text>
              {item.messages.map((msg, idx) => {
                const date = msg.datetime ? moment.unix(msg.datetime).format('DD.MM.YYYY HH:mm') : '—';
                const delta = msg.delta_in1 ?? (idx > 0 ? (msg.in1 - item.messages[idx - 1].in1).toFixed(2) : '—');
                return (
                  <Text
                    key={idx}
                    style={{ color: delta > highlightThreshold ? 'red' : 'black' }}
                  >
                    [{date}] | in1: {msg.in1} | delta_in1: {delta}
                  </Text>
                );
              })}
              <Text>Суммарный расход: {item.totalUsage.toFixed(2)} м³</Text>
              <Text>Стоимость: {item.totalCost.toFixed(2)} ₸</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

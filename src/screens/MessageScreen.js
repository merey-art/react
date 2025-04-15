import React, { useState } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import axios from 'axios';

const BASE_URL = 'https://metering.beeline.kz:4443';
const DEVICE_LIST_ENDPOINT = '/api/device/metering_devices';
const DEVICE_MESSAGES_ENDPOINT = '/api/device/messages';

export default function MessageScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [deviceMap, setDeviceMap] = useState({});

  const toUnix = (date) => Math.floor(date.getTime() / 1000);

  const getToken = async () => await AsyncStorage.getItem('token');

  const getAllDevices = async (token) => {
    try {
      const res = await axios.post(
        BASE_URL + DEVICE_LIST_ENDPOINT,
        { paginate: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const devices = res.data?.data?.metering_devices || [];
      const map = {};
      for (const d of devices) {
        map[d.id] = d.name;
      }
      setDeviceMap(map);
      return devices.map((d) => d.id);
    } catch {
      return [];
    }
  };

  const getMessages = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) return;

    const deviceIds = await getAllDevices(token);
    const headers = { Authorization: `Bearer ${token}` };
    let allMessages = [];

    for (const device_id of deviceIds) {
      const payload = {
        device_id,
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
          .sort((a, b) => new Date(a.datetime_at_hour) - new Date(b.datetime_at_hour))
          .map((entry) => ({
            ...entry,
            name: deviceMap[entry.device_id] || 'Неизвестно',
          }));

        for (let i = 1; i < sorted.length; i++) {
          if (sorted[i].device_id === sorted[i - 1].device_id) {
            sorted[i].usage = sorted[i].in1 !== null && sorted[i - 1].in1 !== null
              ? sorted[i - 1].in1 - sorted[i].in1
              : null;
          } else {
            sorted[i].usage = null;
          }
        }
        if (sorted.length) {
          sorted[0].usage = null;
        }

        allMessages.push(...sorted);
      } catch (err) {
        console.log(`Ошибка получения данных по устройству ${device_id}:`, err.message);
      }
    }

    setMessages(allMessages);
    setLoading(false);
  };

  const exportToExcel = async () => {
    if (!messages.length) return;

    const data = messages.map((msg) => ({
      Название: msg.name,
      Показания: msg.in1,
      Расход: msg.usage,
      RSSI: msg.rssi,
      'Дата и время': msg.datetime_at_hour,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Messages');

    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

    const path = `${RNFS.DownloadDirectoryPath}/metering_data.xlsx`;

    await RNFS.writeFile(path, wbout, 'ascii');
    alert(`Файл сохранён: ${path}`);
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
        <Button title="Получить данные" onPress={getMessages} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <Text>
                Название: {item.name}, Показания: {item.in1}, Расход: {item.usage ?? '—'}, Дата: {item.datetime_at_hour}
              </Text>
            )}
          />
          <Button title="Выгрузить в Excel" onPress={exportToExcel} />
        </>
      )}
    </View>
  );
}

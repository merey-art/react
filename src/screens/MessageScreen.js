import React, { useState } from 'react';
import { View, Text, FlatList, Button, ActivityIndicator, Platform, TextInput } from 'react-native';
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
  const [highlightThreshold, setHighlightThreshold] = useState(1);

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
        map[d.id] = {
          name: d.name,
          serial: d.deviceID,
          address: d.address?.unrestricted_value || '—',
        };
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
            name: deviceMap[entry.device_id]?.name || '—',
            serial: deviceMap[entry.device_id]?.serial || '—',
            address: deviceMap[entry.device_id]?.address || '—',
            delta_in1: entry.delta_in1 ?? null,
          }));

        allMessages.push(...sorted);
      } catch (err) {
        console.log(`Ошибка получения данных по устройству ${device_id}:`, err.message);
      }
    }

    let grouped = {};
    for (const msg of allMessages) {
      if (!grouped[msg.device_id]) {
        grouped[msg.device_id] = {
          name: msg.name,
          serial: msg.serial,
          address: msg.address,
          messages: [],
          totalUsage: 0,
        };
      }
      grouped[msg.device_id].messages.push(msg);
      if (typeof msg.delta_in1 === 'number' && msg.delta_in1 > 0) {
        grouped[msg.device_id].totalUsage += msg.delta_in1;
      }
    }

    const TARIFF = 120;
    Object.values(grouped).forEach((group) => {
      group.totalCost = group.totalUsage * TARIFF;
    });

    setMessages(Object.values(grouped));
    setLoading(false);
  };

  const exportToExcel = async () => {
    if (!messages.length) return;

    const rows = [];
    messages.forEach((group) => {
      rows.push({
        'Серийный номер': group.serial,
        'Адрес': group.address,
      });
      group.messages.forEach((msg) => {
        rows.push({
          Показания: msg.in1,
          'delta_in1': msg.delta_in1,
          'Дата и время': msg.datetime_at_hour,
        });
      });
      rows.push({ 'Суммарный расход': group.totalUsage, 'Стоимость (₸)': group.totalCost });
      rows.push({});
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Messages');

    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });
    const path = `${RNFS.DownloadDirectoryPath}/metering_data_grouped.xlsx`;
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
        <ActivityIndicator size="large" />
      ) : (
        <>
          <FlatList
            data={messages}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontWeight: 'bold' }}>Серийный номер: {item.serial}</Text>
                <Text style={{ fontStyle: 'italic' }}>Адрес: {item.address}</Text>
                {item.messages.map((msg, idx) => (
                  <Text
                    key={idx}
                    style={{ color: msg.delta_in1 > highlightThreshold ? 'red' : 'black' }}
                  >
                    [{msg.in1}] [{msg.delta_in1 ?? '—'}] [{msg.datetime_at_hour}]
                  </Text>
                ))}
                <Text>Суммарный расход: {item.totalUsage.toFixed(2)}</Text>
                <Text>Стоимость: {item.totalCost.toFixed(2)} ₸</Text>
              </View>
            )}
          />
          <Button title="Выгрузить в Excel" onPress={exportToExcel} />
        </>
      )}
    </View>
  );
}

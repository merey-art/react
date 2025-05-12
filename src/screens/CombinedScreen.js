import React, { useState, useContext, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, ScrollView, FlatList, Button, Platform, TextInput, Modal } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import moment from 'moment';
import { BarChart } from 'react-native-chart-kit';
import { AnalyticsContext } from '../context/AnalyticsContext';

const screenWidth = Dimensions.get('window').width;
const BASE_URL = 'https://metering.beeline.kz:4443';
const DEVICE_MESSAGES_ENDPOINT = '/api/device/messages';

export default function CombinedScreen() {
  const [activeTab, setActiveTab] = useState('graph');
  return (
      <View style={styles.container}>
        <View style={styles.tabBar}>
          <TouchableOpacity style={[styles.tab, activeTab === 'graph' && styles.activeTab]} onPress={() => setActiveTab('graph')}>
            <Text style={[styles.tabText, activeTab === 'graph' && styles.activeText]}>Графики</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'data' && styles.activeTab]} onPress={() => setActiveTab('data')}>
            <Text style={[styles.tabText, activeTab === 'data' && styles.activeText]}>Данные</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'graph' ? <GraphTab /> : <DataTab />}
      </View>
  );
}

/* ------------------------- ДАННЫЕ ------------------------- */
function DataTab() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [highlightThreshold, setHighlightThreshold] = useState(1);
  const { setAnalyticsData } = useContext(AnalyticsContext);

  const toUnix = (d) => Math.floor(d.getTime() / 1000);
  const getToken = async () => AsyncStorage.getItem('token');

  const getMessages = async () => {
    setLoading(true);
    const token = await getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      msgType: 1,
      msgGroup: 0,
      startDate: toUnix(startDate),
      stopDate: toUnix(endDate),
      paginate: true,
      per_page: 200,
      profile_type: 0,
      with_transformation_ratio: true,
      with_loss_factor: true,
    };

    try {
      const res = await axios.post(BASE_URL + DEVICE_MESSAGES_ENDPOINT, payload, { headers });
      const raw = res.data?.data?.messages?.data || [];
      const sorted = raw.sort((a, b) => (a.datetime || 0) - (b.datetime || 0));

      // сгруппировано по счётчику
      const grouped = {};
      sorted.forEach((m) => {
        const key = m.meter_number?.toString() || '—';
        if (!grouped[key]) grouped[key] = { meter_number: key, messages: [], totalUsage: 0 };
        grouped[key].messages.push(m);
        if (typeof m.delta_in1 === 'number' && m.delta_in1 > 0) grouped[key].totalUsage += m.delta_in1;
      });
      const TARIFF = 120; // ₸ за м³
      Object.values(grouped).forEach((g) => (g.totalCost = g.totalUsage * TARIFF));

      setMessages(Object.values(grouped));
      setAnalyticsData(sorted); // для графика
    } catch (err) {
      console.log(err.message);
    }
    setLoading(false);
  };

  return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ padding: 12 }}>
        <Button title="Начальная дата" onPress={() => setShowStart(true)} />
        {showStart && <DateTimePicker value={startDate} mode="date" onChange={(e, d) => { setShowStart(false); if (d) setStartDate(d); }} />}

        <Button title="Конечная дата" onPress={() => setShowEnd(true)} />
        {showEnd && <DateTimePicker value={endDate} mode="date" onChange={(e, d) => { setShowEnd(false); if (d) setEndDate(d); }} />}

        <TextInput style={styles.input} keyboardType="numeric" placeholder="Порог delta_in1" value={highlightThreshold.toString()} onChangeText={(t) => setHighlightThreshold(parseFloat(t) || 0)} />

        <Button title="Получить данные" onPress={getMessages} />

        {loading ? (
            <SkeletonPlaceholder>
              <SkeletonPlaceholder.Item marginTop={20}>{Array.from({ length: 4 }).map((_, i) => (<SkeletonPlaceholder.Item key={i} width="85%" height={20} borderRadius={4} marginBottom={12} />))}</SkeletonPlaceholder.Item>
            </SkeletonPlaceholder>
        ) : (
            <FlatList
                data={messages}
                keyExtractor={(it) => it.meter_number}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                      <Text style={styles.bold}>Счётчик: {item.meter_number}</Text>
                      {item.messages.map((m, idx) => {
                        const date = m.datetime ? moment.unix(m.datetime).format('DD.MM HH:mm') : '—';
                        const delta = m.delta_in1 ?? (idx > 0 ? (m.in1 - item.messages[idx - 1].in1).toFixed(2) : '—');
                        return (
                            <Text key={idx} style={{ color: delta > highlightThreshold ? 'red' : '#000' }}>
                              {date} | in1: {m.in1} | Δ: {delta}
                            </Text>
                        );
                      })}
                      <Text>Сумма: {item.totalUsage.toFixed(2)} м³ | {item.totalCost.toFixed(0)} ₸</Text>
                    </View>
                )}
            />
        )}
      </ScrollView>
  );
}

/* ------------------------ ГРАФИКИ ------------------------- */
function GraphTab() {
  const { analyticsData } = useContext(AnalyticsContext);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickingStart, setPickingStart] = useState(true);

  // агрегируем по дате
  const aggregated = useMemo(() => {
    const grouped = {};
    analyticsData.forEach((m) => {
      if (typeof m.datetime !== 'number' || typeof m.in1 !== 'number') return;
      const d = moment.unix(m.datetime);
      if (d.isBefore(moment(startDate).startOf('day')) || d.isAfter(moment(endDate).endOf('day'))) return;
      const key = d.format('YYYY-MM-DD');
      grouped[key] = (grouped[key] || 0) + m.in1;
    });
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }, [analyticsData, startDate, endDate]);

  const average = useMemo(() => aggregated.reduce((s, i) => s + i.value, 0) / Math.max(aggregated.length, 1), [aggregated]);
  const total = useMemo(() => aggregated.reduce((s, i) => s + i.value, 0), [aggregated]);

  const labels = aggregated.map((i) => moment(i.date).format('DD.MM'));
  const values = aggregated.map((i) => i.value);

  const chartConfig = {
    backgroundColor: '#fff',
    backgroundGradientFrom: '#fff',
    backgroundGradientTo: '#fff',
    decimalPlaces: 1,
    color: (o = 1) => `rgba(0,123,131,${o})`,
    labelColor: (o = 1) => `rgba(0,0,0,${o})`,
    barPercentage: 0.6,
  };

  const onDateChange = (e, d) => {
    if (!d) { setShowPicker(false); return; }
    if (pickingStart) {
      setStartDate(d);
      setPickingStart(false);
    } else {
      if (d < startDate) alert('Конец раньше начала');
      else setEndDate(d);
      setShowPicker(false);
    }
  };

  return (
      <ScrollView style={styles.tabContent} contentContainerStyle={{ padding: 16 }}>
        <Text style={styles.title}>Потребление (in1)</Text>
        <Text style={styles.period}>{moment(startDate).format('DD.MM.YYYY')} — {moment(endDate).format('DD.MM.YYYY')}</Text>
        <Text style={styles.total}>Итого: {total.toFixed(1)} м³ | Среднее: {average.toFixed(1)} м³/день</Text>

        <Button title="Выбрать период" onPress={() => { setPickingStart(true); setShowPicker(true); }} />

        {/* date modal */}
        {showPicker && (
            <Modal transparent animationType="slide" visible={showPicker}>
              <View style={styles.modalBg}>
                <Text style={styles.modalText}>{pickingStart ? 'Начало' : 'Конец'}</Text>
                <DateTimePicker value={pickingStart ? startDate : endDate} mode="date" onChange={onDateChange} />
                {!pickingStart && <Button title="OK" onPress={() => setShowPicker(false)} />}
              </View>
            </Modal>
        )}

        {aggregated.length ? (
            <BarChart
                data={{ labels, datasets: [{ data: values }] }}
                width={screenWidth - 32}
                height={220}
                chartConfig={chartConfig}
                style={{ marginVertical: 16, borderRadius: 8 }}
                fromZero
            />
        ) : (
            <Text style={{ textAlign: 'center', marginTop: 40, color: '#777' }}>Нет данных за выбранный период</Text>
        )}
      </ScrollView>
  );
}

/* ------------------------- СТИЛИ -------------------------- */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f9f9f9'},
  tabBar: {flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd'},
  tab: {flex: 1, paddingVertical: 12, alignItems: 'center'},
  tabText: {fontSize: 16, color: '#777'},
  activeTab: {borderBottomWidth: 3, borderColor: '#007b83'},
  activeText: {color: '#007b83', fontWeight: 'bold'},
  tabContent: {flex: 1},
  input: {borderWidth: 1, borderColor: '#ccc', marginVertical: 10, padding: 6, borderRadius: 6},
  card: {marginTop: 20},
  bold: {fontWeight: 'bold'},
  title: {fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 6},
  period: {textAlign: 'center', color: '#555', marginBottom: 6},
  total: {textAlign: 'center', fontWeight: '600', marginBottom: 12},
  modalBg: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // полупрозрачный тёмный фон
    padding: 20,
  },
  modalText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 18,
    marginBottom: 10,
  },
});

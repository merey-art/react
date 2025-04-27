import React, { useContext, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Button, Modal, Alert, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { VictoryBar, VictoryChart, VictoryTheme, VictoryAxis, VictoryLabel, VictoryLine } from 'victory-native';
import { AnalyticsContext } from '../context/AnalyticsContext';
import moment from 'moment';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const { analyticsData } = useContext(AnalyticsContext);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickingStart, setPickingStart] = useState(true);
  const [selectedDatum, setSelectedDatum] = useState(null);

  const aggregatedData = useMemo(() => {
    const grouped = {};
    analyticsData.forEach((msg) => {
      if (!msg.datetime_at_hour || typeof msg.in1 !== 'number') return;
      const msgDate = moment(msg.datetime_at_hour);
      if (msgDate.isBefore(startDate) || msgDate.isAfter(endDate)) return;
      const date = msgDate.format('YYYY-MM-DD');
      grouped[date] = (grouped[date] || 0) + msg.in1;
    });
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }, [analyticsData, startDate, endDate]);

  const average = useMemo(() => {
    if (aggregatedData.length === 0) return 0;
    const total = aggregatedData.reduce((sum, item) => sum + item.value, 0);
    return total / aggregatedData.length;
  }, [aggregatedData]);

  const totalUsage = useMemo(() => {
    return aggregatedData.reduce((sum, item) => sum + item.value, 0);
  }, [aggregatedData]);

  const onDateChange = (event, selectedDate) => {
    if (!selectedDate) {
      setShowPicker(false);
      return;
    }
    if (pickingStart) {
      setStartDate(selectedDate);
      setPickingStart(false);
    } else {
      if (selectedDate < startDate) {
        Alert.alert('Ошибка', 'Конечная дата не может быть раньше начальной.');
        setEndDate(startDate);
      } else {
        setEndDate(selectedDate);
      }
      setShowPicker(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Потребление (in1) за период</Text>
      <Text style={styles.period}>{`${moment(startDate).format('DD.MM.YYYY')} — ${moment(endDate).format('DD.MM.YYYY')}`}</Text>
      <Text style={styles.totalUsage}>Итого: {totalUsage.toFixed(1)} м³</Text>
      <View style={styles.datePickerContainer}>
        <Button title="Выбрать период" onPress={() => { setPickingStart(true); setShowPicker(true); }} />
      </View>
      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalText}>{pickingStart ? 'Выберите начальную дату' : 'Выберите конечную дату'}</Text>
          <DateTimePicker
            value={pickingStart ? startDate : endDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        </View>
      </Modal>
      <VictoryChart
        theme={VictoryTheme.material}
        domainPadding={{ x: 30 }}
        animate={{ duration: 1000, easing: 'bounce' }}
        width={screenWidth - 16}
      >
        <VictoryAxis
          tickFormat={(t) => moment(t).format('DD.MM')}
          style={{ tickLabels: { angle: -30, fontSize: 10, padding: 15 } }}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t) => `${t} м³`}
          style={{ tickLabels: { fontSize: 10, padding: 5 } }}
        />
        <VictoryLine
          y={() => average}
          style={{ data: { stroke: '#FF0000', strokeWidth: 2, strokeDasharray: '5,5' } }}
        />
        <VictoryBar
          data={aggregatedData}
          x="date"
          y="value"
          labels={({ datum }) => `${datum.value.toFixed(1)} м³`}
          labelComponent={<VictoryLabel dy={-10} style={{ fontSize: 10 }} />}
          style={{
            data: {
              fill: ({ datum }) => datum.value > 10 ? '#4c9aff' : '#a0c4ff',
              width: 20,
              cornerRadius: { top: 6, bottom: 0 }
            }
          }}
          events={[{
            target: "data",
            eventHandlers: {
              onPressIn: (evt, clickedProps) => {
                setSelectedDatum(clickedProps.datum);
              }
            }
          }]}
        />
      </VictoryChart>
      {selectedDatum && (
        <View style={styles.selectedInfo}>
          <Text>Дата: {moment(selectedDatum.date).format('DD.MM.YYYY')}</Text>
          <Text>Потребление: {selectedDatum.value.toFixed(1)} м³</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  period: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 8,
  },
  totalUsage: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#fff',
  },
  selectedInfo: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#e6f0ff',
    padding: 10,
    borderRadius: 8,
  },
});

export default AnalyticsScreen;

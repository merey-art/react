import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import moment from 'moment';
import { AnalyticsContext } from '../context/AnalyticsContext';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
  const { analyticsData } = useContext(AnalyticsContext);

  const aggregatedData = useMemo(() => {
    const grouped = {};
    analyticsData.forEach((msg) => {
      if (!msg.datetime_at_hour || typeof msg.delta_in1 !== 'number') return;
      const month = moment(msg.datetime_at_hour).format('MMM');
      grouped[month] = (grouped[month] || 0) + msg.delta_in1;
    });
    return Object.entries(grouped).map(([date, value]) => ({ date, value }));
  }, [analyticsData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Потребление по месяцам</Text>
      <BarChart
        data={{
          labels: aggregatedData.map(item => item.date),
          datasets: [{ data: aggregatedData.map(item => item.value) }]
        }}
        width={screenWidth - 32}
        height={220}
        yAxisSuffix=" м³"
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        verticalLabelRotation={30}
        style={styles.chart}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  chart: {
    borderRadius: 8
  }
});

export default AnalyticsScreen;

// 🔹 FILE: src/screens/SplashScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import Logo from '../assets/logo.svg'; // Обновлённый путь к SVG логотипу (ты заменишь сам)

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true })
    ]).start(() => {
      onFinish();
    });
  }, [fadeAnim, onFinish]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Logo width={260} height={120} />
        <ActivityIndicator size="large" color="#003366" style={{ marginTop: 24 }} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f6f8',
  },
});

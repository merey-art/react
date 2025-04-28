// 🔹 FILE: src/screens/SplashScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Animated } from 'react-native';

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
        <Image
          source={require('../../assets/logo.png')} // Путь к твоему логотипу
          style={styles.logo}
          resizeMode="contain"
        />
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
  logo: {
    width: 260,
    height: 120,
  },
});

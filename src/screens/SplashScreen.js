import React, { useEffect } from 'react';
import { ImageBackground, StyleSheet } from 'react-native';

// 📌 Замените путь, если ваш PNG‑файл лежит в другой папке
import splashImage from '../assets/splash.png';

export default function SplashScreen({ onFinish }) {
  // Переходим дальше через 2 с. При необходимости измените таймер
  useEffect(() => {
    const timer = setTimeout(onFinish, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
      <ImageBackground
          source={splashImage}
          style={styles.container}
          resizeMode="cover" // «contain» — если нужно сохранить пропорции без обрезки
      />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

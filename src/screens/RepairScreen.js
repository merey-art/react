// 🔹 FILE: src/screens/RepairScreen.js — берёт список счётчиков так же, как CombinedScreen
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    StyleSheet,
    Alert,
    Linking,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const BASE_URL = 'https://metering.beeline.kz:4443';
const DEVICE_MESSAGES_ENDPOINT = '/api/device/messages'; // тот же, что в CombinedScreen

export default function RepairScreen() {
    const [meters, setMeters] = useState([]);
    const [selected, setSelected] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    /* ---------------- Получаем список счётчиков ---------------- */
    useEffect(() => {
        const fetchMeters = async () => {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) { setLoading(false); return; }
            try {
                const headers = { Authorization: `Bearer ${token}` };
                const payload = {
                    msgType: 1,
                    msgGroup: 0,
                    paginate: false,
                    per_page: 200,
                    profile_type: 0,
                    with_transformation_ratio: false,
                    with_loss_factor: false,
                };
                const res = await axios.post(BASE_URL + DEVICE_MESSAGES_ENDPOINT, payload, { headers });
                const messages = res.data?.data?.messages?.data || [];
                const unique = [...new Set(messages.map((m) => m.meter_number?.toString()).filter(Boolean))];
                setMeters(unique);
                if (unique.length) setSelected(unique[0]);
            } catch (e) {
                console.log(e.message);
                Alert.alert('Ошибка', 'Не удалось получить список счётчиков');
            }
            setLoading(false);
        };
        fetchMeters();
    }, []);

    /* ---------------- Отправляем письмо ---------------- */
    const handleSend = async () => {
        if (!selected) { Alert.alert('Выберите счётчик'); return; }
        const userEmail = await AsyncStorage.getItem('email');
        const to = 'digitalenergygroupkz@gmail.com';
        const subject = `Repair request — meter ${selected}`;
        const body = `Meter: ${selected}\nUser comment: ${comment || '-'}\n\nSent from ${userEmail || 'unknown user'}`;
        const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const can = await Linking.canOpenURL(url);
        if (can) Linking.openURL(url);
        else Alert.alert('Не удалось открыть почтовый клиент');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Выберите счётчик</Text>
            <View style={styles.pickerWrapper}>
                <Picker selectedValue={selected} onValueChange={setSelected} enabled={!loading && meters.length}>
                    {meters.map((m) => <Picker.Item label={m} value={m} key={m} />)}
                </Picker>
            </View>

            <Text style={styles.label}>Комментарий</Text>
            <TextInput
                style={styles.input}
                placeholder="Описание проблемы"
                value={comment}
                onChangeText={setComment}
                multiline
            />

            <Button title="Отправить заявку" onPress={handleSend} disabled={loading || !meters.length} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#f9f9f9' },
    label: { marginBottom: 6, fontWeight: '600' },
    pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 16 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, height: 100, marginBottom: 20 },
});

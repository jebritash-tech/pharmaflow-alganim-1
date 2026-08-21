import '../../css/app.css';

import * as Vue from 'vue';

import axios from 'axios';

import '../config.js';

import {API_BASE} from '../config.js';

import '../pwa.js';


const { createApp, ref } = Vue;
createApp({
    setup() {
        const form = ref({ password: '', password_confirmation: '' });
        const loading = ref(false);
        
        const submitReset = async () => {
            loading.value = true;
            // Get token and email from URL (e.g., reset-password.html?token=xyz&email=a@b.com)
            const params = new URLSearchParams(window.location.search);
            const payload = {
                ...form.value,
                email: params.get('email'),
                token: params.get('token')
            };

            try {
                await axios.post(`${API_BASE}/reset-password`, payload);
                alert('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
                window.location.href = 'login.html';
            } catch (e) {
                alert(e.response?.data.message || 'خطأ: الرابط غير صالح أو انتهت صلاحيته');
            } finally {
                loading.value = false;
            }
        };

        return { form, submitReset, loading };
    }
}).mount('#app');

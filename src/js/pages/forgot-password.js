import '../../css/app.css';

import * as Vue from 'vue';

import axios from 'axios';


import {
    API_BASE
} from '../config.js';

import '../offline-db.js';

import '../pwa.js';


const { createApp, ref } = Vue;
createApp({
    setup() {
        const form = ref({ password: '', password_confirmation: '' });
        
        const submitReset = async () => {
            const params = new URLSearchParams(window.location.search);
            const payload = {
                ...form.value,
                email: params.get('email'),
                token: params.get('token')
            };

            try {
                await axios.post(`${API_BASE}/reset-password`, payload);
                alert('تم تغيير كلمة المرور بنجاح');
                window.location.href = '/login.html';
            } catch (e) { alert('خطأ: الرابط غير صالح أو انتهت صلاحيته'); }
        };

        return { form, submitReset };
    }
}).mount('#app');

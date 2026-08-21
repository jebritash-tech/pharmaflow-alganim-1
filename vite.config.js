import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
    base: '/pharmaflow-frontend-2.0.0-stable-altelal/',
    //base: '/',

    resolve: {
        alias: {
            vue: 'vue/dist/vue.esm-bundler.js'
        }
    },

    plugins: [
        tailwindcss()
    ],

    build: {
        rollupOptions: {
            input: {
                index: resolve(__dirname, 'index.html'),
                login: resolve(__dirname, 'login.html'),
                admin: resolve(__dirname, 'admin.html'),
                pos: resolve(__dirname, 'pos.html'),
                shift: resolve(__dirname, 'shift.html'),
                analytics: resolve(__dirname, 'analytics.html'),
                
                inventory: resolve(__dirname, 'inventory.html'),
                install: resolve(__dirname, 'install.html'),
                'forgot-password':
                    resolve(__dirname, 'forgot-password.html'),
                'reset-password':
                    resolve(__dirname, 'reset-password.html')
            }
        }
    }
});
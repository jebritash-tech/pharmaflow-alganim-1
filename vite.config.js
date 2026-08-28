import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';
import vue from '@vitejs/plugin-vue'
export default defineConfig({
    base: '/pharmaflow-alganim-1/',
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

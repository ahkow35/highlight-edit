import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Local backend URL (use localhost for stability on laptop)
const LOCAL_BACKEND_URL = 'http://localhost:8000';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true, // Expose on all network interfaces (0.0.0.0)
        allowedHosts: ['irremissible-triparted-nieves.ngrok-free.dev', '.ngrok-free.dev'],
        proxy: {
            '/api': {
                target: LOCAL_BACKEND_URL,
                changeOrigin: true,
            },
        },
    },
});


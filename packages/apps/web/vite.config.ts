import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        basicSsl()
    ],
    server: {
        port: 5177,
        strictPort: true,
        proxy: {
            '/status': {
                target: 'http://localhost:3004',
                changeOrigin: true,
                ws: true
            }
        }
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    }
});

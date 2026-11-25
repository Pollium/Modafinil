import { readableConfig } from '@pollium/readable-react/app/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default readableConfig({
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
    }
}, { api: 'http://localhost:3004' });

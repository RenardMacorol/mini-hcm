import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		host: '0.0.0.0',
		port: 5173, // Matches your docker-compose exposed frontend port
		watch: {
			usePolling: true, // Necessary for hot-reloading across Docker volumes on Arch
		},
		proxy: {
			// Catch all requests starting with /api and redirect them to the backend container
			'/api': {
				target: 'http://backend:5000', // <-- Replace 'backend' with your actual compose service name if different
				changeOrigin: true,
				secure: false,
			}
		}
	},
});

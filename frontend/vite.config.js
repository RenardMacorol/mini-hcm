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
	},
});

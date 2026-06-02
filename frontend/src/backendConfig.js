// frontend/src/backendConfig.js

// Vite injects environment variables here at compile time.
// If VITE_API_URL isn't set (like during local npm run dev), it falls back to localhost.
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default BACKEND_URL;

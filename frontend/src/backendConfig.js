// frontend/src/backendConfig.js

// Check if the user's browser window is currently on localhost.
// If it is NOT localhost, we are live on Firebase, so use the Vercel URL!
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const BACKEND_URL = isLocalhost ? '' : 'https://mini-hcm-alpha.vercel.app';

export default BACKEND_URL;

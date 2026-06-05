// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
console.log("API KEY =", import.meta.env.VITE_FIREBASE_API_KEY);
console.log("PROJECT =", import.meta.env.VITE_FIREBASE_PROJECT_ID);
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);


if (import.meta.env.VITE_USE_EMULATOR === "true") {
	connectAuthEmulator(auth, "http://127.0.0.1:9099");
	connectFirestoreEmulator(db, "127.0.0.1", 8081);
	console.log("MODE:", import.meta.env.MODE);
	console.log("BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);
	console.log("USE_EMULATOR:", import.meta.env.VITE_USE_EMULATOR);
	console.log("You are using emulator")
}

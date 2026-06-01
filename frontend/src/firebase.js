import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "demo-key-placeholder",
	authDomain: "demo-mini-hcm.firebaseapp.com",
	projectId: "demo-mini-hcm", // Matches your offline local demo ID
	storageBucket: "demo-mini-hcm.appspot.com",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Connect to the local Firestore emulator automatically during development
if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
	// 8080 is the default port defined in your emulator setup
	connectFirestoreEmulator(db, "localhost", 8081);
	console.log("Connected to local Firestore Emulator");
}

export { db };

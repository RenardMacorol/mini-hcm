// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "AIzaSyAaudw4tO7vPbz1sxqeEXlFknvLSXeyr5E",
	authDomain: "mini-hcm-b2108.firebaseapp.com",
	projectId: "mini-hcm-b2108",
	storageBucket: "mini-hcm-b2108.firebasestorage.app",
	messagingSenderId: "1084865706736",
	appId: "1:1084865706736:web:6e9e0b6e6e170af0886035",
	measurementId: "G-VXXYTKYE2R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

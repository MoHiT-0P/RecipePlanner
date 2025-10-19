// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgoQIe0DV6xNP34PKgcsfuU2CANvq9fGI",
  authDomain: "recipeplanner-9b476.firebaseapp.com",
  projectId: "recipeplanner-9b476",
  storageBucket: "recipeplanner-9b476.firebasestorage.app",
  messagingSenderId: "408510480947",
  appId: "1:408510480947:web:f0b757898ca567a5729946"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
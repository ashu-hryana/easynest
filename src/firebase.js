// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Firebase Storage ko import karna na bhulein, aage kaam aayega
import { getStorage } from "firebase/storage";

// --- Yahan aapki actual Firebase keys daal di gayi hain ---
const firebaseConfig = {
  apiKey: "AIzaSyCsJnfvZ8EKRem02BMWheaMVIAMYKbVbhM",
  authDomain: "easynest-final-project.firebaseapp.com",
  projectId: "easynest-final-project",
  storageBucket: "easynest-final-project.firebasestorage.app",
  messagingSenderId: "618535901461",
  appId: "1:618535901461:web:3bb9cbe81be1c7a7d6f11c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services ko export karo taaki poori app mein use kar sakein
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Storage ko bhi export kar do

export default app;

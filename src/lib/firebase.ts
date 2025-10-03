// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export const firebaseConfig = {
  "projectId": "new-prototype-obnzi",
  "appId": "1:146156794753:web:f9e2ca29ddb3780d706e80",
  "storageBucket": "new-prototype-obnzi.appspot.com",
  "apiKey": "AIzaSyCJS0c7vcbDBJkguBkoN0PDsZU806YxNlE",
  "authDomain": "new-prototype-obnzi.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "146156794753"
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage, firebaseConfig };

import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyAKJL89VfsEWh6jGBIEeouvBi2KyEZDDpI",
  authDomain: "pingmatch-a6325.firebaseapp.com",
  projectId: "pingmatch-a6325",
  storageBucket: "pingmatch-a6325.firebasestorage.app",
  messagingSenderId: "168697643376",
  appId: "1:168697643376:web:b5fd5f8278c87ecc7acfb5"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Same Firebase project as the Flutter app: kanban-finance-system
const firebaseConfig = {
  apiKey: "AIzaSyAuIJMb8A-bRmpr-sQI-J4ctWnUZJHd9j4",
  authDomain: "kanban-finance-system.firebaseapp.com",
  projectId: "kanban-finance-system",
  storageBucket: "kanban-finance-system.firebasestorage.app",
  messagingSenderId: "928147052600",
  appId: "1:928147052600:web:53eb162a1281913fb26ecd",
  measurementId: "G-C9X8GT5FYV",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);

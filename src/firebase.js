// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  where
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyACuVKmVc7xS4K5TVljAeQTq7WNP_UC8n0",
  authDomain: "a2vissionweb.firebaseapp.com",
  projectId: "a2vissionweb",
  storageBucket: "a2vissionweb.appspot.com",
  messagingSenderId: "127311201904",
  appId: "1:127311201904:web:1b3bc95feb069bdc7d56b5",
  measurementId: "G-25MGLNYKEL"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

// re-export helpers que usarás
export {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  where
};

import { initializeApp } from "firebase/app";
import { getFirestore, setDoc, doc } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { firebaseConfig } from "./config.js";

export const appPath = initializeApp(firebaseConfig);
export const auth = getAuth(appPath);
export const dataBase = getFirestore(appPath);

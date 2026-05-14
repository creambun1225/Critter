import {
  initializeApp
} from "firebase/app";

import {
  getAuth
} from "firebase/auth";

import {
  getFirestore
} from "firebase/firestore";

import {
  getStorage
} from "firebase/storage";

const firebaseConfig = {

  apiKey:
    "AIzaS_WmY",

  authDomain:
    "critter-3c31b.firebaseapp.com",

  projectId:
    "critter-3c31b",

  storageBucket:
    "critter-3c31b.appspot.com",

  messagingSenderId:
    "154125669854",

  appId:
    "1:154125669854:web:9b411bb1e77f151d8a794"

};

const app=
initializeApp(
firebaseConfig
);

export const auth=
getAuth(app);

export const db=
getFirestore(app);

export const storage=
getStorage(app);
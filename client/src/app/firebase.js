import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA04W4B_5T5sm1yTFW27zS0lFktaSzFXjg",
  authDomain: "verifiedtutorn.firebaseapp.com",
  projectId: "verifiedtutorn",
  storageBucket: "verifiedtutorn.firebasestorage.app",
  messagingSenderId: "593297359815",
  appId: "1:593297359815:web:6a7120230b60bb08e24fe2",
  measurementId: "G-PFBK2K36DH"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { app, auth, googleProvider };

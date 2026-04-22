import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDMoaIf2RQK7TDhkmIVl935dfKGKD6KaPE",
  authDomain: "communityride-app.firebaseapp.com",
  projectId: "communityride-app",
  storageBucket: "communityride-app.firebasestorage.app",
  messagingSenderId: "1054293628882",
  appId: "1:1054293628882:web:f63a2711d866f3deabda0b",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const messaging = getMessaging(app);

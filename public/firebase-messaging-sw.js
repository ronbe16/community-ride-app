importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

// Populated at build time via environment variables — replace before deploying.
firebase.initializeApp({
  apiKey: self.__FIREBASE_API_KEY__ || 'placeholder',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || 'placeholder.firebaseapp.com',
  projectId: self.__FIREBASE_PROJECT_ID__ || 'placeholder',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || 'placeholder.appspot.com',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '000000000000',
  appId: self.__FIREBASE_APP_ID__ || '1:000000000000:web:placeholder',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? 'Community Ride';
  const body = payload.notification?.body ?? '';
  self.registration.showNotification(title, {
    body,
    icon: '/icons/icon-192.png',
  });
});

// config.js
window.firebaseConfig = {
  apiKey: "AIzaSyA2_d_t4uh7SeQnNce5SElVIV2sSIwpBXo",
  authDomain: "jarvis-pos.firebaseapp.com",
  databaseURL: "https://jarvis-pos-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jarvis-pos",
  storageBucket: "jarvis-pos.firebasestorage.app",
  messagingSenderId: "271975250806",
  appId: "1:271975250806:web:46a42199c6c0ee4843d857"
};

firebase.initializeApp(window.firebaseConfig);
const db = firebase.database();

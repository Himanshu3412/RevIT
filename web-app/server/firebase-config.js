const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDe3xYFLAq1_ynAJj16aRqW5ATyLI2ul0c",
    authDomain: "recruitai-89bec.firebaseapp.com",
    projectId: "recruitai-89bec",
    storageBucket: "recruitai-89bec.firebasestorage.app",
    messagingSenderId: "1049430619816",
    appId: "1:1049430619816:web:06ede9826a90681b47749d",
    measurementId: "G-YM15FRGGKH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

module.exports = { app, auth, db }; 
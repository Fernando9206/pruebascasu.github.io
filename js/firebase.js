import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCpdBpc6jH-iOUeRD4QRdkaqUSjmgIbmGU",
    authDomain: "casuarinasnaks-menu.firebaseapp.com",
    projectId: "casuarinasnaks-menu",
    storageBucket: "casuarinasnaks-menu.firebasestorage.app",
    messagingSenderId: "113253329955",
    appId: "1:113253329955:web:236baea1897109c6f85596",
    measurementId: "G-DHNTLG0J0E"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
// Images are uploaded to Cloudinary — no Firebase Storage needed

const firebaseConfig = {
    apiKey: "AIzaSyDaAIxk9_0l3OrGHT-eHWxBS91Lh58-7Eg",
    authDomain: "fix-ia-493117.firebaseapp.com",
    projectId: "fix-ia-493117",
    storageBucket: "fix-ia-493117.firebasestorage.app",
    messagingSenderId: "473011695031",
    appId: "1:473011695031:web:62b3e6b94d84c16af70c32",
    measurementId: "G-RRCZDXHQPV"
};

if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
}
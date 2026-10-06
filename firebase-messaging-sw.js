importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// ⚠️ index.html의 FIREBASE_CONFIG와 반드시 동일한 값으로 교체하세요.
firebase.initializeApp({
  apiKey: "AIzaSyBars-AalN-eZKCjGIOgOqkQ9oCHyDSLqU",
  authDomain: "grade-7class.firebaseapp.com",
  projectId: "grade-7class",
  storageBucket: "grade-7class.firebasestorage.app",
  messagingSenderId: "304110691750",
  appId: "1:304110691750:web:7b7ce68828f538802adb67"
});

const messaging = firebase.messaging();

// 알림(notification)이 담긴 메시지는 Firebase가 알아서 알림창에 띄워줌.
// 여기서 또 띄우면 같은 알림이 2개씩 뜨므로, 데이터만 온 경우에만 직접 띄움.
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const d = payload.data || {};
  if (!d.title) return;
  self.registration.showNotification(d.title, { body: d.body || "", icon: "icons/icon-192.png", tag: d.tag || undefined });
});

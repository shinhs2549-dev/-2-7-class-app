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

// 앱을 켜 둔 상태에서 앱이 직접 띄운 대화 알림을 누르면 앱의 대화 탭으로
self.addEventListener("notificationclick", (event) => {
  const url = event.notification.data && event.notification.data.chatUrl;
  if (!url) return; // Firebase가 띄운 알림은 Firebase가 처리
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    const c = list.find((w) => w.url.split("#")[0] === url.split("#")[0]);
    if (c) { c.postMessage({ openChat: true }); return c.focus(); }
    return clients.openWindow(url);
  }));
});

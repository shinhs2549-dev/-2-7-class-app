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

// 앱을 닫아둔 상태에서 알림이 오면 이 코드가 실행되어 휴대폰 알림창에 띄워줍니다.
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/icon-192.png" // 원하는 앱 아이콘 이미지가 있으면 같은 경로에 넣어주세요 (없어도 동작함)
  });
});

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then(reg => {
        console.log('Service worker registered.', reg);
      })
      .catch(err => {
        console.error('Service worker registration failed:', err);
      });
  });
}

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { apiRequest } from './queryClient';
import { toast } from "@/hooks/use-toast";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// Replace with your actual Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyDpeyZ7iALM7U9rjmDPz1naQWpM3BYQt9I",
    authDomain: "sample-firebase-ai-app-7b972.firebaseapp.com",
    projectId: "sample-firebase-ai-app-7b972",
    storageBucket: "sample-firebase-ai-app-7b972.firebasestorage.app",
    messagingSenderId: "447935246204",
    appId: "1:447935246204:web:750984f3a54dbdde7ffef9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Add this new utility function
export const getCurrentToken = async (): Promise<string | null> => {
  try {
    return await getToken(messaging, { 
      vapidKey: 'BG4ac5d2RuLdlFcobT_Fmjj4wqbUvo7Jp6Iq2L-V8ncspeaXH4cQuNXm4RaB6B96nh1FrLyVtpHa_bKSDI1TlrE'
    });
  } catch (error) {
    console.error('Error getting current token:', error);
    return null;
  }
};

// Add these utility functions for FCM token storage
const FCM_TOKEN_KEY = 'fcm_token';

export const getFcmTokenFromStorage = (): string | null => {
  return localStorage.getItem(FCM_TOKEN_KEY);
};

export const setFcmTokenInStorage = (token: string): void => {
  localStorage.setItem(FCM_TOKEN_KEY, token);
};

export const removeFcmTokenFromStorage = (): void => {
  localStorage.removeItem(FCM_TOKEN_KEY);
};

// Function to request notification permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    // Request permission
    const permission = await Notification.requestPermission();
    
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }
    
    console.log('Notification permission granted');
    
    // Get FCM token
    const token = await getCurrentToken();
    
    if (token) {
      await registerTokenWithServer(token);
      return token;
    } else {
      console.log('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

// Function to register the FCM token with your server
export const registerTokenWithServer = async (token: string): Promise<void> => {
  try {
    await apiRequest('POST', '/api/fcm-tokens', { token });
    setFcmTokenInStorage(token);
    console.log('Token registered with server successfully');
  } catch (error) {
    console.error('Error registering token with server:', error);
    toast({
      title: "Error",
      description: "Failed to register notifications",
      variant: "destructive",
    });
  }
};

// Function to handle incoming messages when the app is in the foreground
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

// Function to delete FCM token from Firebase and backend
export const deleteFcmToken = async (): Promise<void> => {
  try {
    const storedToken = getFcmTokenFromStorage();
    if (storedToken) {
      await deleteToken(messaging);
      await apiRequest('DELETE', `/api/fcm-tokens/${storedToken}`);
      removeFcmTokenFromStorage();
      console.log('FCM token deleted successfully from both Firebase and backend');
    }
  } catch (error) {
    console.error('Error deleting FCM token:', error);
    toast({
      title: "Error",
      description: "Failed to disable notifications",
      variant: "destructive",
    });
  }
};

export { messaging };

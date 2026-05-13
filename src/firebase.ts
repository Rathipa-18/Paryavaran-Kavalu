import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export let isDbConnected = true;
type ConnectionListener = (connected: boolean) => void;
const listeners: ConnectionListener[] = [];

export const onConnectionChange = (listener: ConnectionListener) => {
  listeners.push(listener);
  listener(isDbConnected);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
};

function notifyListeners() {
  listeners.forEach(l => l(isDbConnected));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    if (!isDbConnected) {
      isDbConnected = true;
      notifyListeners();
    }
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      if (isDbConnected) {
        isDbConnected = false;
        notifyListeners();
      }
      console.warn("Firestore is in offline mode. Check your connection or Firebase configuration.");
    }
  }
}

// Initial test
testConnection();

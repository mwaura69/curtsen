import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
export const db = getFirestore(app, databaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// For client-side, we can't easily reassign the exported 'db' constant if it's already imported.
// But we can at least log clearly and provide a way to check.
export async function testConnection() {
  try {
    const testDoc = doc(db, 'test', 'connection');
    await getDocFromServer(testDoc);
    console.log(`[Firebase] Client successfully connected to ${databaseId}`);
  } catch (error: any) {
    console.error(`[Firebase] Client connection error for ${databaseId}:`, error.message);
    if (error.message.includes("not-found")) {
      console.warn("This usually means the database in your config doesn't exist. Check your Firestore settings.");
    }
  }
}
testConnection();

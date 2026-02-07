import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyC0MvR7fZVt2M077iuhxYV3Jc6qDy1IAEU',
  authDomain: 'centraldoconcurseiro-3574b.firebaseapp.com',
  projectId: 'centraldoconcurseiro-3574b',
  storageBucket: 'centraldoconcurseiro-3574b.firebasestorage.app',
  messagingSenderId: '938916508338',
  appId: '1:938916508338:web:0593f02921ea78409f0fab',
  measurementId: 'G-2H2ZE802CE',
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

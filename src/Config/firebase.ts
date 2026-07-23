import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Same Firebase project as the main Scholarton app — the admin signs in
// against the same user pool, so the ID token the API verifies is identical
// in shape to the one the student/mentor app sends.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

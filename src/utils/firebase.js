// Initialize Firebase:
import admin from "firebase-admin";
import serviceAccount from "../../private/serviceAccountKey.json";
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore:
const db = admin.firestore();
const auth = admin.auth();

export default {
  admin,
  db,
  auth
};
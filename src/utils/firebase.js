// Initialize Firebase:
const admin = require("firebase-admin");
const serviceAccount = require("../../private/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore:
const db = admin.firestore();
const auth = admin.auth();

module.exports = {
  admin,
  db,
  auth
};
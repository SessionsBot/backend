// Initialize Firebase:
const admin = require("firebase-admin");
const serviceAccount = require("../STORAGE/serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Firestore:
const db = admin.firestore();

// Create new guild function:
async function createNewGuild(guildId) {
  const defaultGuildData = {
    sessionSignUp_Channel: 0,
    sessionSignUp_MentionRoles: [],
    // sessions: [] <-- Added later in setup
  }

  await db.collection('guilds').doc(String(guildId)).set(defaultGuildData, { merge: true })
    .then(() => {
      // console.log('[+] New guild stored:', guildId);
      return [true, 'Successfully added new guild!'];
    })
    .catch((error) => {
      console.warn('[!] Error adding new guild document: ', error);
      return [false, 'An error occured when trying to save this guild!'];
    });
}

module.exports = {
  admin,
  db,
  createNewGuild
};
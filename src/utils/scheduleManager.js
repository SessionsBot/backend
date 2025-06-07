
// -------------------------- [ Imports/Variables ] -------------------------- \\
const cron = require('node-cron');
const global = require('../src/utils/global.js') // Import Global Variables
const guildManager = require('../src/utils/guildManager.js')
const { db } = require('../src/utils/firebase.js'); // Import Firebase

// -------------------------- [ Functions ] -------------------------- \\


// [TO-DO]  
// Create the 'Initializer' scheudle/function that loads all 'session post schedules' once daily
// the Initializer function will read all guilds/session schedules for SIGNUP POST TIME and schedule them with cron accordingly


// Runs Daily @12AM - Loads and schedules all other 'Guild Schedules':
async function dailyInitialize() {

    // Get all guilds:
    const guildsRef = db.collection('guilds')
    const guildsSnapshot = await guildsRef.get();
    
    // For each guild:
    // console.log('DAILY INITIALIZE - ALL GUILDS:')
    guildsSnapshot.forEach(doc => {
        // console.log(doc.id, '=>', doc.data());
    });

}



// -------------------------- [ Exports ] -------------------------- \\
module.exports = {
    dailyInitialize,
}
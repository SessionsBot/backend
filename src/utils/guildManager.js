// -------------------------- [ Imports/Variables ] -------------------------- \\

const { db } = require('./firebase.js'); // Import Firebase
const global = require('./global.js'); // Import Global Variables

const inDepthDebug = (c) => { if (global.outputDebug_InDepth) { console.log(`[Guild Manager]: ${c}`) } }


// -------------------------- [ Functions ] -------------------------- \\

// Creating New Guild Doc:
async function createNewGuildDoc(guildId) {
    
    // Default data for new guilds:
    const defaultGuildData = {
        setupCompleted: false,
        accentColor: '0x9b42f5',
        adminRoleIds: [],
        sessionSchedules: {},
        upcomingSessions: {},
    }

    try {
        // Save new guild to database:
        await db.collection('guilds').doc(String(guildId)).set(defaultGuildData, { merge: true });

        // Success:
        inDepthDebug(`Successfully added new guild doc! Id: ${guildId}`);
        const result = { success: true, data: 'Successfully added new guild!' };
        return result;
    } catch (error) {
        // Error:
        console.warn('[!] Error adding new guild document: ', error);
        const result = { success: false, data: 'An error occured when trying to save this guild!' };
        return result;
    }
}


// Updating Guild Doc:
async function updateGuildDataField(guildId, fieldPath, fieldValue) {
    
    try {
        // Attempt to save new guild data to database:
        await db.collection('guilds').doc(String(guildId)).set({
            [fieldPath]: fieldValue
        }, { merge: true });

        // Success:
        inDepthDebug(`Successfully updated guild doc! Id: ${guildId}`);
        const result = { success: true, data: `Successfully updated guild doc! Id: ${guildId}` };
        return result;
    } catch (error) {
        // Error:
        console.warn('[!] Error updating guild document: ', error);
        const result = { success: false, data: 'An error occured when trying to update this guild!' };
        return result;
    }
}


// Guild Configuration - Nested Functions:
const guildConfiguration = (guildID) => { return {
    
    // Updating Accent Color:
    setAccentColor : async (hexNumber) => {
        return await updateGuildDataField(guildID, 'accentColor', hexNumber)
    },

    // Updating Admin Role Ids:
    setAdminRoleIds : async (roleIdsArray) => {
        return await updateGuildDataField(guildID, 'adminRoleIds', roleIdsArray)
    },

    // Updating Session Schedules:
    setSessionSchedules : async (sessionSchedulesObject) => {
        return await updateGuildDataField(guildID, 'sessionSchedules', sessionSchedulesObject)
    },

    // Adjust Guild Setup Flag:
    setSetupComplete : async (isComplete) => {
        return await updateGuildDataField(guildID, 'setupCompleted', isComplete)
    },

}}




// Example Guild Setup Incoming Data:
const incomingData_GuildSetup =  {
    dailySignupPostTime: {
        hour: 6,
        minuets: 30,
        timeZone: 'US Chicago'
    },
    exampleScheduleID123: {
        sessionTitle: 'Title Example',
        sessionUrl: 'https://www.games.roblox.com',
        roles: [
            {
                roleName: 'Role Name 1',
                roleDescription: 'This is an example role description.',
                roleCapcity: 1,
            },
            {
                roleName: 'Role Name 2',
                roleDescription: 'This is an example role description.',
                roleCapcity: 3,
            },
        ],
        eventDateDaily: {
            hour: 6,
            minuets: 30,
            timeZone: 'US Chicago'
        },
    }
}


// Testing:
console.info('Loaded Guild Manager!');
setTimeout(async () => {
    // await createNewGuildDoc('EX_1234567');
    // await guildConfiguration('EX_1234567').setSessionSchedules(incomingData_GuildSetup)
}, 1000);


// TODO List:
// ! Just Finished: Testing adding 'default first batch' session schedule for guild
// ? Next Steps: Decide on layout of sessions data/ decifier by schedule id? for edititing later on?
// ? Next Steps: Remaking/updating session manager


// -------------------------- [ Exports ] -------------------------- \\

module.exports = {
    createNewGuildDoc,
    guildConfiguration
}
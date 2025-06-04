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
        console.log(`[+] Successfully added new guild! Id: ${guildId}`);
        const result = { success: true, data: 'Successfully added new guild!' };
        return result;
    } catch (error) {
        // Error:
        console.warn('[!] Error adding new guild document: ', error);
        const result = { success: false, data: 'An error occured when trying to save this guild!' };
        return result;
    }
}


// Reading Guild Doc:
async function readGuildDoc(guildId) {
    try {
        const guildRef = await db.collection('guilds').doc(String(guildId)).get();
        const guildData = guildRef.data();
        return { success: true, data: guildData };
    } catch (e) {
        console.warn('[!] Error reading guild document: ', e);
        return { success: false, data: 'An error occurred when trying to read this guild!' };
    }
}


// Move Guild to Archive:
async function archiveGuildDoc(guildId) {
    const guildRef = db.collection('guilds').doc(guildId);
    const archivedRef = db.collection('archivedGuilds').doc(guildId);

    try {
        // 1. Read original doc
        const doc = await guildRef.get();

        if (!doc.exists) {
            console.warn(`Guild document ${guildId} does not exist.`);
            return { success: false, error: 'Document not found' };
        }

        const data = doc.data();

        // 2. Write to archive
        await archivedRef.set({
            ...data,
            archivedAt: new Date()
        });

        // 3. Delete original
        await guildRef.delete();

        console.log(`[-] Guild ${guildId} moved to archive successfully.`);
        return { success: true };

    } catch (err) {
        console.error(`Failed to move guild ${guildId} to archive:`, err);
        return { success: false, data: err };
    }
}


// Updating Guild Doc's Specific Field:
async function updateGuildDocField(guildId, fieldPath, fieldValue) {
    
    try {
        // Attempt to save new guild data to database:
        await db.collection('guilds').doc(String(guildId)).update({
            [fieldPath]: fieldValue
        });

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
const guildConfiguration = (guildId) => { return {
    
    // Updating Accent Color:
    setAccentColor : async (hexNumber) => {
        return await updateGuildDocField(guildId, 'accentColor', hexNumber)
    },

    // Updating Admin Role Ids:
    setAdminRoleIds : async (roleIdsArray) => {
        return await updateGuildDocField(guildId, 'adminRoleIds', roleIdsArray)
    },

    // Update Daily Session Signup Post Time:
    setDailySignupPostTime : async (dailyPostTimeObject) => {
        return await updateGuildDocField(guildId, 'sessionSchedules.dailySignupPostTime', dailyPostTimeObject)
    },

    // Update/Set Specific Session Schedule:
    setSessionSchedule : async (scheduleId, sessionScheduleObject) => {
        return await updateGuildDocField(guildId, `sessionSchedules.${scheduleId}`, sessionScheduleObject)
    },

    // Adjust Guild Setup Flag:
    setSetupComplete : async (isComplete) => {
        return await updateGuildDocField(guildId, 'setupCompleted', isComplete)
    },

}}


// Guild Sessions - Nested Functions:
const guildSessions = (guildId) => { return {

    // Get All Sessions for a Guild:
    getSessions: async () => {
        const guildDoc = await db.collection('guilds').doc(String(guildId)).get();
        if (!guildDoc.exists) {
            // No Guild Doc:
            const result = { success: false, data: `[92813] Cannot find guild data/configuration for: ${guildId}` };
            return result;
        }

        const guildData = guildDoc.data() || null;
        const upcomingSessions = guildData.upcomingSessions || {};

        const result = { success: true, data: upcomingSessions };
        return result;
    },


    // Create New Upcomming Session:
    createSession: async (sessionScheduleObject) => {
        const sessionDateDaily = sessionScheduleObject.sessionDateDaily;
        const sessionRoles = sessionScheduleObject.roles;
        const sessionTitle = sessionScheduleObject.sessionTitle ;
        const sessionUrl = sessionScheduleObject.sessionUrl;

        // Generate Session Id:
        const sessionId = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        
        // [FIREBASE] Add Session to Firestore:
        await db.collection('guilds').doc(String(guildId)).update({
            [`upcomingSessions.${sessionId}`]: { // Use dot notation for nested field
                date: sessionDateDaily,
                roles: sessionRoles,
                title: sessionTitle,
                location: sessionUrl,
            }
        }).then(() => {
            // Success:
            if (global.outputDebug_InDepth) {console.log(`Session created for: ${sessionId}`)}
            const result = { success: true, data: `Successfully updated guild doc! Id: ${guildId}` };
            return result;
        }).catch((error) => {
            // Error:
            console.error("Error creating session: ", error);
            const result = { success: false, data: `An error occured when adding the session ${sessionId} to database!` };
            return result;
        });
    },


    // Assing User to an Upcoming Session:
    assignUserSessionRole: async (sessionId, userId, roleName) => {
        // 1. Get Guild Data:
        // 2. Confirm Role Availability
        // 3. Apply Chnages to Database
        // 4. Update Signup Message
    },


    // Assing User to an Upcoming Session:
    removeUserSessionRole: async (sessionId, userId) => {
        // 1. Get Guild Data:
        // 2. Confirm User Assigned
        // 3. Apply Chnages to Database
        // 4. Update Signup Message
    },


    // Get Session Signup Embded Contents - Edits Msg if Id Provided:
    getSignupEmbedContents: async (messageId) => {
        // 1. Get Guild Data:
        // 2. Return Embed Contents
    },

}}



// -------------------------- [ Exports ] -------------------------- \\

module.exports = {
    createNewGuildDoc,
    readGuildDoc,
    archiveGuildDoc,
    updateGuildDocField,
    guildConfiguration,
    guildSessions,
}
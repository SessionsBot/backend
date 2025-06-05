// -------------------------- [ Imports/Variables ] -------------------------- \\

const { json } = require('express');
const { db } = require('./firebase.js'); // Import Firebase
const global = require('./global.js'); // Import Global Variables
const { // Discord.js:
    ContainerBuilder, 
    SeparatorBuilder, 
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require('discord.js');

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
        sessionSignup: {
            signupMsgId: null,
            dailySignupPostTime: null
        },
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
        const result = { success: false, data: `An error occured when trying to save this guild! (${guildId})` };
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
        return { success: false, data: 'An error occurred when trying to read this guild!', rawError: e};
    }
}


// Move Guild to Archive:
async function archiveGuildDoc(guildId) {
    const guildRef = db.collection('guilds').doc(guildId);
    const archivedRef = db.collection('archivedGuilds').doc(guildId);

    try {
        // 1. Read original doc
        const guildDoc = await guildRef.get();

        if (!guildDoc.exists) {
            console.warn(`Guild document ${guildId} does not exist.`);
            return { success: false, error: `Couldn't find exisiting guild doc to archive!` };
        }

        const guildData = guildDoc.data();

        // 2. Write to archive
        await archivedRef.set({
            ...guildData,
            archivedAt: new Date()
        });

        // 3. Delete original
        await guildRef.delete();

        console.log(`[-] Guild ${guildId} moved to archive successfully.`);
        return { success: true };

    } catch (e) {
        console.error(`Failed to move guild ${guildId} to archive:`, err);
        return { success: false, data: `Failed to move guild ${guildId} to archive:`, rawError: e };
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
    } catch (e) {
        // Error:
        console.warn('[!] Error updating guild document: ', error);
        const result = { success: false, data: 'An error occured when trying to update a guild field!', rawError: e  };
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
        return await updateGuildDocField(guildId, 'sessionSignup.dailySignupPostTime', dailyPostTimeObject)
    },

    // Update/Set Specific Session Schedule:
    setSessionSchedule : async (sessionScheduleObject) => {
        // Generate Session Id:
        const scheduleId = 'shd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        
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
            const result = { success: false, data: `Cannot find guild doc/data for: ${guildId}` };
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
        try {
            await db.collection('guilds').doc(String(guildId)).update({
                [`upcomingSessions.${sessionId}`]: { // Use dot notation for nested field
                    date: sessionDateDaily,
                    roles: sessionRoles,
                    title: sessionTitle,
                    location: sessionUrl,
                }
            });

            // Success:
            if (global.outputDebug_InDepth) {console.log(`Session created for: ${sessionId}`)}
            const result = { success: true, data: `Successfully updated guild doc! Id: ${guildId}` };
            return result;

        } catch (error) {
            // Error:
            console.error("Error creating session: ", error);
            const result = { success: false, data: `An error occured when adding the session ${sessionId} to database!` };
            return result;
        }
    },


    // Assing User to an Upcoming Session:
    assignUserSessionRole: async (sessionId, userId, roleName) => {
        // Confirm Guild Data:
        const guildDataRetrvial = await readGuildDoc(guildId)
        if(!guildDataRetrvial.success) return {success: false, data: 'Could not get Guild data for session modifications!'};
        const guildData = guildDataRetrvial.data;
        
        // Confirm Session Exists:
        if(!Object.keys(guildData['upcomingSessions']).includes(sessionId)) return {success: false, data: `Couldn't find session(${sessionId}) to assign user.`};

        // Confirm User's not already in Session:
        let sessionData = guildData['upcomingSessions'][sessionId];
        let sessionRoles = sessionData['roles'] || []

        // Check if users already assigned session:
        let existingRoleAssigned = sessionRoles.find(role => role['users'].includes(String(userId)))
        if(existingRoleAssigned) return {success: false, data: `You're already assigned this role! Please unassign yourself and try again.`, currentRole: existingRoleAssigned['roleName']}
        

        // Find requested role:
        let requestedRole = sessionRoles.find(role => role.roleName === roleName)
        if(!requestedRole) return {success: false, data: `Couldn't find role("${roleName}") to assign user.`};
        if( requestedRole['users'].length >= Number(requestedRole['roleCapcity']) ) return {success: false, data: `This role is at capacity! Please choose a different role.`};

        // Add user to requested role:
        requestedRole.users.push(String(userId))

        // Save session changes to databse:
        const updateSuccess = await updateGuildDocField(guildId, `upcomingSessions.${sessionId}`, sessionData)
        if(!updateSuccess.success) return {success: false, data: 'Failed to update guild data within database!'};

        return {success: true, data: 'Successfully added user to role!'};
    },


    // Assing User to an Upcoming Session:
    removeUserSessionRole: async (sessionId, userId) => {
        // Confirm Guild Data:
        const guildDataRetrvial = await readGuildDoc(guildId)
        if(!guildDataRetrvial.success) return {success: false, data: 'Could not get Guild data for session modifications!'};
        const guildData = guildDataRetrvial.data;

        // Confirm Session Exists:
        if(!Object.keys(guildData['upcomingSessions']).includes(sessionId)) return {success: false, data: `Couldn't find session(${sessionId}) to remove user.`};

        let sessionData = guildData['upcomingSessions'][sessionId];
        let sessionRoles = sessionData['roles'] || []

        // Find user's assigned role:
        sessionRoles.forEach(role => {
            if(role.users.includes(userId)) {
                return role.users = role.users.filter(id => id !== userId);
            }
        });

        // Save session changes to databse:
        const updateSuccess = await updateGuildDocField(guildId, `upcomingSessions.${sessionId}`, sessionData)
        if(!updateSuccess.success) return {success: false, data: 'Failed to update guild data within database!'};

        return {success: true, data: 'Successfully removed user from role!'};
    },


    // Get Session Signup Embded Contents - Edits Msg if Id Provided:
    getSignupEmbedContents: async () => {
        // 1. Get Guild Data
        const guildDataRetrvial = await readGuildDoc(guildId);
        if(!guildDataRetrvial.success) return {success: false, data: `Couldn't find guild(${guildId}) to embed signup message.`};
        const guildData = guildDataRetrvial.data;

        const upcomingSessions = guildData?.['upcomingSessions']
        if(!upcomingSessions || !Object.entries(upcomingSessions).length) return {success: false, data: `Guild does not have any upcoming sessions.`};

        console.log('Signup Embed - Sessions Found:', JSON.stringify(upcomingSessions, null, 2))

        // 2. Create Embed Contents



        // 3. Return/Edit Message:
        const exisitingSignupMsgId = guildData['sessionSignup']?.['signupMsgId']
        if(!exisitingSignupMsgId) {
            // Exisiting Signup Message Edit/Replace:

        } else {
            // No Exisiting Signup Message - Send New:

        }
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




const EXAMPLE_scheduleObject = {
			sessionDateDaily: {
				hour: 7,
				minuets: 30,
				timeZone: 'US Chicago'
			},
			roles: [
				{ roleName: 'Role Name', roleCapcity: 1, users: [], roleDescription: 'This is an example role description.' },
				{ roleName: 'Role2 Name', roleCapcity: 3, users: [], roleDescription: 'This is an example role description.' }
			],
			sessionTitle: 'Title Example',
			sessionUrl: 'https://www.games.roblox.com'
		}
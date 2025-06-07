// -------------------------- [ Imports/Variables ] -------------------------- \\
const { DateTime } = require('luxon');
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
            dailySignupPostTime: null,
            mentionRoleIds: [],
            signupChannelId: null,
            signupMessageId: null,
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

    // Updating Daily Signup Mention Role Ids:
    setSignupMentionIds : async (roleIdsArray) => {
        return await updateGuildDocField(guildId, 'sessionSignup.mentionRoleIds', roleIdsArray)
    },

    // Add Specific Session Schedule:
    addSessionSchedule : async (sessionScheduleObject) => {
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


    // Create Todays Sessions from Schedules:
    createAllUpcomingSessions: async (fullSchedulesObject) => { try{

        const upcomingSessions = {};

        // For Each Sechedule:
        for(const[scheduleId, scheduleData] of Object.entries(fullSchedulesObject)) {
            // Session Data:
            const sessionDateDaily = scheduleData?.['sessionDateDaily'];
            const sessionRoles = scheduleData?.['roles'];
            const sessionTitle = scheduleData?.['sessionTitle'] ;
            const sessionUrl = scheduleData?.['sessionUrl'];
            
            // Generate Session Id:
            const sessionId = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

            // Create Discord Timestamp from sessionDateDaily object
            const createDiscordTimestamp = (sessionDateDaily) => {
                const { hours, minutes, timeZone } = sessionDateDaily;

                // Create a DateTime in the specified time zone
                const dateTime = DateTime.fromObject(
                    { hour: hours, minute: minutes, second: 0, millisecond: 0 },
                    { zone: timeZone }
                );

                // Convert to UNIX timestamp (seconds, not ms)
                const discordTimestamp = String(Math.floor(dateTime.toSeconds()));

                return discordTimestamp;
            };

            // Assign Discord Timestamp:
            sessionDateDaily.discordTimestamp = createDiscordTimestamp(sessionDateDaily);
            
            // Add to upcomingSessions Table:
            upcomingSessions[sessionId] = {
                date: sessionDateDaily,
                roles: sessionRoles,
                title: sessionTitle,
                location: sessionUrl,
            }
        }

        // Save all Session to Upcoming Sessions:
        const saveResult = await updateGuildDocField(guildId, 'upcomingSessions', upcomingSessions);
        if(saveResult.success){
            // Update Signup Message:
            return await guildSessions(guildId).updateSessionSignup()
        }

        // Creation Success:
        const result = { success: true, data: `Successfully created guilds sessions from schedules! Id: ${guildId}` };
        return result;
    } catch(e){
        // Error Occured:
        const result = { success: false, data: `Failed to create guilds sessions from schedules! Id: ${guildId}`, rawError: e };
        return result;
    }},


    // Create New Upcomming Session:
    createSession: async (sessionScheduleObject) => {
        const sessionDateDaily = sessionScheduleObject.sessionDateDaily;
        const sessionRoles = sessionScheduleObject.roles;
        const sessionTitle = sessionScheduleObject.sessionTitle ;
        const sessionUrl = sessionScheduleObject.sessionUrl;

        // Generate Session Id:
        const sessionId = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        // Create Discord Timestamp from sessionDateDaily object
        const createDiscordTimestamp = (sessionDateDaily) => {
            const { hours, minutes, timeZone } = sessionDateDaily;

            // Create a DateTime in the specified time zone
            const dateTime = DateTime.fromObject(
                { hour: hours, minute: minutes, second: 0, millisecond: 0 },
                { zone: timeZone }
            );

            // Convert to UNIX timestamp (seconds, not ms)
            const discordTimestamp = String(Math.floor(dateTime.toSeconds()));

            return discordTimestamp;
        };

        // Assign Discord Timestamp:
        sessionDateDaily.discordTimestamp = createDiscordTimestamp(sessionDateDaily);
        
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
        if( requestedRole['users'].length >= Number(requestedRole['roleCapacity']) ) return {success: false, data: `This role is at capacity! Please choose a different role.`};

        // Add user to requested role:
        requestedRole.users.push(String(userId))

        // Save session changes to databse:
        const updateSuccess = await updateGuildDocField(guildId, `upcomingSessions.${sessionId}`, sessionData)
        if(!updateSuccess.success) return {success: false, data: 'Failed to update guild data within database!'};

        // Update Guilds Signup Message:
		await guildSessions(guildId).updateSessionSignup()

        return {success: true, data: 'Successfully added user to role!', sessionData: sessionData, guildData: guildData};
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

        // Update Guilds Signup Message:
		await guildSessions(guildId).updateSessionSignup()

        return {success: true, data: 'Successfully removed user from role!', sessionData: sessionData, guildData: guildData};
    },


    // Get Session Signup Embded Contents - Sends/Edits Msg if (not) Id Provided:
    updateSessionSignup: async () => {
        // 1. Get Guild Data:
        const guildDataRetrvial = await readGuildDoc(guildId);
        if(!guildDataRetrvial.success) return {success: false, data: `Couldn't find guild(${guildId}) to embed signup message.`};
        const guildData = guildDataRetrvial.data;

        const unsortedSessions  = guildData?.['upcomingSessions']
        if(!unsortedSessions || !Object.entries(unsortedSessions).length) return {success: false, data: `Guild does not have any upcoming sessions.`};
        const upcomingSessions = Object.entries(unsortedSessions).sort((a, b) => a[1].date - b[1].date);

        const signupMentionRoles = guildData['sessionSignup']['mentionRoleIds'];

        
        // 2. Create Embed Contents:
        const messageContent = async () => {

            const signupContainer = new ContainerBuilder();
            const seperator = new SeparatorBuilder();
            signupContainer.setAccentColor(0x9b42f5)

            // Title & Desc:
            signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('# 📅  __Session Signup__  📅 \n-# Upcoming group sessions are listed below:'))
            // Spacer:
            signupContainer.addSeparatorComponents(seperator) 

            // Apend each session to msg:
            for ([sessionId, sessionData] of upcomingSessions) {
                // Get Session Data:
                const sessionRoles = sessionData['roles'] || [];
                const sessionFull = () => {
                    // Returns true if every role is full
                    return sessionRoles.every(role => role['users'].length >= role['roleCapacity']);
                }

                let sessionButtons = async () => {
                    if(sessionFull()) { // Session Full - Hide Signup:
                        return new ActionRowBuilder().addComponents(	
                            new ButtonBuilder()
                                .setCustomId(`sessionSignup:${sessionId}`)
                                .setLabel('⛔️ Session Full')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(true),
                            
                            new ButtonBuilder()
                                .setLabel('🎯 Game Link')
                                .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                                .setStyle(ButtonStyle.Link)
                        );
                    } else { // Session NOT Full - Show Signup:
                        return new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`sessionSignup:${sessionId}`)
                                .setLabel('📝 Sign Up')
                                .setStyle(ButtonStyle.Success),
                            
                            new ButtonBuilder()
                                .setLabel('🎯 Game Link')
                                .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                                .setStyle(ButtonStyle.Link)
                        );
                    }
                }

                // Get Session Text Content:
                let sessionTextContent = '';
                // Session Date:
                sessionTextContent += `### **[ ⏰ ] <t:${sessionData['date']['discordTimestamp']}:F>** \n > <t:${sessionData['date']['discordTimestamp']}:R> \n` 
                // Session Role(s):
                sessionRoles.forEach(role => {
                    const roleName = role['roleName'];
                    const roleEmoji = role['roleEmoji'];
                    const roleUsers = Array.isArray(role['users']) ? role['users'] : [];
                    const roleCapcity = role['roleCapacity'];
                    const roleFull = (roleUsers.length >= roleCapcity)
                    let roleString;

                    // No Users Assigned:
                    if(roleUsers.length === 0) {
                        roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`AVAILABLE 🟢\`***` +  ` *(0/${roleCapcity})* \n` + ` > *@AVAILABLE*  \n`
                        return sessionTextContent += roleString
                    }
                    
                    // Role at Max Capcity
                    if(roleFull){
                        roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`UNAVAILABLE ⛔️\`***` +  ` *(${roleCapcity}/3)* \n` + roleUsers.map(id => `> <@${id}>`).join('\n') + '\n';
                        return sessionTextContent += roleString;
                    }else {
                    // Role Availale:
                        roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`AVAILABLE 🟢\`***` +  ` *(${roleUsers.length}/3)* \n` + roleUsers.map(id => `> <@${id}>`).join('\n') + '\n';
                        return sessionTextContent += roleString;
                    }
                })

                // Append All Text to Container:
                signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(sessionTextContent));


                // Invisible Spacer:
                signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) )
                // Session Buttons:
                signupContainer.addActionRowComponents(await sessionButtons())
                // Invisible Spacer:
                signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) )
                // Seperator:
                signupContainer.addSeparatorComponents(seperator)

            }

            // Add signup mention role tag:
            if(Array.isArray(signupMentionRoles) && signupMentionRoles.length >= 1) {
                let mentionString = '🔔: '
                for (const roleId of signupMentionRoles) {
                    mentionString += `<@&${roleId}> `
                }
                signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${mentionString}`))
            }

            return signupContainer // Return signupContainer message contents

        }

        // 3. Get Existing Signup Message:
        let exisitingSignupMsgId = guildData['sessionSignup']['signupMessageId']
        if(exisitingSignupMsgId) { // Existing Signup Message - Edit/Replace:
            try{
                const signupChannelId = guildData['sessionSignup']['signupChannelId']
                const signupChannel = await global.client.channels.fetch(signupChannelId);
                if(!signupChannel) throw new Error(`Can't fetch signup channel for edit...`);
                const message = await signupChannel.messages.fetch(exisitingSignupMsgId);
                if(!message) throw new Error(`Can't fetch message to edit...`);
                const messageContainer = await messageContent() 
        
                // Edit Original Message:
                await message.edit({
                    flags: MessageFlags.IsComponentsV2,
                    components : [messageContainer],
                }).catch((err) => {
                    console.log('{!} Failed to Update Session Embed:');
                    console.log(err);
        
                });

                // Return Result:
                return {success: true, data: `Successfully edited signup message.`};

            }catch(e){
                exisitingSignupMsgId = null;
                console.warn('[!] An error occured when trying to update an exisiting signup message:', e);
            }

        }
        
        if(!exisitingSignupMsgId) { // No Existing Signup Message - Send New:
            console.log(`SENDING NEW SIGNUP PANEL! |  GUILD ID: ${guildId}`)
            try{
                // Fetch Destination/Contents:
                const signupChannelId = guildData['sessionSignup']['signupChannelId']
                const signupChannel = await global.client.channels.fetch(signupChannelId);
                const messageContainer = await messageContent()
        
                // Send Message:
                const newSignupMsg = await signupChannel.send({
                    flags: MessageFlags.IsComponentsV2,
                    components : [messageContainer],
                }).catch((err) => {
                    console.log('{!} Failed to Send Session Embed:');
                    console.log(err);
        
                });

                // Save new msg id:
                if(newSignupMsg){
                    const newSignupMsgId = newSignupMsg.id
                    updateGuildDocField(guildId, 'sessionSignup.signupMessageId', newSignupMsgId)
                }

                // Return Result:
                return {success: true, data: `Successfully sent new signup message.`};

            }catch(e){
                console.warn('[!] An error occured when trying to send a new signup message:', e);
                // Return Result:
                return {success: false, data: `Failed to send new signup message.`};
            }
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
    guildSessions
}

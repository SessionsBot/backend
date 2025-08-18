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
    MessageFlags,
    SectionBuilder,
    ThreadAutoArchiveDuration,
    ChannelType,
    ThumbnailBuilder
} = require('discord.js');
const { json } = require('express');

const inDepthDebug = (c) => { if (global.outputDebug_InDepth) { console.log(`[Guild Manager]: ${c}`) } }


// -------------------------- [ Functions ] -------------------------- \\


const guilds = (guildId) => {return {
    
    // Creating New Guild Doc:
    createNewGuild: async () => {
        
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
                panelChannelId: null,
            },
            timeZone: 'America/Chicago'
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
            const result = { success: false, data: `An error occurred when trying to save this guild! (${guildId})` };
            return result;
        }
    },


    // Reading Guild Doc:
    readGuild: async () => {
        try {
            const guildRef = await db.collection('guilds').doc(String(guildId)).get();
            /** @type {import('@sessionsbot/api-types').FirebaseGuildDoc} */
            const guildData = guildRef.data();
            return { success: true, data: guildData };
        } catch (e) {
            console.warn('[!] Error reading guild document: ', e);
            return { success: false, data: 'An error occurred when trying to read this guild!', rawError: e};
        }
    },


    // Move Guild to Archive:
    archiveGuild: async () => {
        const guildRef = db.collection('guilds').doc(guildId);
        const archivedRef = db.collection('archivedGuilds').doc(guildId);

        try {
            // 1. Read original doc
            const guildDoc = await guildRef.get();

            if (!guildDoc.exists) {

                console.warn(`Guild document ${guildId} does not exist. Failed to archive!`);

                return { success: false, error: `Couldn't find existing guild doc to archive!` };
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
    },


    // Updating Guild Doc's Specific Field:
    updateDocField: async (fieldPath, fieldValue) => {
        
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
            console.warn('[!] Error updating guild document: ', e);
            const result = { success: false, data: 'An error occurred when trying to update a guild field!', rawError: e  };
            return result;
        }
    },

}}


// Guild Configuration - Nested Functions:
const guildConfiguration = (guildId) => {return {

    // !!! [NEEDS COMPLETION] - {guildConfiguration}
    //{*} Remove Specific Session Schedule:
        // removeSessionSchedule: async (sessionId) => {},
    // !!!

    // -- Top Level Configure Function:
    configureGuild : async (configuration) => {
        // Confirm Data:
        if(!configuration.panelChannelId || !configuration.allGuildSchedules) return {success: false, data: 'Missing required data for guild configuration!', rawError: {invalid_Config: configuration}}
        // Update Guild Doc:
        try {
            await db.collection('guilds').doc(String(guildId)).set({
                ['accentColor']: configuration.accentColor,
                ['adminRoleIds']: configuration.adminRoleIds,
                ['sessionSchedules']: configuration.allGuildSchedules,
                ['sessionSignup']: {
                    'panelChannelId': configuration.panelChannelId,
                    'dailySignupPostTime': configuration.dailySignupPostTime,
                    'mentionRoleIds': configuration.signupMentionIds,
                },
                ['timeZone']: configuration.timeZone,
                ['setupCompleted']: true
            }, { merge: true });
            // Success:
            return {success: true, data: 'Saved new guild configuration to database!'}

        } catch (e) {
            // Error:
            console.log(`{!} Failed to save new guild configuration:`)
            console.log(e)
            return {success: false, data: 'Failed to save new guild configuration to database!', rawError: e}
        }
    },
    
    // Updating Accent Color:
    setAccentColor : async (hexNumber) => {
        return await guilds(guildId).updateDocField('accentColor', hexNumber)
    },

    // Updating Admin Role Ids:
    setAdminRoleIds : async (roleIdsArray) => {
        return await guilds(guildId).updateDocField('adminRoleIds', roleIdsArray)
    },

    // Update Daily Session Signup Post Time:
    setDailySignupPostTime : async (dailyPostTimeObject) => {
        return await guilds(guildId).updateDocField('sessionSignup.dailySignupPostTime', dailyPostTimeObject)
    },

    // Update Daily Signup Mention Role Ids:
    setSignupMentionIds : async (roleIdsArray) => {
        return await guilds(guildId).updateDocField('sessionSignup.mentionRoleIds', roleIdsArray)
    },

    // Adjust Guild Setup Flag:
    setSetupComplete : async (isComplete) => {
        return await guilds(guildId).updateDocField('setupCompleted', isComplete)
    },

}}


// Guild 'Sessions Panel' - Nested Functions:
const guildPanel = (guildId) => {return {
    
    // Get Guild Session Panel Contents:
    mainPanelMessageContents: async (optional_guildData) => { try {
        // Check for Guild Data:
        let guildData = null;
        if(!optional_guildData) {
            // Fetch Guild Data:
            const getAttempt = await guilds(guildId).readGuild()
            if(getAttempt.success) {
                guildData = getAttempt.data
            }
        }else{
            // Assign Passed Guild Data:
            guildData = optional_guildData;
        }
        if(!guildData) return {success: false, data: `Cannot get Guild Data for Guild Signup Contents!`};
        
        const panelChannelId = guildData?.['sessionSignup'] ?.['panelChannelId'];
        if(!panelChannelId) return { success: false, data: `No 'panelChannelId' provided, cannot create new panel!` };
        const accentColor = Number(guildData['accentColor'] | 0x9b42f5);

        // Create Panel Container:
        const panelContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        // Accent:
        panelContainer.setAccentColor(accentColor);
        
        // Heading:
        panelContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${global.emojis.sessionsWText} Group Sessions:`))
        panelContainer.addSeparatorComponents(separator) // Separator:


        // My Sessions:
        panelContainer.addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(
                [
                    new TextDisplayBuilder().setContent('### 💼 My Sessions:'),
                    new TextDisplayBuilder().setContent(`-# View your assigned group sessions and related details by using the 'My Sessions' button.`),
                ]
            )
            .setButtonAccessory(new ButtonBuilder()
                .setCustomId('view-my-sessions')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('👤')
                .setLabel('My Sessions')
            )
        )
        panelContainer.addSeparatorComponents(separator) // Separator:


        // My Notifications:
        panelContainer.addSectionComponents(new SectionBuilder()
            .addTextDisplayComponents(
                [
                    new TextDisplayBuilder().setContent('### 🔔 My Notifications:'),
                    new TextDisplayBuilder().setContent(`-# View your current session notification preferences by using the 'My Notifications' button.`),
                ]
            )
            .setButtonAccessory(new ButtonBuilder()
                .setCustomId('view-my-notifications')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔔')
                .setLabel('My Notifications')
                .setDisabled(true)
            )
        )
        panelContainer.addSeparatorComponents(separator) // Separator:

        // Return Panel Container:
        const result = {success: true, data: panelContainer};
        return result;

    } catch (e) {
        // Failed to Create Guild Panel - Return:
        const result = {success: false, data: 'Error - Failed to Create Guild Panel', rawError: e};
        console.log(result.data + ': ' + e);
        return result;
    }},


    // Set/Update 'Panel Channel' Id:
    setPanelChannelById: async (channelId) => {
        return await guilds(guildId).updateDocField('sessionSignup.panelChannelId', channelId)
    },


    // Create Todays Sessions Thread/Panel:
    createDailySessionsThreadPanel: async () => { try {
        // Get Guild Data:
        const guildRetrieval = await guilds(guildId).readGuild()
        if(!guildRetrieval.success) return { success: false, data: `An error occurred when fetching guild for signup panel.` };
        const guildData = guildRetrieval.data;
        const panelChannelId = guildData?.['sessionSignup']?.['panelChannelId'];
        const panelMessageId = guildData?.['sessionSignup']?.['signupThreadId'];
        const panelChannel = await global.client.channels.fetch(panelChannelId).catch((e) => {})
        const guildTimeZone = guildData?.['timeZone'] || 'America/Chicago';
        if(!panelChannelId || !panelChannel) return { success: false, data: `Cannot get guild's required panel channel for daily thread creation!`};

        // Delete Existing Panel:
        if(panelMessageId){ try{
            const panelMessage = await panelChannel.messages.fetch(panelMessageId).catch((e) => {})
            await panelMessage.delete().catch((e) => {})
        }catch(e){
            //...
        }}

        // Get Panel Contents:
        const panelContentAttempt = await guildPanel(guildId).mainPanelMessageContents(guildData)
        if(!panelContentAttempt.success) return { success: false, data: `Cannot get guild's panel content for daily thread creation!`};

        // Send New Panel Message in Text Channel:
        const newPanelMessage = await panelChannel.send({
            components: [panelContentAttempt.data],
            flags: MessageFlags.IsComponentsV2
        }) // Don't Save this Msg Id... It's the same as the new thread id...

        // Variables:
        const threadDateString = DateTime.now().setZone(guildTimeZone).toLocaleString({month: 'numeric', day: 'numeric'})

        // Create Daily Sessions Thread:
        const thread = await newPanelMessage.startThread({
            name: `📅 Upcoming Sessions - ${threadDateString}`,
            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            type: ChannelType.PublicThread,
            reason: 'Todays Guild Sessions',
        });

        // After Thread Creation:
        if(thread){
            // Save New Signup Thread/Panel Id:
            const saveThreadAttempt = await guilds(guildId).updateDocField('sessionSignup.signupThreadId', String(thread.id));
            if(!saveThreadAttempt.success) return { success: false, data: `Failed to Save Daily Sessions Thread to Firebase - Possibly still created locally...` };

            // Send Daily Signup Thread Contents:
            const signupContentAttempt = await guildPanel(guildId).sendSignupThreadContents(thread, guildData)
            if(!signupContentAttempt.success) return { success: false, data: `Failed to Send Daily Sessions Signup Contents` };
            
        } else return { success: false, data: `Failed to Create Daily Sessions Thread`, threadAttempt: thread };

        // Return Success Result:
        return { success: true, data: `Created Daily Sessions Thread!.`, threadId: thread.id };

    } catch(e){
        // Log Error:
        console.log(`{!} Failed to Create Daily Sessions Thread:`, e)
        // Return Success Result:
        return { success: false, data: `Failed to Create Daily Sessions Thread`, rawError: e };
    }},


    // Send Sessions Signup Contents in Daily Thread:
    sendSignupThreadContents: async (signupThread, optional_guildData) => {
        // Check for Guild Data:
        let guildData = null;
        if(!optional_guildData) {
            // Fetch Guild Data:
            const getAttempt = await guilds(guildId).readGuild()
            if(getAttempt.success) {
                guildData = getAttempt.data
            }
        }else{
            // Assign Passed Guild Data:
            guildData = optional_guildData;
        }
        if(!guildData) return {success: false, data: `Cannot get Guild Data for Guild Signup Contents!`};
        if(!signupThread) return { success: false, data: `Failed to Send Daily Thread Content | No Thread Provided!`, rawError: e };
        const accentColor = Number(guildData['accentColor'] | 0x9b42f5);

        // Variables:
        const signupMentionRoles = guildData?.['sessionSignup']?.['mentionRoleIds'] || [];
        
        let allComponents = [] // Hold all message containers to be sent

        // Sort Guild Sessions:
        const unsortedSessions  = guildData?.['upcomingSessions']
        if(!unsortedSessions || !Object.entries(unsortedSessions).length) return {success: false, data: `Guild does not have any upcoming sessions.`};
        const upcomingSessions = Object.entries(unsortedSessions).sort((a, b) => a[1]['date']['discordTimestamp'] - b[1]['date']['discordTimestamp']);
        
        // Add Thread Signup Header:
        const signupHeader = async () => {
            // Build Heading Container:
            const container = new ContainerBuilder()
            container.setAccentColor(accentColor);
            const separator = new SeparatorBuilder()
            // Separator:
            container.addSeparatorComponents(separator)
            // Content:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${global.emojis.sessionsWText} Todays Sessions:`))
            // Separator:
            container.addSeparatorComponents(separator)
            // Date:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### <t:${DateTime.now().toUnixInteger()}:D> `))
            // Add to Components:
            allComponents.push({type: 'header', data: container})
        } 
        // await signupHeader()

        // Add Daily Session Signup(s):
        const sessionSignup = async () => {
            
            // Append Each Upcoming Session:
            for ([sessionId, sessionData] of upcomingSessions) {
                const contentAttempt = await guildSessions(guildId).getSessionPanelContents(sessionId, sessionData, accentColor);
                if(contentAttempt.success){
                    // Add this Session to Components:
                    allComponents.push({type: 'session', id: sessionId, data: contentAttempt.data});
                }else{
                    console.log('{!} Failed to get sessions panel contents for thread!');
                    continue;
                }
            }
            
        }
        await sessionSignup();

        // Add Thread Signup Footer:
        const signupFooter = async () => {
            // Build Footer Container:
            const container = new ContainerBuilder()
            container.setAccentColor(0x354154)
            const separator = new SeparatorBuilder()
            // Content:
            // Add Mention Roles:
            if(Array.isArray(signupMentionRoles) && signupMentionRoles.length >= 1){
                let mentionString = '🔔: '
                for (const roleId of signupMentionRoles) {
                    mentionString += `<@&${roleId}> `
                }
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${mentionString}`))
            }
            // Add Last Edited Details:
            const nowUTCSeconds = DateTime.now().toUnixInteger()
            const lastEditedTimestamp = `<t:${nowUTCSeconds}:R>`;
            let lastEditedString = `*Became Available:* ${lastEditedTimestamp}`
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${lastEditedString}`))
            // Add to Components:
            allComponents.push({type: 'footer', data: container})
        }
        await signupFooter()

        // Send Each Component within Thread:
        let sentSignupMessages = {}
        for(const componentObj of allComponents){
            // Send Msg:
            const msg = await signupThread.send({
                components: [componentObj.data],
                flags: MessageFlags.IsComponentsV2
            })
            // Store Msg Id for Session Signups:
            if(componentObj.type === 'session'){
                // Confirm Session Exists:
                if (!unsortedSessions[String(componentObj.id)]) {
                    console.log(`{!} Cannot find Session ID ${sessionId} to store session signup panel msg id!`);
                    continue; // Skip this sessionId
                }else{
                    // Update Session Data:
                    unsortedSessions[String(componentObj.id)]['signupPanelMsgId'] = String(msg.id);
                }

            }
        }

        // Save upcoming sessions with signup panel ids:
        const signupMsgSaveAttempt = await guilds(guildId).updateDocField('upcomingSessions', unsortedSessions);
        if(!signupMsgSaveAttempt.success) return { success: false, data: 'Failed to save sent session signup msg ids to database!' };

        // Success - Result:
        return { success: true, data: 'Daily Signup Thread Content Success', sessionMessageMap: sentSignupMessages };
    },

}}


// Guild Schedules - Nested Functions:
const guildSchedules = (guildId) => {return { 

    // Add Specific Session Schedule:
    addSessionSchedule : async (sessionScheduleObject) => {
        // Read original schedules:
        const readResults = await guilds(guildId).readGuild()
        if(!readResults.success || !readResults.data) return {success: false, data: 'Failed to read guild data'}
        const guildData = readResults?.data;
        /** @type {import('@sessionsbot/api-types').SessionSchedule[]} */
        const guildSchedules = guildData?.sessionSchedules;
        if(!guildSchedules) return {success: false, data: 'Guild does not have any schedules set up'}
        
        // Append new schedule to array:
        guildSchedules.push(sessionScheduleObject)

        // Save updated array:
        const saveResults = await guilds(guildId).updateDocField(`sessionSchedules`, guildSchedules);
        if(!saveResults.success) return {success: false, data: 'Failed to save updated guild schedules'}
        
        return {success: true, data: 'Schedule was added to guilds successfully!' }
    },

    // Read Specific Session Schedule:
    readSessionSchedule : async (scheduleId) => {
        // Read guild:
        const readResults = await guilds(guildId).readGuild()
        if(!readResults.success) return {success: false, data: 'Failed to read guild data'}
        const guildData = readResults.data;
        if(!guildData?.sessionSchedules) return {success: false, data: 'Guild does not have any schedules set up'}
        // Find & Return sch data:
        const reqSchedule = guildData?.sessionSchedules.find((sch) => sch?.scheduleId == scheduleId);
        if(!reqSchedule) return {success: false, data: 'Not found | Failed to find schedule by id'}
        // Success:
        return {success: true, data: reqSchedule}
    },

    // Modify Specific Session Schedule:
    modifySessionSchedule : async (scheduleId, sessionScheduleObject) => {
        // Read original schedules:
        const readResults = await guilds(guildId).readGuild()
        if(!readResults.success || !readResults.data) return {success: false, data: 'Failed to read guild data'}
        const guildData = readResults?.data;
        /** @type {import('@sessionsbot/api-types').SessionSchedule[]} */
        const guildSchedules = guildData?.sessionSchedules;
        if(!guildSchedules) return {success: false, data: 'Guild does not have any schedules set up'}
        
        // Find schedule to modify:
        const reqScheduleIndex = guildSchedules.findIndex((sch) => sch?.scheduleId == sessionScheduleObject?.scheduleId);
        if(reqScheduleIndex === -1) return {success: false, data: 'Not found | Failed to find schedule by id to modify'}

        // Modify schedule:
        guildSchedules[reqScheduleIndex] = sessionScheduleObject

        // Save updated array:
        const saveResults = await guilds(guildId).updateDocField(`sessionSchedules`, guildSchedules);
        if(!saveResults.success) return {success: false, data: 'Failed to save updated guild schedules'}

        // Success:
        return {success: true, data: 'Schedule was modified successfully!' }
    },

    // Remove Specific Session Schedule:
    removeSessionSchedule : async (scheduleId) => {
        // Read guild:
        const readResults = await guilds(guildId).readGuild()
        if(!readResults.success) return {success: false, data: 'Failed to read guild data'}
        const guildData = readResults?.data;
        /** @type {import('@sessionsbot/api-types').SessionSchedule[]} */
        const guildSchedules = guildData?.sessionSchedules;
        if(!guildSchedules) return {success: false, data: 'Guild does not have any schedules set up'}
        // Find sch to remove:
        const a = Array()
        const reqScheduleIndex = guildSchedules.findIndex((sch) => sch?.scheduleId == scheduleId);
        if(reqScheduleIndex === -1) return {success: false, data: 'Not found | Failed to find schedule by id to remove'}
        // Remove schedule:
        const updatedSchedules = guildSchedules.splice(reqScheduleIndex, 1)
        // Save updated array:
        const saveResults = await guilds(guildId).updateDocField(`sessionSchedules`, guildSchedules);
        if(!saveResults.success) return {success: false, data: 'Failed to save updated/removed guild schedules'}

        // Success:
        return {success: true, data: {removed: updatedSchedules}}
    },

}}


// Guild Sessions - Nested Functions:
const guildSessions = (guildId) => {return {

    // Get All Sessions for a Guild:
    getSessions: async () => {
        const guildDoc = await db.collection('guilds').doc(String(guildId)).get();
        if (!guildDoc.exists) {
            // No Guild Doc:
            const result = { success: false, data: `Cannot find guild doc/data for: ${guildId}` };
            return result;
        }

        const guildData = guildDoc.data() || null;
        /** @type { {[key: string]: import('@sessionsbot/api-types').UpcomingSession } } }  */
        const upcomingSessions = guildData.upcomingSessions || {};

        const result = { success: true, data: upcomingSessions };
        return result;
    },


    // Create New Upcoming Session:
    createSession: async (sessionScheduleObject, timeZone) => {
        const sessionDateDaily = sessionScheduleObject.sessionDateDaily;
        const sessionRoles = sessionScheduleObject.roles;
        const sessionTitle = sessionScheduleObject.sessionTitle ;
        const sessionUrl = sessionScheduleObject.sessionUrl;

        // Generate Session Id:
        const sessionId = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

        // Create Discord Timestamp from sessionDateDaily object
        const createDiscordTimestamp = (sessionDateDaily) => {
            const { hours, minutes } = sessionDateDaily;

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
            const result = { success: false, data: `An error occurred when adding the session ${sessionId} to database!` };
            return result;
        }
    },


    // Assign User to an Upcoming Session:
    assignUserSessionRole: async (sessionId, userId, roleName) => {
        // Confirm Guild Data:
        const guildDataRetrieval = await guilds(guildId).readGuild()
        if(!guildDataRetrieval.success) return {success: false, data: 'Could not get Guild data for session modifications!'};
        const guildData = guildDataRetrieval.data;
        
        // Confirm Session Exists:
        if(!Object.keys(guildData['upcomingSessions']).includes(sessionId)) return {success: false, data: `Couldn't find session(${sessionId}) to assign user.`};

        // Confirm User's not already in Session:
        /** @type {import('@sessionsbot/api-types').UpcomingSession} */
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

        // Save session changes to database:
        const updateSuccess = await guilds(guildId).updateDocField(`upcomingSessions.${sessionId}`, sessionData)
        if(!updateSuccess.success) return {success: false, data: 'Failed to update guild data within database!'};

        // Update Guilds Signup Message:
		await guildSessions(guildId).updateSessionSignup(sessionId)

        return {success: true, data: 'Successfully added user to role!', sessionData: sessionData, guildData: guildData};
    },


    // Assign User to an Upcoming Session:
    removeUserSessionRole: async (sessionId, userId) => {
        // Confirm Guild Data:
        const guildDataRetrieval = await guilds(guildId).readGuild()
        if(!guildDataRetrieval.success) return {success: false, data: 'Could not get Guild data for session modifications!'};
        const guildData = guildDataRetrieval.data;

        // Confirm Session Exists:
        if(!Object.keys(guildData['upcomingSessions']).includes(sessionId)) return {success: false, data: `Couldn't find session(${sessionId}) to remove user.`};
        
        /** @type {import('@sessionsbot/api-types').UpcomingSession} */
        let sessionData = guildData['upcomingSessions'][sessionId];
        let sessionRoles = sessionData['roles'] || []

        // Find user's assigned role:
        sessionRoles.forEach(role => {
            if(role.users.includes(userId)) {
                return role.users = role.users.filter(id => id !== userId);
            }
        });

        // Save session changes to database:
        const updateSuccess = await guilds(guildId).updateDocField(`upcomingSessions.${sessionId}`, sessionData)
        if(!updateSuccess.success) return {success: false, data: 'Failed to update guild data within database!'};

        // Update Guilds Signup Message:
		await guildSessions(guildId).updateSessionSignup(sessionId)

        return {success: true, data: 'Successfully removed user from role!', sessionData: sessionData, guildData: guildData};
    },


    // Create Todays Sessions from Schedules:
    createDailySessions: async (fullSchedulesObject, timeZone) => { try{

        const upcomingSessions = {};

        // For Each Schedule:
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
                const { hours, minutes } = sessionDateDaily;

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
        const saveResult = await guilds(guildId).updateDocField('upcomingSessions', upcomingSessions);
        if(saveResult.success){
            // ...
        }

        // Creation Success:
        const result = { success: true, data: `Successfully created guilds sessions from schedules! Id: ${guildId}` };
        return result;
    } catch(e){
        // Error Occurred:
        const result = { success: false, data: `Failed to create guilds sessions from schedules! Id: ${guildId}`, rawError: e };
        return result;
    }},


    // Get Session Panel Contents by Session Id:
    getSessionPanelContents: async (sessionId, sessionData, accentColor) => {
        // Confirm Data:
        if(!sessionId || !sessionData) return {success: false, data: 'Missing sessionId or sessionData for session panel contents!'}
        // Build Sessions Signup Container:
        const container = new ContainerBuilder()
        container.setAccentColor(accentColor)
        const separator = new SeparatorBuilder()

        // Session Data/Variables:
        const sessionRoles = sessionData?.['roles'] || [];
        const sessionDateDiscord = sessionData?.['date']?.['discordTimestamp'];
        const sessionTitle = sessionData?.['title'] || 'Group Session';
        const sessionLocation = String(sessionData?.['location'] || 'https://www.roblox.com')
        const sessionFull = () => {
            // Returns true if every role is full
            return sessionRoles.every(role => role['users'].length >= role['roleCapacity']);
        }
        const pastSession = () => {
            const nowUTCSeconds = DateTime.now().toUnixInteger()
            return nowUTCSeconds >= sessionDateDiscord
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
                        .setURL(sessionLocation)
                        .setStyle(ButtonStyle.Link)
                );
            } else if(pastSession()) { // Past Session - Hide Signup:
                return new ActionRowBuilder().addComponents(	
                    new ButtonBuilder()
                        .setCustomId(`sessionSignup:${sessionId}`)
                        .setLabel('⌛️ Past Session')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    
                    new ButtonBuilder()
                        .setLabel('🎯 Game Link')
                        .setURL(sessionLocation) 
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
                        .setURL(sessionLocation)
                        .setStyle(ButtonStyle.Link)
                );
            }
        }

        // Session Content:
        // Separator:
        container.addSeparatorComponents(separator)
        // Title:
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 📌  ${sessionTitle}`))
        // Separator:
        container.addSeparatorComponents(separator)
        // Get Session Text Content:
        let sessionTextContent = '';
        // Session Date:
        sessionTextContent += `### **[ ⏰ ] <t:${sessionData['date']['discordTimestamp']}:F>** \n > <t:${sessionData['date']['discordTimestamp']}:R> \n` 
        // Session Role(s):
        sessionRoles.forEach(role => {
            const roleName = role['roleName'];
            const roleEmoji = role['roleEmoji'];
            const roleUsers = Array.isArray(role['users']) ? role['users'] : [];
            const roleCapacity = role['roleCapacity'];
            const roleFull = (roleUsers.length >= roleCapacity)
            let roleString;

            const roleUsersMapString = () => {
                // Past Session & Empty:
                if(pastSession() && !roleUsers.length){
                    return `> *Session Concluded*`
                }   
                // Not Empty but Available:
                if(roleUsers.length >= 1){
                    // Users in Role:
                    return roleUsers.map(id => `> <@${id}>`).join('\n')
                }
                
            }

            // No Users Assigned:
            if(roleUsers.length === 0 && !pastSession()) {
                roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`AVAILABLE 🟢\`***` +  ` *(0/${roleCapacity})* \n` + ` > *Available*  \n`
                return sessionTextContent += roleString
            }
            
            // Role at Max Capacity or Past Session:
            if(roleFull || pastSession()){
                roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`UNAVAILABLE ⛔️\`***` +  ` *(${roleUsers.length}/${roleCapacity})* \n` + roleUsersMapString() + '\n';
                return sessionTextContent += roleString;
            }else {
            // Role Available:
                roleString = `### **[ ${roleEmoji} ] ${roleName} : *\`AVAILABLE 🟢\`***` +  ` *(${roleUsers.length}/${roleCapacity})* \n` + roleUsers.map(id => `> <@${id}>`).join('\n') + '\n';
                return sessionTextContent += roleString;
            }
        })

        // Append All Text to Container:
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(sessionTextContent));

        // Invisible Spacer:
        container.addSeparatorComponents(separator)
        // Session Buttons:
        container.addActionRowComponents(await sessionButtons())
        // Separator:
        container.addSeparatorComponents(separator)

        // Add Session Id Subheading:
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ID:  ${String(sessionId).toUpperCase()}`))

        // Return Full Container:
        return {success: true, data: container}
    },

    
    // Refresh Daily Session Signup Panel by Session Id:
    updateSessionSignup: async (sessionId, optional_guildData) => {
        // Check for Guild Data:
        let guildData = null;
        if(!optional_guildData) {
            // Fetch Guild Data:
            const getAttempt = await guilds(guildId).readGuild()
            if(getAttempt.success) {
                guildData = getAttempt.data
            }
        }else{
            // Assign Passed Guild Data:
            guildData = optional_guildData;
        }
        if(!guildData) return {success: false, data: `Cannot get Guild Data for Session Signup Update!`};
        const accentColor = Number(guildData['accentColor'] | 0x9b42f5);

        // Get Session Data:
        const sessionData = guildData?.['upcomingSessions']?.[String(sessionId)]
        if(!sessionData) return {success: false, data: `Cannot get Session Data for Session Signup Update!`};
        const sessionSignupMsgId = sessionData?.['signupPanelMsgId'];
        if(!sessionSignupMsgId) return {success: false, data: `Cannot get 'sessionSignupMsgId' for Session Signup Update!`};
        const signupThreadId = guildData?.['sessionSignup']?.['signupThreadId']
        if(!signupThreadId) return {success: false, data: `Cannot get 'signupThreadId' for Session Signup Update!`};
        const signupThread = await global.client.channels.fetch(signupThreadId)
        if(!signupThread) return {success: false, data: `Failed to fetch Thread for Session Signup Panel Update!`};
        const sessionPanelMessage = await signupThread.messages.fetch(sessionSignupMsgId)
        if(!sessionPanelMessage) return {success: false, data: `Failed to fetch Panel Message for Session Signup Panel Update!`};
        
        
        // Get Updated Session Panel:
        const contentAttempt = await guildSessions(guildId).getSessionPanelContents(sessionId, sessionData, accentColor)
        if(!contentAttempt.success) return {success: false, data: `Failed to fetch Updated Session Signup Panel Contents!`};


        // Edit Message:
        sessionPanelMessage.edit({
            components: [contentAttempt.data],
            flags: MessageFlags.IsComponentsV2
        })
    },  

}}



// -------------------------- [ Exports ] -------------------------- \\

module.exports = {
    guilds,
    guildConfiguration,
    guildPanel,
    guildSchedules,
    guildSessions
}

// Imports:
const fs = require('fs').promises; // Import File System
const path = require('path'); // Import Path
const { admin, db } = require('../firebase.js'); // Import Firebase
const global = require('../global.js'); // Import Global Variables
const { compileFunction } = require('vm');

// Get All Sessions for a Guild:
async function getSessions(guildId) {
    const guildDoc = await db.collection('guilds').doc(String(guildId)).get();
    if (!guildDoc.exists) {
        console.log(`{!} Guild with ID ${guildId} does not exist.`);
        return {};
    }
    return guildDoc.data().sessions || null;
}

// Create Session by Discord Timestamp:
async function createSession(guildId, discordTimestamp) {
    
    // Generate Session Id:
    const sessionId = 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    
    // [FIREBASE] Add Session to Firestore:
    db.collection('guilds').doc(String(guildId)).set({
        sessions: {
            [sessionId] : {
                date: discordTimestamp,
                host: null,
                trainers: [],
                location: '',
            }
        }
    }, { merge: true }).then(() => {
        if (global.outputDebug_InDepth) {console.log(`Session created for: ${discordTimestamp}`)}
    }).catch((error) => {
        console.error("Error creating session: ", error);
    });
}

// Assign User Role withing Session:
async function assignUserSessionRole(guildId, sessionId, userId, role) {
    // Convert to strings:
    guildId = String(guildId); sessionId = String(sessionId); userId = String(userId)

    // Get Guild Data:
    let guildDoc = await db.collection('guilds').doc(guildId).get()
    if (!guildDoc.exists) {
        console.log(`{!} Guild with ID ${guildId} does not exist.`);
        return [false, `Guild with ID ${guildId} not found.`];
    } else { guildDoc = guildDoc.data() }

    // Get Session Data:
    const session = guildDoc.sessions[sessionId];
    if (!session) {
        console.warn(`Session with ID ${sessionId} not found.`);
        return [false, `Session with ID ${sessionId} not found.`];
    }

    // Ensure only allowed roles are updated
    if (!['Event Host', 'Training Crew'].includes(role)) {
        console.warn(`Invalid role "${role}" specified.`);
        return [false, `Invalid role "${role}" specified.`];
    }

    // Selected Event Host:
    if (role === 'Event Host') {
        // Confirm Available:
        if (session["host"] === null && !session["trainers"].includes(userId)) {
            session["host"] = userId;
        } else {
            return [false, `This position is already taken or you're already signed up!`];
        }
    }

    // Selected Training Crew:
    if (role === 'Training Crew') {
        // Confirm Available:
        if (session["trainers"].length <= 2 && !session["trainers"].includes(userId) && session["host"] != userId) {
            session["trainers"].push(userId);
        } else {
            return [false, `This position is already taken or you're already signed up!`];
        }
    }

    // Success - Apply changes to session data:
    await db.collection('guilds').doc(guildId).update({
        [`sessions.${sessionId}`]: session
    }).then(() => {
        if (global.outputDebug_InDepth) {console.log(`Session updated!`)}
    }).catch((error) => {
        console.error("Error updating session: ", error);
    });

    // Update Signup Message:
    await getRefreshedSignupMessage(guildId, guildDoc.sessionsSignup_MessageId)

    // Return results:
    return [true, session];
}

// Assign User Role withing Session:
async function removeUserFromSessionRole(guildId, sessionId, userId) {
    // Convert to strings:
    guildId = String(guildId); sessionId = String(sessionId); userId = String(userId)
    // Get Guild Data:
    let guildDoc = await db.collection('guilds').doc(guildId).get()
    if (!guildDoc.exists) {
        console.log(`{!} Guild with ID ${guildId} does not exist.`);
        return [false, `Guild with ID ${guildId} not found.`];
    } else { guildDoc = guildDoc.data() }
    // Get Session Data:
    const session = guildDoc.sessions[sessionId];
    if (!session) {
        console.warn(`Session with ID ${sessionId} not found.`);
        return [false, `Session with ID ${sessionId} not found.`];
    }
    // Remove User from Session:
    if (session["host"] === userId) {
        session["host"] = null;
    } else if (session["trainers"].includes(userId)) {
        session["trainers"] = session["trainers"].filter(trainer => trainer !== userId);
    } else {
        return [false, `User is not part of this session!`];
    }
    // Success - Apply changes to session data:
    await db.collection('guilds').doc(guildId).update({
        [`sessions.${sessionId}`]: session
    }).then(() => {
        if (global.outputDebug_InDepth) {console.log(`Session updated!`)}
    }).catch((error) => {
        console.error("Error updating session: ", error);
    });

    // Update Signup Message:
    await getRefreshedSignupMessage(guildId, guildDoc.sessionsSignup_MessageId)

    // Return results:
    return [true, session];
}

// Return Refreshed Session Signup Message / Edit Message if ID Provided:
async function getRefreshedSignupMessage(guildId, messageId) {
    // Discord.js:
    const { 
        ContainerBuilder, 
        SeparatorBuilder, 
        TextDisplayBuilder,
        ActionRowBuilder,
        ButtonBuilder,
        ButtonStyle,
        MessageFlags
    } = require('discord.js');

    // Get Guild Data:
    const guildDoc = await db.collection('guilds').doc(String(guildId)).get({ source: 'server' });
    if (!guildDoc.exists) { // Confirm Guild:
        console.log(`Guild with ID ${guildId} does not exist.`);
        return null, 'An Error Occured! (guild not found?)'
    }
    const guildData = guildDoc.data();
    const sessionSignUp_ChannelId = String(guildData.sessionSignUp_Channel);
    const sessionSignUp_MentionRoleIds = guildData.sessionSignUp_MentionRoles;
    const unsortedSessions = guildData.sessions;
    const guildSessions = Object.entries(unsortedSessions).sort((a, b) => a[1].date - b[1].date);

    // Debug:
    if(global.outputDebug_InDepth) {console.log('Guild Sessions:', guildSessions);}

    // Build Message Contents:
    const messageContent = async () => {
        const signupContainer = new ContainerBuilder();
        const seperator = new SeparatorBuilder();
        signupContainer.setAccentColor(0x9b42f5)

        signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('# 📅  __Session Signup__  📅'))
        signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Upcoming group sessions are listed below:`))

        signupContainer.addSeparatorComponents(seperator)

        // Apend each event to msg:
        for ([sessionId, sessionData] of guildSessions) {

            // Roles Data:
            const eventHostTaken = (sessionData['host'] != null);
            const eventTrainersCount = sessionData['trainers']?.length || 0;
            const trainersFull = (eventTrainersCount >= 3);
            const eventFull = (trainersFull && eventHostTaken)

            // Create updated feilds:
            const hostFieldValue = () => {
                return eventHostTaken
                ? '*`UNAVAILABLE ⛔️`* - *(1/1)* \n' + `> <@${sessionData['host']}>`
                : '*`AVAILABLE 🟢`* - *(0/1)*';
            };
            const trainersFieldValue = () => {
                const sessionTrainers = Array.isArray(sessionData['trainers']) ? sessionData['trainers'] : []
                return trainersFull
                ? '*`UNAVAILABLE ⛔️`* -' +  ` *(${eventTrainersCount}/3)* \n` + sessionTrainers.map(id => `> <@${id}>`).join('\n')
                : '*`AVAILABLE 🟢`* -' +  ` *(${eventTrainersCount}/3)* \n` + sessionTrainers.map(id => `> <@${id}>`).join('\n')
            }


            signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰  __Date:__  \n ### <t:${sessionData.date}:F> \n\n`)) // Date

            signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🎙️ __Event Host:__  \n ### ${hostFieldValue()} \n\n`)) // Host

            signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer

            signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🤝  __Trainer Crew:__  \n ### ${trainersFieldValue()}`)) // Trainers

            signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
            signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer

            // Check Capcity:
            let eventButtons;
            if(eventFull) { // Event Full - Hide Signup:
                eventButtons = new ActionRowBuilder().addComponents(	
                    new ButtonBuilder()
                        .setCustomId(`eventSignup:${sessionId}`)
                        .setLabel('❌ Event Full')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    
                    new ButtonBuilder()
                        .setLabel('🎮 Game Link')
                        .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                        .setStyle(ButtonStyle.Link)
                );
            } else { // Event NOT Full - Show Signup:
                eventButtons = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eventSignup:${sessionId}`)
                        .setLabel('📝 Sign Up')
                        .setStyle(ButtonStyle.Success),
                    
                    new ButtonBuilder()
                        .setLabel('🎮 Game Link')
                        .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                        .setStyle(ButtonStyle.Link)
                );
            }
            signupContainer.addActionRowComponents(eventButtons)

            signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
            signupContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer

            signupContainer.addSeparatorComponents(seperator)

        }

        return signupContainer // Return signupContainer message contents

    }
    
    

    // Edit Message by Id if provided:
    if(messageId){
        const announcementChannel = await global.client.channels.fetch(sessionSignUp_ChannelId);
        const message = await announcementChannel.messages.fetch(messageId);
        const messageContainer = await messageContent() 

        // Edit Original Message:
        await message.edit({
            flags: MessageFlags.IsComponentsV2,
            components : [messageContainer],
        }).catch((err) => {
            console.log('{!} Failed to Update Event Embed:');
            console.log(err);

        });
    } 

    // No message to edit - Return raw messgae contents:
    if(!messageId) { 
        const container = await messageContent() 
        return container // Return full message contents
    }

}


// Exports:
module.exports = {
	createSession,
    getSessions,
    assignUserSessionRole,
    removeUserFromSessionRole,
    getRefreshedSignupMessage
};
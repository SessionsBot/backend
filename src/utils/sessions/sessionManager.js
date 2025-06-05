// Imports:
const { db } = require('../firebase.js'); // Import Firebase
const global = require('../global.js'); // Import Global Variables


// Get All Sessions for a Guild:
async function getSessions(guildId) {
    const guildDoc = await db.collection('guilds').doc(String(guildId)).get();
    if (!guildDoc.exists) {
        console.log(`{!} Guild with ID ${guildId} does not exist.`);
        return {};
    }
    const sessionData = guildDoc.data().sessions || null;
    const guildData = guildDoc.data() || null;

    sessionData && (sessionData.guildData = guildData);

    return sessionData
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
                location: 'https://www.roblox.com/games/407106466/Munch-V1',
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
        return [false, `Session with ID ${sessionId} not found.`, guildDoc];
    }

    // Ensure only allowed roles are updated
    if (!['Session Host', 'Training Crew'].includes(role)) {
        console.warn(`Invalid role "${role}" specified.`);
        return [false, `Invalid role "${role}" specified.`, guildDoc];
    }

    // Selected Session Host:
    if (role === 'Session Host') {
        // Confirm Available:
        if (session["host"] === null && !session["trainers"].includes(userId)) {
            session["host"] = userId;
        } else {
            return [false, `This position is already taken or you're already signed up!`, guildDoc];
        }
    }

    // Selected Training Crew:
    if (role === 'Training Crew') {
        // Confirm Available:
        if (session["trainers"].length <= 2 && !session["trainers"].includes(userId) && session["host"] != userId) {
            session["trainers"].push(userId);
        } else {
            return [false, `This position is already taken or you're already signed up!`, guildDoc];
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
    return [true, session, guildDoc];
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
        return [false, `Session with ID ${sessionId} not found.`, guildDoc];
    }
    // Remove User from Session:
    if (session["host"] === userId) {
        session["host"] = null;
    } else if (session["trainers"].includes(userId)) {
        session["trainers"] = session["trainers"].filter(trainer => trainer !== userId);
    } else {
        return [false, `User is not part of this session!`, guildDoc];
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
    return [true, session, guildDoc];
}


// Returns Refreshed Session Signup Message / Edits Message if ID Provided:
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

    // Build Message Contents:
    const messageContent = async () => {
        const signupContainer = new ContainerBuilder();
        const seperator = new SeparatorBuilder();
        signupContainer.setAccentColor(0x9b42f5)

        // Title & Desc:
        signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('# 📅  __Session Signup__  📅 \n-# Upcoming group sessions are listed below:'))
        // Spacer:
        signupContainer.addSeparatorComponents(seperator) 

        // Apend each session to msg:
        for ([sessionId, sessionData] of guildSessions) {

            // Roles Data:
            const sessionHostTaken = (sessionData['host'] != null);
            const sessionTrainersCount = sessionData['trainers']?.length || 0;
            const trainersFull = (sessionTrainersCount >= 3);
            const sessionFull = (trainersFull && sessionHostTaken)

            // Create updated feilds:
            const hostFieldValue = async () => {
                return sessionHostTaken
                ? '### **[🎙️] Session Host : *`UNAVAILABLE ⛔️`*** *(1/1)* \n' + ` > <@${sessionData['host']}> \n`
                : '### **[🎙️] Session Host : *`AVAILABLE 🟢`*** *(0/1)* \n'  + ` > *@AVAILABLE* \n`
            };

            const trainersFieldValue = async () => {
                const sessionTrainers = Array.isArray(sessionData['trainers']) ? sessionData['trainers'] : []
                if(sessionTrainers.length === 0) {return '### **[ 🤝 ] Trainer Crew : *`AVAILABLE 🟢`***' +  ` *(0/3)* \n` + ` > *@AVAILABLE*  \n`}
                return trainersFull
                ? '### **[ 🤝 ] Trainer Crew : *`UNAVAILABLE ⛔️`***' +  ` *(${sessionTrainersCount}/3)* \n` + sessionTrainers.map(id => `> <@${id}>`).join('\n')
                : '### **[ 🤝 ] Trainer Crew : *`AVAILABLE 🟢`***' +  ` *(${sessionTrainersCount}/3)* \n` + sessionTrainers.map(id => `> <@${id}>`).join('\n')
            }

            let sessionButtons = async () => {
                if(sessionFull) { // Session Full - Hide Signup:
                    return new ActionRowBuilder().addComponents(	
                        new ButtonBuilder()
                            .setCustomId(`sessionSignup:${sessionId}`)
                            .setEmoji('⛔️')
                            .setLabel('Session Full')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        
                        new ButtonBuilder()
                            .setEmoji('🎯')
                            .setLabel('Game Link')
                            .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                            .setStyle(ButtonStyle.Link)
                    );
                } else { // Session NOT Full - Show Signup:
                    return new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`sessionSignup:${sessionId}`)
                            .setEmoji('📝')
                            .setLabel('Sign Up')
                            .setStyle(ButtonStyle.Success),
                        
                        new ButtonBuilder()
                            .setEmoji('🎯')
                            .setLabel('Game Link')
                            .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                            .setStyle(ButtonStyle.Link)
                    );
                }
            }

            // Session Text Content:
            let sessionTextContent = '';
            // Session Date:
            sessionTextContent += `### **[ ⏰ ] <t:${sessionData['date']}:F>** \n > <t:${sessionData['date']}:R> \n` 
            // Session Host:
            sessionTextContent += await hostFieldValue()
            // Session Trainers:
            sessionTextContent += await trainersFieldValue()

            // Append text to container:
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
        if(Array.isArray(sessionSignUp_MentionRoleIds) && sessionSignUp_MentionRoleIds.length >= 1) {
            let mentionString = '🔔: '
            for (const roleId of sessionSignUp_MentionRoleIds) {
                mentionString += `<@&${roleId}> `
            }
            signupContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${mentionString}`))
        }

        return signupContainer // Return signupContainer message contents

    }
    
    

    // Edit Message by Id if provided:
    if(messageId){
        const signupChannelId = guildData['sessionSignup']['signupChannelId']
        const signupChannel = await global.client.channels.fetch();
        const message = await signupChannel.messages.fetch(messageId);
        const messageContainer = await messageContent() 

        // Edit Original Message:
        await message.edit({
            flags: MessageFlags.IsComponentsV2,
            components : [messageContainer],
        }).catch((err) => {
            console.log('{!} Failed to Update Session Embed:');
            console.log(err);

        });

        return true
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
    getRefreshedSignupMessage,
};
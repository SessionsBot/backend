const fs = require('fs').promises;
const path = require('path');

const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js'); // Import Discord.js
const { isArray } = require('util');

const global = require('../../global.js') // Import Global Variables

const sessionsFilePath = path.join(__dirname, '..', '..', 'data', 'sessions.json');

// Reads all session data and returns
async function readSessions() {
	try {
		const data = await fs.readFile(sessionsFilePath, 'utf8');
		return JSON.parse(data || '{}');
	} catch (err) {
		if (err.code === 'ENOENT') return {}; // File doesn't exist yet
		throw err;
	}
}

// Saves over ALL session data (writeSessions({}) clears all sessions)
async function writeSessions(sessions) {
	await fs.writeFile(sessionsFilePath, JSON.stringify(sessions, null, 2));
}

// Add or update a session's data:
async function saveSession(sessionId, sessionData) {
	const sessions = await readSessions();
	sessions[sessionId] = sessionData;
	await writeSessions(sessions);
}

// Update a session's role assignment => returns session data:
async function updateSessionRole(sessionId, role, newUserId) {
	const sessions = await readSessions();
	const session = sessions[sessionId];

	// Confirm session found:
	if (!session) { 
		console.warn(`Session with ID ${sessionId} not found.`) 
		return [false, `Session with ID ${sessionId} not found.`]
	};
	
	// Ensure only allowed roles are updated
	if (!['Event Host', 'Training Crew'].includes(role)) {
		console.warn(`Invalid role "${role}" specified.`);
		return [false, `Invalid role "${role}" specified.`]
	}

	// Selected Event Host:
	if (role === 'Event Host') {
		// Confirm Available:
		if(session["host"] === null && !session["trainers"].includes(newUserId)) {
			session["host"] = newUserId;
		}else {
			return [false, `This position is already taken or you're already signed up!`]
		}
		
	}

	// Selected Training Crew:
	if (role === 'Training Crew') {
		// Confirm Available:
		if (session["trainers"].length <= 2 && !session["trainers"].includes(newUserId) && session["host"] != newUserId) {
			session["trainers"].push(newUserId);
		}else {
			return [false, `This position is already taken or you're already signed up!`]
		}
	}

	// Success - Apply changes to session data:
	await writeSessions(sessions);
	return [true, session]
}

// Remove a player from a session by userId:
async function removePlayerFromEventById(sessionId, playerId) {
	const sessions = await readSessions();
	const session = sessions[sessionId];

	// Confirm session found:
	if (!session) { 
		// Session not found:
		console.warn(`Session with ID ${sessionId} not found.`) 
		return [false, `Session with ID ${sessionId} not found.`]
	};

	// Confirm player assigned session:
	if(session["host"] != playerId &&  !session["trainers"].includes(playerId)){
		// Player not in session:
			console.log('USER NOT ASSIGNED SESSION!')
		return [false, `You are not assigned to this session!`]
	}

	// Check if player is host:
	if(session["host"] === playerId) {
		session['host'] = null;
		// Send Changes:
		await writeSessions(sessions);
	}

	// Check if player is training crew:
	if (session["trainers"].includes(playerId)) {
		const trainerIndex = session["trainers"].findIndex(id => id === playerId)
		session["trainers"].splice(trainerIndex, 1)
		// Send Changes:
		await writeSessions(sessions);
	}

	// Success - Return:
	await refreshEventMessage(sessionId) // Update Event Message
	return [true, session]
}

// Remove a session by Id:
async function deleteSession(sessionId) {
	const sessions = await readSessions();
	delete sessions[sessionId];
	await writeSessions(sessions);
}

// Get a single session by Id and returns:
async function getSession(sessionId) {
	const sessions = await readSessions();
	return sessions[sessionId];
}

// Calculate time difference from session date:
async function calculateSessionTimeDifference(sessionTimestamp) {
	const sessionUTCDate = sessionTimestamp * 1000;
	const nowUTCDate = new Date().getTime();
	const secondsDifference = (sessionUTCDate - nowUTCDate) / 1000;
	const minuetsDifference = (secondsDifference / 60);
	const hoursDifference = (minuetsDifference / 60);
	const daysDifference = (minuetsDifference / 24);
	return {
		seconds: secondsDifference,
		hours: hoursDifference,
		days: daysDifference,
	}
}

// Refresh an event announcement msg by sessionId:
async function refreshEventMessage(sessionId) {
	// Get session data:
	const client = global.client
	const sessionData = await getSession(sessionId)
	if(!sessionData) {return console.warn(`Couldn't get session data for message refresh!`)}

	// Fetch original message:
	const channel = await client.channels.fetch(sessionData['channelId']);
	const message = await channel.messages.fetch(sessionData['messageId']);

	// Send Message:
	await message.edit(await getEventEmbed(sessionId));

}

// [V.2] Returns an event embed using data from sessionId:
async function getEventEmbed(sessionId) {
	// Get session data:
	const client = global.client
	const sessionData = await getSession(sessionId)
	if(!sessionData || Object.keys(sessionData).length === 0) {return console.warn(`Couldn't get session data for embed!`)}

	// Roles Data:
	const eventHostTaken = (sessionData['host'] != null);
	const eventTrainersCount = sessionData['trainers'].length;
	const trainersFull = (eventTrainersCount >= 3);
	const eventFull = (trainersFull && eventHostTaken)

	// Create updated feilds:
	const hostFieldValue = () => {
  		return eventHostTaken
    	? '*`FULL ⛔️`* - *(1/1)* \n' + `> <@${sessionData['host']}>`
    	: '*`AVAILABLE 🟢`* - *(0/1)*';
	};
	const trainersFieldValue = () => {
		return trainersFull
		? '*`FULL ⛔️`* -' +  ` *(${eventTrainersCount}/3)* \n` + sessionData['trainers'].map(id => `> <@${id}>`).join('\n')
		: '*`AVAILABLE 🟢`* -' +  ` *(${eventTrainersCount}/3)* \n` + sessionData['trainers'].map(id => `> <@${id}>`).join('\n')
	}
	const spacerField = { name: ' ', value: '----------------------------\n\n' };

	// Create updated embed:
	const updatedEmbed = new EmbedBuilder()
		.setColor(global.colors.success)
		.setTitle('**📋 Training Session 📋**')
		.addFields( 
			spacerField, // Spacer
			{ name: '**📆  |  Date:**', value: `<t:${sessionData['date']}:F>\n(<t:${sessionData['date']}:R>)` },
			spacerField, // Spacer
			{ name: '**📍|  Location:**', value: `[Event Game](${sessionData['location']})`, inline: true },
			spacerField, // Spacer
			{ name: '**🎙️ |  Event Host:**', value: hostFieldValue() }, 
			spacerField, // Spacer
			{ name: '**🤝  |  Trainers:**', value: trainersFieldValue() }, 
			spacerField, // Spacer
		)
		.setFooter({ text: `id: ${sessionId.toUpperCase()}`, iconURL: client.user.displayAvatarURL() });
	
	// Create Message Buttons:
	let buttons;
	if(eventFull) { // Event Full - Hide Signup:
		buttons = new ActionRowBuilder().addComponents(	
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
		buttons = new ActionRowBuilder().addComponents(
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
      
	// Return message content:
	return {
		embeds: [updatedEmbed],
		components: [buttons],
		content: `<@&${global.event_mentionRoleId}>`
	};
}

// Module Exports:
module.exports = {
	readSessions,
	writeSessions,
	saveSession,
	deleteSession,
	getSession,
	updateSessionRole,
	refreshEventMessage,
	removePlayerFromEventById,
	getEventEmbed
};

const fs = require('fs').promises;
const path = require('path');

const {
    EmbedBuilder,  
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js'); // Import Discord.js

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

	// Apply changes to session data:
	await writeSessions(sessions);

	// (!) Debug - DELETE ME LATER (!)
	console.log('✅ Updated Session:')
	console.log(session)

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


// Fully refresh an event embed by ID:
async function refreshEventMessage(sessionId, client) {
	// Get session data:
	const sessionData = await getSession(sessionId)
	if(!sessionData) {return console.warn(`Couldn't get session data for message refresh!`)}

	console.log('ATTEMPTING MESSAGE UPDATE W DATA:')
	console.log(sessionData)

	// Fetch original message:
	const channel = await client.channels.fetch(sessionData['channelId']);
	const message = await channel.messages.fetch(sessionData['messageId']);

	// Create updated embed
	const updatedEmbed = new EmbedBuilder()
		.setColor('#9BE75B')
		.setTitle('📋 - Training Session')
		.addFields( // Spacer
			{ name: ' ', value: ' ' }
		)
		.addFields(
			{ name: '📆 Date:', value: `<t:${sessionData['date']}:F>\n(<t:${sessionData['date']}:R>)`, inline: true },
			{ name: '📍 Location:', value: `[Event Game](${sessionData['location']})`, inline: true }
		)
		.addFields( // Spacer
			{ name: ' ', value: ' ' }
		)
		.addFields(
			{ name: '🎙️ Host:', value: sessionData['host'] ? '> ' + `<@${sessionData['host']}>` : '*`Available`* \n *(0/1)*', inline: true },
			{ 
				name: '🤝 Trainers:', 
				value: sessionData['trainers'].length > 0 
				  ? sessionData['trainers'].map(id => `<@${id}>`).join('\n') 
				  : '*`Available`* \n *(0/3)*', 
				inline: true 
			  }
			  
		)          
		.addFields( // Spacer
			{ name: ' ', value: ' ' }
		)
		.setFooter({ text: `ID: ${sessionId.toUpperCase()}`, iconURL: client.user.displayAvatarURL() });
	
	const buttons = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`eventSignup:${sessionId}`)
			.setLabel('📝 Sign Up')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setLabel('🎮 Game Link')
			.setURL(session.location || 'https://roblox.com') // fallback if null
			.setStyle(ButtonStyle.Link)
	);
      

	await message.edit({
		embeds: [updatedEmbed],
		components: [buttons]
	});

}

// Module Exports:
module.exports = {
	readSessions,
	writeSessions,
	saveSession,
	deleteSession,
	getSession,
	updateSessionRole,
	refreshEventMessage
};

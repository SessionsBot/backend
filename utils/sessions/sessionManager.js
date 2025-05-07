const fs = require('fs').promises;
const path = require('path');

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
		return false, `Session with ID ${sessionId} not found.`
	};
	
	// Ensure only allowed roles are updated
	if (!['Event Host', 'Training Crew'].includes(role)) {
		console.warn(`Invalid role "${role}" specified.`);
		return false, `Invalid role "${role}" specified.`
	}

	// Selected Event Host:
	if (role === 'Event Host') {
		// Confirm Available:
		if(session["host"] === null) {
			session["host"] = newUserId;
		}else {
			return false, `This position is already taken!`
		}
		
	}

	// Selected Training Crew:
	if (role === 'Training Crew') {
		if (session["trainers"].length <= 2 && !session["trainers"].includes(newUserId)) {
			session["trainers"].push(newUserId);
		}else {
			return false, `This position is already taken!`
		}
	}

	// Apply changes to session data:
	await writeSessions(sessions);

	// (!) Debug - DELETE ME LATER (!)
	console.log('✅ Updated Session:')
	console.log(session)

	return true, session
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



// Module Exports:
module.exports = {
	readSessions,
	writeSessions,
	saveSession,
	deleteSession,
	getSession,
	updateSessionRole
};

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
	if (!session) throw new Error(`Session with ID ${sessionId} not found.`);
	
	// Ensure only allowed roles are updated
	if (!['host', 'trainer'].includes(role)) {
		throw new Error(`Invalid role "${role}" specified.`);
	}

	// Selected Event Host:
	if (role === 'Event Host') {
		session[host] = newUserId;
	}

	// Selected Training Crew:
	if (role === 'Training Crew') {
		session[trainers] = session[trainers].push(newUserId)
	}

	// Apply changes to session data:
	await writeSessions(sessions);
	return session
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

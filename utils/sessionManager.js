const fs = require('fs').promises;
const path = require('path');

const sessionsFilePath = path.join(__dirname, '../data/sessions.json');

// Helper to read all sessions
async function readSessions() {
	try {
		const data = await fs.readFile(sessionsFilePath, 'utf8');
		return JSON.parse(data || '{}');
	} catch (err) {
		if (err.code === 'ENOENT') return {}; // File doesn't exist yet
		throw err;
	}
}

// Helper to save all sessions
async function writeSessions(sessions) {
	await fs.writeFile(sessionsFilePath, JSON.stringify(sessions, null, 2));
}

// Add or update a session
async function saveSession(sessionId, sessionData) {
	const sessions = await readSessions();
	sessions[sessionId] = sessionData;
	await writeSessions(sessions);
}

// Update a session's role assignment:
async function updateSessionRole(sessionId, role, newUserId) {
	const sessions = await readSessions();
	const session = sessions[sessionId];

	if (!session) throw new Error(`Session with ID ${sessionId} not found.`);
	
	// Ensure only allowed roles are updated
	if (!['host', 'assistant'].includes(role)) {
		throw new Error(`Invalid role "${role}" specified.`);
	}

	session[role] = newUserId;
	await writeSessions(sessions);
}


// Remove a session
async function deleteSession(sessionId) {
	const sessions = await readSessions();
	delete sessions[sessionId];
	await writeSessions(sessions);
}

// Get a single session by ID
async function getSession(sessionId) {
	const sessions = await readSessions();
	return sessions[sessionId];
}

module.exports = {
	readSessions,
	writeSessions,
	saveSession,
	deleteSession,
	getSession
};

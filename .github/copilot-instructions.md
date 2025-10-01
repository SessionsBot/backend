# Copilot Instructions for SessionsBot Backend

## Project Overview
- **Purpose:** Backend for SessionsBot, a Discord bot for managing group sessions, events, and session-RSVP/Role-based signups.
- **Tech Stack:** Node.js, Express, Firebase, Discord.js, REST API (JWT authentication).
- **Major Components:**
  - `src/commands/`: Discord bot commands (general, sessions)
  - `src/events/`: Discord event handlers
  - `src/buttons/`: Discord button interactions
  - `src/utils/`: Shared utilities (Firebase, logging, scheduling)
  - `src/webService/`: Web API and service logic
    - `api/V2/endpoints/`: REST API endpoints (guilds, sessions, users, system)
    - `api/V2/docs/`: API documentation (YAML, markdown)

## Key Patterns & Conventions
- **Command/Event Structure:**
  - Each command/event is a separate JS file, grouped by feature.
  - Use Discord.js interaction objects for all bot actions.
- **API Design:**
  - REST endpoints are versioned under `api/V2/endpoints/`.
  - Auth via JWT; user/guild verification helpers in `api/V2/utils/`.
- **Firebase Integration:**
  - All persistent data is managed via Firebase (see `src/utils/firebase.js`).
- **Logging:**
  - Centralized logging in `src/utils/logs/`.
- **Scheduling:**
  - Session/event scheduling logic in `src/utils/scheduleManager.js`.

## Developer Workflows
- **Start Bot:**
  - Run `node index.js` from project root.
- **API Server:**
  - Web service entry: `src/webService/webService.js`.
- **Testing:**
  - No standard test runner; manual testing via Discord and API endpoints.
- **Secrets:**
  - Service account keys in `private/serviceAccountKey.json` (never commit real secrets).

## Integration Points
- **Discord:**
  - All bot logic uses Discord.js; commands/events interact with Discord API.
- **Firebase:**
  - Used for user/session/guild data storage.
- **Web Dashboard:**
  - Communicates via REST API endpoints in `src/webService/api/V2/endpoints/`.

## Examples
- **Add a new command:** Place JS file in `src/commands/[category]/`, export a handler function.
- **Add an API endpoint:** Create file in `src/webService/api/V2/endpoints/[resource]/`, follow existing Express route pattern.
- **Use Firebase:** Import from `src/utils/firebase.js`.

---

For questions about unclear patterns or missing documentation, ask for feedback and iterate on this file.

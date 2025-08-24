import fs from 'fs';
import path from 'path';
// Get package.json data:
const pkgPath = path.resolve('./package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

export default {
    botVersion: pkg.version,
    frontend_Url: 'https://sessionsbot.fyi',
    outputDebug_General: true,
    outputDebug_InDepth: false,
    /** Main Discord Bot Client for SessionsBot */
    client: null,
    colors: {
        success: '#6dc441', // green
        error: '#d43f37', // red
        warning: '#fc9d03', // yellow/orange
        blue: '#4287f5',
        purple: '#9b42f5',
    },
    emojis: {
        sessionsWText: '<:sessionsWText:1381323876176236575>',
        sessions: '<:sessions:1381324009337258056>',
    }
}
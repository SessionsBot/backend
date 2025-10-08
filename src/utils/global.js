import fs from 'fs';
import path from 'path';
// Get package.json data:
const pkgPath = path.resolve('./package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const global = {
    botVersion: pkg.version,
    frontend_Url: 'https://sessionsbot.fyi',
    botInvite_Url: 'https://invite.sessionsbot.fyi',
    supportServerInvite_Url: 'https://discord.gg/dKp5HZPjCg',
    outputDebug_General: true,
    outputDebug_InDepth: false,
    /** Main Discord Bot Client for SessionsBot 
     * @type { import('discord.js').Client }
    */
    client: null,
    colors: {
        success: '#6dc441',
        error: '#d43f37', 
        warning: '#fc8c03',
        yellow: '#e3f542ff',
        blue: '#4287f5',
        purple: '#9b42f5',
        gray: '#585858'
    },
    /** Returns a converted 0x hex color number from a provided global color
     * @param {'success'|'error'|'yellow'|'warning'|'blue'|'purple'|'gray'} colorName
     */
    getOxColor: (colorName) => {
        const reqColor = global.colors?.[colorName]
        const convertedColor = Number(reqColor.replace('#', "0x"));
        return convertedColor
    },
    emojis: {
        sessionsWText: '<:sessionsWText:1381323876176236575>',
        sessions: '<:sessions:1381324009337258056>',
    },
    cmdStrings: {
        mySessions: '</my-sessions:1375234577412653199>',
        myNotifications: '</my-notifications:1410361146082463818>',
    }
}

export default global
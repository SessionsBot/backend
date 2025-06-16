// ----------------------------------[ Imports ]---------------------------------- \\

const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const global = require('../utils/global.js')
const {admin} = require('../utils/firebase')

// Secure Variables:
require('dotenv').config();
const CLIENT_ID = process.env['CLIENT_ID']
const CLIENT_SECRET = process.env['CLIENT_SECRET']
const JSON_SECRET = process.env['JSON_WEBTOKEN_SECRET'];
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/api/login/discord-redirect'; // Must match registered Discord redirect


// ----------------------------------[ Verifying Tokens: ]---------------------------------- \\

function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JSON_WEBTOKEN_SECRET);
        req.user = decoded; // Attach user to request
        next(); // Allow request
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'TokenExpired' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(422).json({ error: 'InvalidToken' });
        }
        return res.status(500).json({ error: 'Unknown token error' });
    }
};

// ----------------------------------[ App Routes: ]---------------------------------- \\

// [Verify/Confirm Auth] - Secure Access:
router.post('/secure-action', verifyToken, (req, res) => {
    const userData = req?.user;
    const username = userData?.username;
    const userId = userData?.id
    const displayName = userData?.displayName;
    const { actionType, data } = req.body; // extract frontend request data

    // ! Debugging: (Switch to In Depth Later...)
    if(global.outputDebug_General){
        console.log(`--------------[!Secure Action!]-----------------`);
        console.log(`Username: ${username}`)
        console.log(`Action: ${actionType}`)
        console.log(`Request Body: ${req.body}`)
        console.log(`------------------------------------------------`);
    }

    // Deleting Events:
    if (actionType === 'DELETE_EVENT') {
        // do some secure deletion logic
        return res.status(204).json({ message: `Deleted event for user ${user.username}` });
    }

    // Unknown Action:
    return res.status(422).json({error: `Unknown action provided in request body`})
});


// [Begin/Login Auth] - Discord Redirect:
router.get('/login/discord-redirect', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    // If error provided from Discord redirect:
    if (error || !code) {
        console.error('Error during redirect process:', error, 'Code provided:', code);
        // Redirect to Homepage:
        return res.redirect(global.frontend_Url)
    }

    // Attempt retrieval of Discord user credentials using code:
    try {
        // Step 1: Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: REDIRECT_URI,
            scope: 'identify guilds'
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const accessToken = tokenResponse.data.access_token;

        // Step 2: Fetch user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const userData = userResponse.data;
        const userDiscordId = userData?.id
        // console.log('User Info:', userData);
        console.log(`[ i ] User Authenticated: ${userData?.username}`);

        // Step 3: Fetch user guilds
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const guilds = guildsResponse.data;
        const allGuildsIds = guilds.map(g => (g.id));

        // Step 4. Filter guilds where user has manage or admin permissions
        const manageableGuilds = guilds.filter(guild => {
            const permissions = BigInt(guild.permissions_new ?? guild.permissions); 
            return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });
        // Get all managable guilds data as array:
        const manageableGuildsIds = manageableGuilds.map(g => (g.id));
        const manageableGuildsData = manageableGuilds.map(g => ({
            id: g.id,
            name: g.name,
            icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
            permissions: g.permissions
        }));

        // Step 5. Create Firebase Auth Token for User:
        const generatedFirebaseToken = await admin.auth().createCustomToken(userDiscordId, {
            allGuilds: allGuildsIds,
            manageableGuilds: manageableGuildsIds 
        });

        // Step 6. Prepair Data for Sending to Frontend
        const userToSend = {
            id: userData?.id,
            username: userData?.username,
            displayName: userData?.global_name,
            accentColor: userData?.accent_color,
            avatar: userData?.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            banner: userData?.banner ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png` : null,
            manageableGuilds: manageableGuildsData,
            firebaseToken: generatedFirebaseToken
        };

        // Step 7. Create Secure JSON Token:
        const token = jwt.sign(userToSend, JSON_SECRET, { expiresIn: '7d' }); // expires in 7 days

        // Step 8. Redirect User back to Frontend w/ token:
        res.redirect(`${global.frontend_Url}/api/sign-in/discord-redirect?token=${token}`);

    } catch (err) {
        // Error Occured - OAuth2 process:
        console.error('Error during OAuth2 process:', err.response?.data || err.message);
        // Redirect to Homepage:
        return res.redirect(global.frontend_Url)
    }
});


// [Discord API/Info] - Get Guild Info:
router.get('/discord/guild', async (req, res) => {
    const botToken = process.env['BOT_TOKEN'];
    const guildId = req.query.guildId;
    // Confirm Guild Id:
    if (!guildId) {
        return res.status(400).json({ error: 'Guild ID is required' });
    }
    
    // Make Discord API Request:
    const discordReq = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: {
            Authorization: `Bot ${botToken}`,
        },
    });

    // Check for Errors:
    if (!discordReq.ok) {
        console.error('Failed to fetch guild data:', guildData);
        return res.status(discordReq.status).json({ error: guildData.message || 'Failed to fetch guild data' });
    }

    const guildData = await discordReq.json();

    // Return Guild Data:
    res.json({ 
        data: guildData, // <-- Full JSON response from Discord API
        guildIcon: guildData.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png` : null,
        guildBanner: guildData.banner ? `https://cdn.discordapp.com/banners/${guildId}/${guildData.banner}.png` : null
    });

});

// ----------------------------------[ Exports: ]---------------------------------- \\
module.exports = router;
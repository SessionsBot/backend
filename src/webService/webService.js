// HTTP server:
const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();
const botToken = process.env['BOT_TOKEN']

// Replace with your real values:
const CLIENT_ID = process.env['CLIENT_ID']
const CLIENT_SECRET = process.env['CLIENT_SECRET']
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/dashboard/login/discord-redirect'; // Make sure this matches your registered Discord redirect

// Connect to Folder:
app.use(express.static('webService')) 

// Root/Status Respond:
app.get('/', (req, res) => res.status(200).json({ response: 'Root Directory: ALIVE', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));
app.get('/status', (req, res) => res.status(200).json({ response: 'Bot is operational!', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));


app.get('/dashboard/login/discord-redirect', async (req, res) => {
    const code = req.query.code;
    const error = req.query.error;

    if (error) {
        // Show error response:
        return res.sendFile(__dirname + '/html/errorLinkingAccount.html');
    }

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
        console.log('User Info:', userData);
        

        // Step 3: Fetch user guilds
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;

        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const guilds = guildsResponse.data;
        console.log('Guilds:', guilds);


        // Step 4. Filter for guilds where the user has 'manage server' or 'admin' permissions
        const manageableGuilds = guilds.filter(guild => {
        const permissions = BigInt(guild.permissions_new ?? guild.permissions); 
        return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });
        const manageableGuildIDs = manageableGuilds.map(g => g.id);

        // Step 5. Prepair Data for Sending to Frontend
        const userToSend = {
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`,
            guilds: manageableGuildIDs
        };

        // Step 6. Encode the user data in base64 to make it URL-safe
        const encoded = encodeURIComponent(Buffer.from(JSON.stringify(userToSend)).toString('base64'));

        // Step 7. Redirect User back to Frontend:
        res.redirect(`https://painful-peri-sessions-bot-web-app-868faa41.koyeb.app/api/login-redirect?user=${encoded}`);



    } catch (err) {
        console.error('Error during OAuth2 process:', err.response?.data || err.message);
        return res.sendFile(__dirname + '/html/errorLinkingAccount.html');
    }
});


// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
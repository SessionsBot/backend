// HTTP server:
const express = require('express');
const axios = require('axios');
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const JSON_SECRET = process.env['JSON_WEBTOKEN_SECRET'];

// Replace with your real values:
const CLIENT_ID = process.env['CLIENT_ID']
const CLIENT_SECRET = process.env['CLIENT_SECRET']
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/dashboard/login/discord-redirect'; // Make sure this matches your registered Discord redirect

// Connect to Folder:
app.use(express.static('webService')) 

// Root/Status Respond:
app.get('/', (req, res) => res.status(200).json({ response: 'Root Directory: ALIVE', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));
app.get('/status', (req, res) => res.status(200).json({ response: 'Bot is operational!', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));


// Discord Login - Begin Auth:
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
        // console.log('Guilds:', guilds);


        // Step 4. Filter guilds where user has manage or admin permissions
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

        // Step 6. Create Secure JSON Token:
        const token = jwt.sign(userData, JSON_SECRET, { expiresIn: '7d' }); // expires in 7 days

        // Step 7. Encode the user data / URL-safe:
        const encoded = encodeURIComponent(Buffer.from(JSON.stringify(userToSend)).toString('base64'));

        // Step 8. Redirect User back to Frontend:
        res.redirect(`https://sessionsbot.fyi/api/login-redirect?user=${encoded}&token=${token}`);



    } catch (err) {
        console.error('Error during OAuth2 process:', err.response?.data || err.message);
        return res.sendFile(__dirname + '/html/errorLinkingAccount.html');
    }
});

// Verify Auth - Secure Access:
app.post('/api/secure-action', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const user = jwt.verify(token, JSON_SECRET);
    // user = your decoded Discord user info
    // Do permission checks etc.
    res.json({ message: 'Secure action done!', user });
  } catch (e) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
});

// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
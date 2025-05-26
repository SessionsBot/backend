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

// Session Data Fetch:
app.get('/sessions/data', async (req, res) => {

    // Get Session Data:
    const allSessionsData = await require('../utils/sessions/sessionManager').readSessions()

    // Data Undefined:
    if(!allSessionsData){ res.status(500).json({response: '"allSessionsData" NOT FOUND!', code: 500}); return }

    // Data Found - Send JSON:
    const prettyJSON = JSON.stringify({ data: allSessionsData, code: 200 }, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(prettyJSON);
})





app.get('/dashboard/login/discord-redirect', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('Missing code in query.');
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

        console.log('User Info:', userResponse.data);

        // Step 3: Fetch user guilds
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        console.log('Guilds:', guildsResponse.data);

        // res.send('Logged in with Discord! You can now close this tab.');
        // Send loading page:
        res.sendFile(__dirname + '/html/loading.html');

    } catch (err) {
        console.error('Error during OAuth2 process:', err.response?.data || err.message);
        res.status(500).send('OAuth2 login failed.');
    }
});


// Dashboard - Discord Login Redirect:
// app.get('/dashboard/login/discord-redirect', async (req, res) => {
//     const code = req.query.code;
//     if(!code){return res.status(404).send('Error 404 - Code not received/found!')}

//     res.send('Discord Login Redirect Received - \n Code: ', code)

//     console.log('DISCORD LOGIN REDIRECT - CODE RECEIVED:')
//     console.log(code)
// })

// Visit Dashboard:
app.get('/dashboard', async (req, res) => {
    // Get Request:
    const dashboardSecretProvided = req.query.DASHBOARD_SECRET || null
    const dashboardSecretRequired = await process.env['DASHBOARD_SECRET']
    // Confirm Secret Provided:
    if (!dashboardSecretProvided ) { // Access Denied:
        return res.status(401).send("Access Denied - No Secret Provided")
    }
    // Confirm Correct Secret 
    if (dashboardSecretProvided != dashboardSecretRequired) {
        return res.status(401).send("Access Denied - Incorrect Secret")
    }else { // Access Granted:
        res.sendFile(__dirname + '/src/html/dashboard.html')
    }
})


// Dashboard - Discord Login Redirect:
// app.get('/dashboard/login/discord-redirect', async (req, res) => {
//     const code = req.query.code;
//     if(!code){return res.status(404).send('Error 404 - Code not received/found!')}

//     res.send('Discord Login Redirect Received - \n Code: ', code)

//     console.log('DISCORD LOGIN REDIRECT - CODE RECEIVED:')
//     console.log(code)
// })


// Test loading page send:
app.get('/loading', async (req, res) => {

        res.sendFile(__dirname + '/html/loading.html');

})


// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
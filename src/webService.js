// HTTP server:
const express = require('express');
const app = express();

// Connect to Folder:
app.use(express.static('web_service')) 

// Root/Status Respond:
app.get('/', (req, res) => res.status(200).json({ response: 'Root Directory: ALIVE', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));
app.get('/status', (req, res) => res.status(200).json({ response: 'Bot is operational!', code: 200, timestamp: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }) }));

// Session Data Fetch:
app.get('/sessions/data', async (req, res) => {

    // Get Session Data:
    const allSessionsData = await require('./utils/sessions/sessionManager').readSessions()

    // Data Undefined:
    if(!allSessionsData){ res.status(500).json({response: '"allSessionsData" NOT FOUND!', code: 500}); return }

    // Data Found - Send JSON:
    const prettyJSON = JSON.stringify({ data: allSessionsData, code: 200 }, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(prettyJSON);
})

// Visit Dashboard:
app.get('/dashboard', async (req, res) => {
    // Get Request:
    const dashboardSecretProvided = req.query.DASHBOARD_SECRET || null
    const dashboardSecretRequired = await process.env[['DASHBOARD_SECRET']]
    // Confirm Secret Provided:
    if (!dashboardSecretProvided ) { // Access Denied:
        res.status(401).send("Access Denied - No Secret Provided")
    }
    // Confirm Correct Secret 
    if (dashboardSecretProvided != dashboardSecretRequired) {
        res.status(401).send("Access Denied - Incorrect Secret")
    }else { // Access Granted:
        res.sendFile(__dirname + '/src/html/dashboard.html')
    }
})

// Initialize:
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[🌐 Web Server]: Alive - Running on port ${PORT}`);
});
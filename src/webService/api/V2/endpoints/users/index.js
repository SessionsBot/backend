//------------------------------------------[ Imports ]------------------------------------------\\
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { default: axios, HttpStatusCode } = require('axios');
const responder = require('../../utils/responder');
const { frontend_Url } = require('../../../../../utils/global');
const verifyToken = require('../../utils/verifyToken');
const { admin, auth } = require('../../../../../utils/firebase');
const { Response } = require('express');


// Secure Variables:
const CLIENT_ID = process.env['CLIENT_ID'];
const BOT_TOKEN = process.env['BOT_TOKEN'];
const CLIENT_SECRET = process.env['CLIENT_SECRET'];
const JSON_SECRET = process.env['JSON_WEBTOKEN_SECRET'];
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/api/v2/users/auth/discord'; // Must match registered Discord redirect


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid user id or endpoint', HttpStatusCode.BadRequest);
})

// Discord oAuth2 - /api/v2/users/auth/discord
router.get('/auth/discord', async (req, res) => {
    /* Steps:
      1. The req is called AFTER the user accepts oAuth from Discord site.
      2. Discord sends user to backend(here) to retrieve any server/API data.
      3a. If success, Redirect user to frontend with JSON Web/Auth token containing user data.
      3b. If failed, redirect back to 'Failed sign in' page on frontend.
    */

    // Get req query:
    const code = req.query.code;
    const error = req.query.error;

    // Auth frontend redirects:
    const redirects = {
        /** _Sign in failed:_ Send user back to frontend to page notifying of failed attempt.
        * @param {Response} res Response object from initial API call.
        */
        redirectAuthError : (res) => {res.redirect(`${frontend_Url}/api/sign-in/discord-redirect?failed=true`)},

        /** _Sign in success:_ Send user back to frontend with user token/data.
        * @param {Response} res Response object from initial API call.
        * @param {JsonWebKey} token Generated auth token to assign user within app.
        */
        redirectAuthSuccess: (res, authToken, firebaseToken) => {res.redirect(`${frontend_Url}/api/sign-in/discord-redirect?authToken=${authToken}?firebaseToken=${firebaseToken}`)}
    }

    // Check for errors/access code provided from Discord:
    if (error || !code) {
        console.error('Error during redirect process:', error, 'Code provided:', code);
        // Redirect to Frontend:
        return redirects.redirectAuthError(res)
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
        const accessToken = tokenResponse?.data?.access_token;
        if(!accessToken) throw new Error({message: "An access token was not provided from Discord, Auth attempt failed!"});

        // Step 2: Fetch user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        const userData = userResponse?.data;
        const userDiscordId = userData?.id
        // Log authentication:
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
        // Get all manageable guild ids as array:
        const manageableGuildsIds = manageableGuilds.map(g => (g.id));
        
        // Step 5. Create Firebase Auth Token for User:
        const firebaseToken = await admin.auth().createCustomToken(userDiscordId, {
            allGuilds: allGuildsIds,
            manageableGuilds: manageableGuildsIds 
        });

        // Step 6. Prepare Data for Sending to Frontend
        const userToSend = {
            id: userData?.id,
            username: userData?.username,
            displayName: userData?.global_name,
            accentColor: userData?.accent_color,
            avatar: userData?.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            banner: userData?.banner ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png` : null,
            guilds: {all: allGuildsIds, manageable: manageableGuildsIds}
        };

        // Step 7. Create Secure JSON Token:
        const authToken = jwt.sign(userToSend, JSON_SECRET, { expiresIn: '7d' }); // expires in 7 days

        // Step 8. Redirect User back to Frontend w/ token(s):
        return redirects.redirectAuthSuccess(res, authToken, firebaseToken);

    } catch (err) {
        // Error Occurred - OAuth2 process:
        console.error('OAuth2 Error occurred:', err.response?.data || err.message);
        // Redirect to Homepage - FAILED sign in page:
        return redirects.redirectAuthError(res);
    }

})

// GET User - /api/v2/users/[userId]
router.get('/:userId', async (req, res) => {
    // Get requested user id:
    const fetchId = req.params.userId
    if(!fetchId) return responder.errored(res, `Invalid "userId" provided!`);

    // Get discord user data:
    const discordUserReq = await axios.get(`https://discord.com/api/v10/users/${fetchId}`, {
        headers: {
            Authorization: `Bot ${BOT_TOKEN}`
        }
    });
    let discordUserData = discordUserReq?.data;
    if(!discordUserData) return responder.errored(res, `Failed to fetch Discord user data!`);

    // Return data:
    return responder.succeeded(res, discordUserData);


})

// DELETE User - /api/v2/users/[userId]
router.delete('/:userId', verifyToken, async (req, res) => {
    const deleteId = req.params.userId
    if(!deleteId) return responder.errored(res, `invalid "userId" provided`)

    // Confirm deleting own account:
    if(req.user.id != deleteId) return responder.errored(res, `Invalid Permissions - You can only delete your own account!`, 403)

    // Delete user from Firebase Auth:
    await auth.deleteUser(deleteId).catch((e) => {return responder.errored(res, e?.message | 'Unknown Firebase deletion error!', 500) })

    // Return Success:
    return responder.succeeded(res, `[DELETE] User ${deleteId} has been successfully deleted!`)

})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router
import express, { json } from "express";
const router = express.Router();
import axios from "axios";
import jwt from "jsonwebtoken";
import LZString from "lz-string";
import * as jose from 'jose';
import global from "../../../../../utils/global.js";
import responder from "../../utils/responder.js";
import { admin, db  } from "../../../../../utils/firebase.js";

import { DateTime } from "luxon";
import verifyToken from "../../utils/verifyToken.js";
import logtail from "../../../../../utils/logs/logtail.js";

// Secure Variables:
const ENVIRONMENT = process.env['ENVIRONMENT'];
const CLIENT_ID = process.env['CLIENT_ID'];
const CLIENT_SECRET = process.env['CLIENT_SECRET'];
const JSON_SECRET = process.env['JSON_WEBTOKEN_SECRET'];

const encoder = new TextEncoder()

const FRONTEND_URL = global.frontend_Url; // Frontend root url
// const REDIRECT_URI = 'https://api.sessionsbot.fyi/api/v2/users/auth/discord'; // Old - Public
const REDIRECT_URI = 'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app/api/v2/users/auth/discord'; // Old - Public
// const REDIRECT_URI = 'http://localhost:3000/api/v2/users/auth/discord'; // Dev Testing

// Save sign in data - helper fn:
const saveSignInData = async (userData, refreshToken) => { 
    try { // Attempt save
        const timestamp = DateTime.now().setZone('America/Chicago').toLocaleString(DateTime.DATETIME_MED)
        db.collection('users').doc(String(userData?.id)).set({
            username: userData?.username,
            lastSignIn: timestamp,
            refreshToken: refreshToken
        }, {merge: true})
        return {success: true};
    } catch(err) { // Error saving
        logtail.error(`Failed to save new sign in data for user - ${userData?.username}`, err);
        return {success: false, error: err};
    }
}

// Discord oAuth2 - /api/v2/users/auth/discord
router.get('/discord', async (req, res) => {
    // Get req query:
    const code = req.query.code;
    const error = req.query.error;

    // Auth frontend redirects:
    const redirects = {
        /** _Sign in failed:_ Send user back to frontend to page notifying of failed attempt.
        * @param {Response} res Response object from initial API call.
        */
        redirectAuthError : (res, message) => {
            if(message) {
                const safeMsg = encodeURIComponent(message)
                return res.redirect(`${FRONTEND_URL}/api/sign-in/discord-redirect?failed=true&message=${safeMsg}`)
            }else{
                return res.redirect(`${FRONTEND_URL}/api/sign-in/discord-redirect?failed=true&untraceableError=true`)
            }
        },

        /** _Sign in success:_ Send user back to frontend with encoded user token/data.
        * @param {Response} res Response object from initial API call.
        * @param {any} encodedToken Generated encoded auth token(s) to assign user within app.
        */
        redirectAuthSuccess: (res, encodedTokens) => {
            res.redirect(`${FRONTEND_URL}/api/sign-in/discord-redirect#token=${encodedTokens}`)
        }
    }

    // Check for errors/access code provided from Discord:
    if (error || !code) {
        // console.error('Error during redirect process:', error, 'Code provided:', code);
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
        const responseData = tokenResponse?.data
        const accessToken = responseData?.access_token;
        const refreshToken = responseData?.refresh_token;
        if(!accessToken) throw {message: "An access token was not provided from Discord, Auth attempt failed!"};
        if(!refreshToken) throw {message: "A refresh token was not provided from Discord, Auth attempt failed!"};

        // Step 2: Fetch user info
        const userResponse = await axios.get('https://discord.com/api/users/@me', { headers: {Authorization: `Bearer ${accessToken}`} });
        const userData = userResponse?.data;
        const userDiscordId = userData?.id

        // Step 3: Fetch user guilds
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', { headers: {Authorization: `Bearer ${accessToken}`} });
        const guilds = guildsResponse.data;
        if(!guilds) throw {message: 'Failed to fetch authenticating users Discord guilds!'};
        const allGuildsIds = guilds.map(g => (g.id));

        // Step 4. Filter guilds where user has manage or admin permissions
        const manageableGuilds = guilds.filter(guild => {
            const permissions = BigInt(guild.permissions_new ?? guild.permissions); 
            return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });
        // Find manageable guilds - admin perms & sessions bot is member:
        /** @type {string[]} */
        const allManageableGuildsIds = manageableGuilds.map(g => (g.id));
        const botGuilds = await global.client.guilds.fetch()
        const botGuildsIds = botGuilds.map(g => (g.id))
        const manageableGuildsIds = allManageableGuildsIds.filter(gId => {
            return botGuildsIds.includes(gId)
        })
        
        // Step 5. Create Firebase Auth Token for User:
        const firebaseToken = await admin.auth().createCustomToken(userDiscordId, {
            allGuilds: allGuildsIds,
            manageableGuilds: manageableGuildsIds 
        });
        if(!firebaseToken) throw {message: 'Failed to generate custom Firebase token for authenticating user!'};

        // Step 6: Save User Data/Refresh Token
        const saveResults = await saveSignInData(userData, refreshToken)
        if(!saveResults.success) throw {message: "Failed to save refresh token for user during authentication!"};

        // Step 7. Prepare Data for Sending to Frontend
        const userToSend = {
            id: userData?.id,
            username: userData?.username,
            displayName: userData?.global_name,
            accentColor: userData?.accent_color,
            avatar: userData?.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            banner: userData?.banner ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png` : null,
            guilds: {all: allGuildsIds, manageable: manageableGuildsIds}
        };

        // Step 8. Create Secure JSON Token:
        const authToken = jwt.sign(userToSend, JSON_SECRET, { expiresIn: '7d' }); // expires in 7 days
        if(!authToken) throw {message: 'Failed to generate JWT auth token for authenticating user!'};

        // Step 9. Encode both auth tokens for response:
        const payload = JSON.stringify({
            jwt: authToken,
            firebase: firebaseToken
        });
        // const encodedTokens = LZString.compressToEncodedURIComponent(payload);
        const encodedTokens = await new jose.CompactEncrypt(
            encoder.encode(payload)
        ).setProtectedHeader({
            alg: "dir",
            enc: "A256GCM",
            zip: "DEF"
        }).encrypt(encoder.encode('SESSIONSBOT-AUTH-DECODING-KEY123'));

        // Log authentication:
        logtail.info(`[👤] User Authenticated: ${userData?.username}`)

        // Step 10. Redirect User back to Frontend w/ token(s):
        return redirects.redirectAuthSuccess(res, encodedTokens);

    } catch (err) {
        // Error Occurred - OAuth2 process:
        // Redirect to Homepage - FAILED sign in page:
        if(err?.message) {
            logtail.warn(`[👤❌] Authentication Failed! - ${err?.message}`)
        } else {
            console.warn('---SENSITIVE ERROR---');
            console.log(err);
            console.warn('---END ERROR---');
        }

        return redirects.redirectAuthError(res, err?.message);
    }

})


// Token Refresh - /api/v2/users/auth/refresh
router.get('/refresh', verifyToken, async (req, res) => {
    try {
        // 0. Prepare for/read request:
        /** Acting/re-authorizing user's data 
         * @type {import("@sessionsbot/api-types").DecodedUserData} 
         * */
        const actingUserData = req?.user;
        if (!actingUserData) throw { message: "Failed to access user data from token verification!" };
        const userId = actingUserData?.id;

        const manuallyTriggered = req.headers?.['manual-call'] || 'UNKNOWN';
        const triggeredBy =  manuallyTriggered == 'true' ? 'manual' : manuallyTriggered == 'false' ? 'automatic' : 'triggeredBy: unknown'
        
        // 1. Get users refresh token from db:
        const userDoc = await admin.firestore().collection("users").doc(userId).get();
        if (!userDoc.exists) throw { message: "Couldn't find user in database!" };

        const { refreshToken: storedRefreshToken } = userDoc.data();
        if (!storedRefreshToken) throw { message: "No refresh token stored for this user!" };

        // 2. Request new tokens from Discord
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: storedRefreshToken,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const responseData = tokenResponse.data;
        const accessToken = responseData?.access_token;
        const newRefreshToken = responseData?.refresh_token;
        if (!accessToken || !newRefreshToken) throw { message: "Failed to get refreshed tokens from Discord!" };

        // 3. Update Firestore with new refresh token
        await saveSignInData(req?.user, newRefreshToken)

        // 4. Fetch updated user & guilds from Discord for user
        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userData = userResponse.data;

        const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const guilds = guildsResponse.data;

        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const allGuildsIds = guilds.map(g => g.id);

        const manageableGuilds = guilds.filter(guild => {
            const permissions = BigInt(guild.permissions_new ?? guild.permissions);
            return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });

        const allManageableGuildsIds = manageableGuilds.map(g => g.id);
        const botGuilds = await global.client.guilds.fetch();
        const botGuildsIds = botGuilds.map(g => g.id);
        const manageableGuildsIds = allManageableGuildsIds.filter(gId => botGuildsIds.includes(gId));

        // 5. Create new Firebase token (optional if you want to refresh that too)
        const firebaseToken = await admin.auth().createCustomToken(userId, {
            allGuilds: allGuildsIds,
            manageableGuilds: manageableGuildsIds
        });

        // 6. Create new JWT for frontend
        const userToSend = {
            id: userData?.id,
            username: userData?.username,
            displayName: userData?.global_name,
            accentColor: userData?.accent_color,
            avatar: userData?.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            banner: userData?.banner ? `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png` : null,
            guilds: { all: allGuildsIds, manageable: manageableGuildsIds }
        };
        const authToken = jwt.sign(userToSend, JSON_SECRET, { expiresIn: "7d" });

        // 7. Encode both auth tokens for response:
        const payload = JSON.stringify({
            jwt: authToken,
            firebase: firebaseToken
        });
        const encodedTokens = LZString.compressToEncodedURIComponent(payload);

        // Log authentication:
        logtail.info(`[👤] User Refreshed Token: ${userData?.username} - ${triggeredBy}`);


        // 8. Return tokens directly (no redirect here, since it's a background refresh)
        return responder.succeeded(res, {encodedTokens}, 201)

    } catch (err) {
        // console.error("[!] Token refresh failed:", err.response?.data || err.message);
        return res.status(401).json({ success: false, error: err.message || "Refresh failed" });
    }
});



// Export router:
export default router
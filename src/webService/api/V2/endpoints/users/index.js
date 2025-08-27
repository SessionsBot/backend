//------------------------------------------[ Imports ]------------------------------------------\\
import express from "express";
const router = express.Router();
import axios from "axios";
import responder from "../../utils/responder.js";
import verifyToken from "../../utils/verifyToken.js";
import { auth  } from "../../../../../utils/firebase.js";

// Secure Variables:
const BOT_TOKEN = process.env['BOT_TOKEN'];


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid user id or endpoint', 400);
})

// GET User - /api/v2/users/[userId]
router.get('/:userId', async (req, res) => {
    // Get requested user id:
    const fetchId = req.params.userId
    if(!fetchId) return responder.errored(res, `Invalid "userId" provided!`);

    // Get discord user data:
    try {
        const discordUserReq = await axios.get(`https://discord.com/api/v10/users/${fetchId}`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`
            }
        });
        let discordUserData = discordUserReq?.data;
        if(!discordUserData) return responder.errored(res, `Failed to fetch Discord user data!`);
    
        // Return data:
        return responder.succeeded(res, discordUserData);
    } catch (err) {
        return responder.errored(res, 'Failed to fetch Discord user data from Discord API.', 500);
    }


})

// DELETE User - /api/v2/users/[userId]
router.delete('/:userId', verifyToken, async (req, res) => {
    const deleteId = req.params.userId
    if(!deleteId) return responder.errored(res, `invalid "userId" provided`)

    // Confirm deleting own account:
    if(req.user.id != deleteId) return responder.errored(res, `Invalid Permissions - You can only delete your own account!`, 403)

    // Delete user from Firebase Auth:
    await auth.deleteUser(deleteId).catch((e) => {return responder.errored(res, e?.message | 'Unknown Error - Internal - Firebase deletion error', 500) })

    // Return Success:
    return responder.succeeded(res, `User ${deleteId} has been successfully deleted!`)

})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
export default router
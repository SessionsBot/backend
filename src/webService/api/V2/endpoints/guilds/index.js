//------------------------------------------[ Imports ]------------------------------------------\\
const BOT_TOKEN = process.env['BOT_TOKEN'];
const express = require('express');
const router = express.Router()
const responder = require('../../utils/responder')
const { default: axios, HttpStatusCode } = require('axios');
const verifyToken = require('../../utils/verifyToken');
const { admin, auth } = require('../../../../../utils/firebase');
const verifyGuildMember = require('../../utils/verifyMember');
const { guilds } = require('../../../../../utils/guildManager');


//-----------------------------------------[ Endpoints ]-----------------------------------------\\
// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
})

// GET/FETCH - Read Guild:
router.get('/:guildId', async (req, res) => {
    // 1. Get & Verify Parameters:
    const fetchId = req.params.guildId
    if(!fetchId) return responder.errored(res, `Invalid Input - No 'guildId' was provided.`)
    // 2. Fetch Discord Data:
    try {
        // Discord API
        const discordGuildReq = await axios.get(`https://discord.com/api/v10/guilds/${fetchId}`, {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`
            }
        });
        let discordGuildData = discordGuildReq?.data;
        if(!discordGuildData) return responder.errored(res, `Failed to fetch Discord guild data!`, 500);
        
        // Internal Database:
        const readGuildAttempt = await guilds(fetchId).readGuild()
        if(!readGuildAttempt.success) return responder.errored(res, `Failed to fetch internal guild data!`, 500);

        return responder.succeeded(res, {discord: discordGuildData, firebase: readGuildAttempt.data})

    } catch (err) {
        if (err?.response?.data?.code === 10007) return responder.errored(res, `Invalid Permission - You're not a member of this guild.`)
        if (err?.response?.data?.code === 10004) return responder.errored(res, `Unknown Guild - Sessions Bot isn't a member of this guild.`)
        console.log('{!}[API] Guild READ/GET Error:', err);
        return responder.errored(res, 'Failed to fetch guild data, please try again.', 500)
    }
})

// GET/FETCH - Archive Guild:
router.delete('/:guildId', verifyToken, verifyGuildMember, async (req, res) => {
    const deleteId = req.params.guildId
    if(!deleteId) return responder.errored(res, `invalid "guildId" provided`)
    const actingUser = req?.user

    // Archive guild:
    const archiveAttempt = await guilds(deleteId).archiveGuild()
    if(!archiveAttempt.success) return responder.errored(res, 'Failed to archive guild, please try again!')
    else return responder.succeeded(res, 'Guild has been archived successfully.')
})


//-------------------------------------[ Export Endpoints ]-------------------------------------\\
module.exports = router
//------------------------------------------[ Imports ]------------------------------------------\\
const BOT_TOKEN = process.env['BOT_TOKEN'];
import express from "express";
const router = express.Router()
import responder from "../../utils/responder.js";
import { HttpStatusCode  } from "axios";
import verifyToken from "../../utils/verifyToken.js";
import verifyGuildMember from "../../utils/verifyMember.js";
import guildManager from "../../../../../utils/guildManager.js";
import {  createAutoSignupChannel  } from "../../../../events/createAutoSignupChannel.js";
import global from "../../../../../utils/global.js";


//-----------------------------------------[ Endpoints ]-----------------------------------------\\

// Root Call:
router.get('/', (req, res) => {
    return responder.errored(res, 'Please provide a valid endpoint', HttpStatusCode.MultipleChoices)
})


// GET/FETCH - Read Guild:
router.get('/:guildId', async (req, res) => {
    // 1. Get & Verify Parameters:
    const guildId = req.params.guildId
    if(!guildId) return responder.errored(res, `Invalid Input - No 'guildId' was provided.`)
    // 2. Fetch Discord Data:
    try {
        // Check if Bot is in Guild:
        const client = global.client;
        if(!client) return responder.errored(res, 'Failed to fetch guild data! Client was inaccessible, please try again later.', 500);
        const guildsCollection = await client.guilds.fetch();
        const sessionsBotInGuild = Array.from(guildsCollection.keys()).includes(String(guildId));
        if(!sessionsBotInGuild) return responder.errored(res, `SessionsBot is not a member of this guild!`, 404)

        // Get General Guild Data:
        const discordReq = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, { headers: { Authorization: `Bot ${BOT_TOKEN}`} });
        if (!discordReq.ok) return responder.errored(res, 'Failed to fetch guild data from Discord!', discordReq.status)
        const guildData = await discordReq.json();
    
        // Get Guild Channels Data:
        const channelsReq = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, { headers: { Authorization: `Bot ${BOT_TOKEN}`} });
        if (!channelsReq.ok) return responder.errored(res, 'Failed to fetch channel guild data from Discord!', channelsReq.status)
        const guildChannels = await channelsReq.json();

        // Get Guild Data from Database:
        let guildDatabaseData;
        const guildDataRetrieval = await guildManager.guilds(String(guildId)).readGuild()
        if (!guildDataRetrieval.success) {
            guildDatabaseData = 'null'
        } else {
            guildDatabaseData = guildDataRetrieval.data
        }
    
        
        // Return Data to Frontend:
        const responseData = {
            guildGeneral: guildData,
            guildChannels,
            guildDatabaseData,
            guildIcon: guildData.icon ? `https://cdn.discordapp.com/icons/${guildId}/${guildData.icon}.png` : null,
            guildBanner: guildData.banner ? `https://cdn.discordapp.com/banners/${guildId}/${guildData.banner}.png` : null,
            sessionsBotInGuild
        }

        return responder.succeeded(res, responseData)

    } catch (err) {
        if (err?.response?.data?.code === 10007) return responder.errored(res, `Invalid Permission - You're not a member of this guild.`)
        if (err?.response?.data?.code === 10004) return responder.errored(res, `Unknown Guild - Sessions Bot isn't a member of this guild.`)
        console.log('{!}[API] Guild READ/GET Error:', err);
        return responder.errored(res, 'Failed to fetch guild data, please try again.', 500)
    }
})


// DELETE/REMOVE - Archive Guild:
router.delete('/:guildId', verifyToken, verifyGuildMember, async (req, res) => {
    const deleteId = req.params.guildId
    if(!deleteId) return responder.errored(res, `invalid "guildId" provided`)
    const actingUser = req?.user

    // Archive guild:
    const archiveAttempt = await guildManager.guilds(deleteId).archiveGuild()
    if(!archiveAttempt.success) return responder.errored(res, 'Failed to archive guild, please try again!')
    else return responder.succeeded(res, 'Guild has been archived successfully.')
})


// PATCH/UPDATE - Configure Guild:
router.patch('/:guildId/configuration', verifyToken, verifyGuildMember, async (req, res) => {
    // 1. Verify Params:
    const guildId = req.params?.guildId;
    const configurationSetup = req.body?.configuration;

    // 2. Attempt Save:
    const configureResult = await guildManager.guildConfiguration(guildId).configureGuild(configurationSetup);
    if(!configureResult.success) return responder.errored(res, 'Failed to save guild configuration, please try again!', 500);
    else return responder.succeeded(res, 'Guild configuration saved successfully!');
})


// POST/CREATE - Auto Signup Channel:
router.post('/:guildId/channels/auto-signup', verifyToken, verifyGuildMember, async (req, res) => {
    // 1. Verify Params:
    const guildId = req.params?.guildId;
    const actorId = req?.user?.id

    // 2. Attempt Save:
    const creationResults = await createAutoSignupChannel(guildId, actorId)
    if(!creationResults.success) return responder.errored(res, 'Failed to create default signup channel, please try again!', 500);
    else return responder.succeeded(res, creationResults.data);
})

//-------------------------------------[ Export Endpoints ]-------------------------------------\\
export default router
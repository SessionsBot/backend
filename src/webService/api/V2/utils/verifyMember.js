// Imports
const JWT_KEY = process.env.JSON_WEBTOKEN_SECRET;
const jwt = require('jsonwebtoken');
const { Request, Response, NextFunction } = require('express');
const responder = require('./responder');


/** __Utility function used to verify the authorized user is member of the requested guild.__
 * 1. Checks inside original request for authentication data.
 * 2. Verifies actor is a member within specified guild in request
 * 
 * **Is member**: Executes function (next) from API call.
 *
 * **Not member**: Stops execution and responds to API call with permission errors.
 * 
 * @param {Request} req Original request object from API call.
 * @param {Response} res Original response object from API call.
 * @param {NextFunction} next The function/execution from API call.
 */
const verifyGuildMember = async (req, res, next) => {
    // Auth Token Data:
    // const token = req.headers?.authorization?.split(' ')[1];
    // if(!token) return responder.errored(res, 'Invalid Permissions - An authentication token was not provided!', 401);

    // Guild from request:
    const guildId = req.params?.guildId
    const actorUserId = req?.user?.id
    if(!actorUserId) return responder.errored(res, `Internal Error - Couldn't access authed user from req data.`, 500)
    
    // Check if actor is member:
    const { client } = require("../../../../utils/global");
    try {
        if(!client) throw 'Discord bot client is not accessible.'

        // Check via Discord.js
        const guild = await client?.guilds?.fetch(guildId);
        if(!guild) throw 'Discord guild is not accessible.'

        const member = await guild?.members?.fetch(actorUserId);
        if(!member) throw 'Discord member not found in guild.'

        // If all checks passed - allow/next:
        next();
        
    } catch (err) {
        if (err.code === 10007) return responder.errored(res, `Invalid Permission - You're not a member of this guild.`)
        if (err.code === 10004) return responder.errored(res, `Unknown Guild - Sessions Bot isn't a member of this guild.`)
        console.log('API verifyMember Error:', err)
        return responder.errored(res, `Internal Error - Couldn't verify actors(ID: ${actorUserId}) guild membership within guild ${guildId}.`, 500)
    }
}

// Export:
module.exports = verifyGuildMember
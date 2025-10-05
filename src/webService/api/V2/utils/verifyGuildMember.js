// Imports
import global from "../../../../utils/global.js";
import logtail from "../../../../utils/logs/logtail.js";
import { sendPermsDeniedAlert } from "../../../../utils/perms/permissionDenied.js";
import responder from "./responder.js";


/** __Utility function used to verify the *authorized user* is a member of the requested guild.__
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

    // Guild from request:
    const guildId = req.params?.guildId
    const actorUserId = req?.user?.id
    if(!guildId) return responder.errored(res, {message: `Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, orgRequest: req?.originalUrl}, 400)
    if(!actorUserId) return responder.errored(res, `Internal Error - Couldn't access authed user from req data.`, 500)
    
    // Check if actor is member:
    const cachedClient = global?.client;

    try {
        
        if(!cachedClient) throw 'Discord bot client is not accessible.'
        const client = cachedClient

        // Check via Discord.js
        const guild = await client?.guilds?.fetch(guildId);
        if(!guild) throw 'Discord guild is not accessible.'

        const member = await guild?.members?.fetch(actorUserId);
        if(!member) throw 'Discord member not found in guild.'

        // If all checks passed - allow/next:
        next();
        
    } catch (err) {
        if (err?.code === 10007) return responder.errored(res, `Invalid Permission - You're not a member of this guild.`)
        if (err?.code === 10004) return responder.errored(res, `Unknown Guild - Sessions Bot isn't a member of this guild.`)
        if (err?.code === 50013 || e?.code == 50001 || e?.code == 50007) { // Permission Error:
            await sendPermsDeniedAlert(guildId, 'Verify Guild Member - API');
            return responder.errored(res, `Permission Error - Please re-configure the right permissions to your Bot ASAP.`);
        }
        logtail.warn('API verifyMember Error:', {err, originalReg: req?.originalUrl})
        return responder.errored(res, `Internal Error - Couldn't verify actors(ID: ${actorUserId}) guild membership within guild ${guildId}.`, 500)
    }
}

export default verifyGuildMember;
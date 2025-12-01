// Imports
import global from "../../../../utils/global.js";
import logtail from "../../../../utils/logs/logtail.js";
import { sendPermsDeniedAlert } from "../../../../utils/perms/permissionDenied.js";
import responder from "./responder.js";

/** __Utility function used to verify the *authorized user* is a member ***AND ADMIN*** of the requested guild.__
 * 1. Checks inside original request for authentication data.
 * 2. Verifies actor is a member within specified guild in request
 * 
 * **Is admin**: Executes function (next) from API call.
 *
 * **Not admin**: Stops execution and responds to API call with permission errors.
 * 
 * @param {Request} req Original request object from API call.
 * @param {Response} res Original response object from API call.
 * @param {NextFunction} next The function/execution from API call.
 */
const verifyGuildAdmin = async (req, res, next) => {

    // Check if Bot Admin 'forcible' fn:
    const checkForBotAdmin = async () => {
        const botAdminIds = JSON.parse(process.env?.['ADMIN_USER_IDS'] || '[]')
        if(botAdminIds?.includes(actorUserId)) {
            logtail.info(`[i] FORCE AUTHED API REQUEST`, {reqUrl: req.url, adminUser: req?.user});
            return next();
        }
    }

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

        // Fetch member/user
        const member = await guild?.members?.fetch({user: actorUserId, force: true});
        if(!member) throw 'Discord member not found in guild.'

        // Confirm user has guild admin perms:
        if (
            !member.permissions.has('ManageGuild') &&
            !member.permissions.has('Administrator')
        ) {
            return responder.errored(res, `Invalid Permission - You're not an administrator of this guild.`, 403);
        }

        // If all checks passed - allow/next:
        return next();
        
    } catch (err) {
        // Check if this request can be force granted by BOT Admin:
        await checkForBotAdmin()

        if (err?.code === 10007) return responder.errored(res, `Invalid Permission - You're not a member of this guild.`)
        if (err?.code === 10004) return responder.errored(res, `Unknown Guild - Sessions Bot isn't a member of this guild.`)
        if (err?.code === 50013 || err?.code == 50001 || err?.code == 50007) { // Permission Error:
            await sendPermsDeniedAlert(guildId, 'Verify Guild Member - API');
            return responder.errored(res, `Permission Error - Please re-configure the right permissions to your Bot ASAP.`);
        }
        logtail.warn('API verifyMember Error:', {originalReg: req?.originalUrl, err})
        return responder.errored(res, `Internal Error - Couldn't verify actors(ID: ${actorUserId}) guild membership within guild ${guildId}.`, 500)
    }
}

export default verifyGuildAdmin;
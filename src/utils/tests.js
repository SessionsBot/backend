import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import global from "./global.js";
import guildManager from "./guildManager.js";
import { createAutoSignupChannel } from "../webService/events/createAutoSignupChannel.js";
import { sendPermsDeniedAlert } from "./perms/permissionDenied.js";
import discordLog from "./logs/discordLog.js";
import { DateTime } from "luxon";

const guildId = process.env["GUILD_ID_DEVELOPMENT"]
const channelId = '1413653266931122186';


export default {
    init: async () => { try {
        if(process.env['ENVIRONMENT'] == 'development'){
            console.info('--- \n[i] Running Development Tests!');

            // Test here..

            console.info('[i] Development Tests Completed! \n---');            
        }
    }catch(e) { 
        console.warn('[!] Failed to run development tests:', e)
    }},
}


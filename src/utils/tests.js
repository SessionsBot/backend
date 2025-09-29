import { ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import global from "./global.js";
import guildManager from "./guildManager.js";
import { createAutoSignupChannel } from "../webService/events/createAutoSignupChannel.js";
import { sendPermsDeniedAlert } from "./responses/permissionDenied.js";

const guildId = '1379160686629880028';
const channelId = '1413653266931122186';

const accentColor = 0x00000;



export default {
    init: async () => { try{
        if(process.env['ENVIRONMENT'] == 'development'){
            console.info('--- \n[i] Running Development Tests!');
            sendPermsDeniedAlert('1379160686629880028');
        }
    }catch(e){ 
        console.warn('[!] Failed to initialize tests:', e)
    }},
}


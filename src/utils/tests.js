import { ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import global from "./global.js";
import guildManager from "./guildManager.js";
import { createAutoSignupChannel } from "../webService/events/createAutoSignupChannel.js";

const guildId = '1379160686629880028';
const adminId = '252949527143645185';
const channelId = '1410318136393076900';

export default {
    runNewAutoChannel: async () => {
        const botClient = global.client
        const guild = botClient.guilds.fetch(guildId)

        const createResult = await createAutoSignupChannel(guildId, adminId);
        if(!createResult.success){
            console.log(`{!} Failed to run creation test:`, createResult);
        }
    }
}
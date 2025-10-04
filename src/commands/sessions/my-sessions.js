// --------------------- [Imports/Variables] --------------------- \\

import {
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SeparatorBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    ComponentType,
} from 'discord.js'; // Import Discord.js
import guildManager from "../../utils/guildManager.js"; // Import Guild Manager
import global from "../../utils/global.js"; // Import Global Variables

import mySessionsResponses from "../../utils/responses/mySessionsResponses.js";
import logtail from '../../utils/logs/logtail.js';

// --------------------- [Command/Execution] --------------------- \\

// Register Command:
const data = new SlashCommandBuilder()
    .setName('my-sessions')
    .setDescription("Lists your currently assigned sessions with respective options.")
    .setContexts(InteractionContextType.Guild)

// On Command Execution:
async function execute(interaction) { 
    try {
        // Defer Response:
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch((err) => { // Error Deferring:
            logtail.warn(`{!} Couldn't defer /my-sessions response:`, {err})
        });

        // Send Session List:
        const guildRetrieval = await guildManager.guilds(interaction.guild.id).readGuild()
        /** @type {import('@sessionsbot/api-types').FirebaseGuildDoc | undefined} */
		let guildData;
        if(guildRetrieval.success){ // Retrieval Success:
            guildData = guildRetrieval?.data;
            await mySessionsResponses.respond(interaction).userSessionsList(guildRetrieval.data)
        }else{ // Retrieval Error:
            await mySessionsResponses.respond(interaction).commandError(guildRetrieval.data)
        }

        // Await any further interactions:
        const reply = await interaction.fetchReply();
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        // On Interaction Collection:
        collector.on('collect', async (collectorInteraction) => {
            // Defer Collector Response:
            await collectorInteraction.deferUpdate().catch((err) => { // Defer Response:
                logtail.warn(`{!} Error Deferring: - /${interaction.commandName}`, {err})
            });

            // Parse Interaction Data:
            const [interactionID, sessionID] = collectorInteraction.customId.split(':');

            // START CONFIRMATION:
            if(interactionID == 'startLeaveSessionRole') { // Session Role Removal Confirmation
            
                const [interactionID, sessionID, roleString] = collectorInteraction.customId.split(':');
                const sessionDate = guildData?.upcomingSessions?.[sessionID]?.date?.discordTimestamp || 'Unknown Date'
                const sessionTitle = guildData?.upcomingSessions?.[sessionID]?.title || 'Unknown Title'

                // Ask for Confirmation:
                const confirmContainer = new ContainerBuilder()
                confirmContainer.setAccentColor(0xfc9d03) // orange
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Please Confirm'))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('Are you sure you would like to **unassign** yourself from this role?')) 
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**🔠 - Title:** \n> **\`${sessionTitle}\`**`))
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder({content: `**⏰ - Time:** \n> **<t:${sessionDate}:t>**`}))
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder({content: `**💼 - Role:** \n> **\`${roleString}\`**`}))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addActionRowComponents(
                    new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`cancelSessionRemoval:${sessionID}`)
                            .setLabel('Go Back')
                            .setEmoji('↩️')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId(`confirmSessionRemoval:${sessionID}`)
                            .setLabel('Remove')
                            .setEmoji('❌')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false)
                    )
                )
                await interaction.editReply({
                    components:[confirmContainer]
                })

            }

            // CONFIRMED REMOVAL:
            if(interactionID == 'confirmSessionRemoval') { // CONFIRMED - Session Role Removal Confirmation String()
                // Attempt Removal:
                const removalAttempt = await guildManager.guildSessions(String(interaction.guild.id)).removeUserSessionRole(sessionID, String(interaction.user.id)) //sessionManager.removeUserFromSessionRole(String(collectorInteraction.guildId), String(sessionID), String(collectorInteraction.user.id)) //.removePlayerFromSessionById(sessionID, collectorInteraction.user.id)

                // Build Message Response:
                const removalResponseContainer = new ContainerBuilder()
                if (removalAttempt.success) { // Role Removal Success:
                    removalResponseContainer.setAccentColor(0x6dc441) // green
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 📤 Role Removed'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`You have **successfully removed** yourself from this session!`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel('My Sessions')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    )
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${sessionID})`))

                } else { // Role Removal Error:
                    removalResponseContainer.setAccentColor(0xd43f37) // red
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ⚠️ Removal Error'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`An **error occurred** while trying to remove you from this session role! If this error persists, please contact support.`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel('My Sessions')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    )

                }

                // Send Response:
                await interaction.editReply({
                    components: [removalResponseContainer]
                })
            }

            // REJECTED/CANCELED:
            if(interactionID == 'cancelSessionRemoval') { // Session Role Removal Confirmation 
                // Send Session List:
                const guildRetrieval = await guildManager.guilds(interaction.guild.id).readGuild()
                if(guildRetrieval.success){ // Retrieval Success:
                    guildData = guildRetrieval.data;
                    await mySessionsResponses.respond(interaction).userSessionsList(guildRetrieval.data)
                }else{ // Retrieval Error:
                    await mySessionsResponses.respond(interaction).commandError(guildRetrieval.data)
                }
            }

        })

    } catch (e) {
        // Send Error Response:
        const msgContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Command Error'))
        msgContainer.setAccentColor(0xfc9d03) // red
        // Spacer
        msgContainer.addSeparatorComponents(separator) 
        // Info
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`*This command failed execution, please try again in a little while. If this issue persists please contact support.*.`)
        )

        // Send Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [msgContainer]
        })

        // Log Error:
        logtail.error(`[/${interaction.commandName}] An error occurred:`, {rawError: e});
    }
}

// Exports:
export default{
    data,
    execute
};

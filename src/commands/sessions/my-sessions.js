// --------------------- [Imports/Variables] --------------------- \\

const {
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
} = require('discord.js'); // Import Discord.js
const guildManager = require('../../utils/guildManager.js'); // Import Guild Manager
const global = require('../../utils/global.js'); // Import Global Variables

const mySessionsResponses = require('../../utils/responses/mySessionsResponses.js');

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
            console.log(`{!} Couldn't defer /my-sessions response:`)
            console.log(err)
        });

        // Send Session List:
        const guildRetrieval = await guildManager.guilds(interaction.guild.id).readGuild()
        if(guildRetrieval.success){ // Retrieval Success:
            if(global.outputDebug_InDepth) { console.log('Retrieval Success:'); console.log(guildRetrieval); }
            await mySessionsResponses.respond(interaction).userSessionsList(guildRetrieval.data)
        }else{ // Retrieval Error:
            if(global.outputDebug_InDepth) { console.log('Retrieval Error:'); console.log(guildRetrieval); }
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
                console.log(`{!} Error Deferring: - /${interaction.commandName}:`)
                console.log(err)
            });

            // Parse Interaction Data:
            const [interactionID, sessionID] = collectorInteraction.customId.split(':');

            // START CONFIRMATION:
            if(interactionID == 'startLeaveSessionRole') { // Session Role Removal Confirmation
            
                const [interactionID, sessionID, roleString] = collectorInteraction.customId.split(':');
                const sessionDate = guildRetrieval.data['upcomingSessions']?.[sessionID]?.['date']?.['discordTimestamp'] || 'Unknown Date'

                // Ask for Confirmation:
                const confirmContainer = new ContainerBuilder()
                confirmContainer.setAccentColor(0xfc9d03)
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Please Confirm:'))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('Are you sure you would like to ***unassign*** yourself from this role?')) 
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${sessionDate}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addActionRowComponents(
                    new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirmSessionRemoval:${sessionID}`)
                            .setLabel('REMOVE')
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId(`cancelSessionRemoval:${sessionID}`)
                            .setLabel('Go Back')
                            .setEmoji('↩️')
                            .setStyle(ButtonStyle.Primary)
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
                    removalResponseContainer.setAccentColor(0x6dc441)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - Success ✅'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('*`You have successfully removed yourself as an attendee from this session!`*'))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${sessionID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel(' -  My Sessions')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
                        )
                    )

                } else { // Role Removal Error:
                    removalResponseContainer.setAccentColor(0xd43f37)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - ERROR ⚠️'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("*`An error occurred while trying to remove yourself from this session, are you sure you're assigned it?`*"))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${sessionID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel(' -  My Sessions')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
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
                    if(global.outputDebug_InDepth) { console.log('Retrieval Success:'); console.log(guildRetrieval); }
                    await mySessionsResponses.respond(interaction).userSessionsList(guildRetrieval.data)
                }else{ // Retrieval Error:
                    if(global.outputDebug_InDepth) { console.log('Retrieval Error:'); console.log(guildRetrieval); }
                    await mySessionsResponses.respond(interaction).commandError(guildRetrieval.data)
                }
            }

        })

    } catch (e) {
        // Send Error Response:
        const msgContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Command Error:'))
        msgContainer.setAccentColor(0xfc9d03)
        // Spacer
        msgContainer.addSeparatorComponents(separator) 
        // Info
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`*This command failed execution, please try again in a little while. If this issue persists please contact an administrator*.`)
        )

        // Send Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [msgContainer]
        })

        // Log Error:
        console.log(`{!} [/${interaction.commandName}] An error occurred:`)
        console.log(e)
    }
}

// Exports:
module.exports = {
    data,
    execute
};

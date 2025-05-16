const {
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    SectionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
} = require('discord.js'); // Import Discord.js

const sessionManager = require('../../utils/sessions/sessionManager'); // Import Session Manager
const global = require('../../global'); // Import Global Variables

// Register Command:
const data = new SlashCommandBuilder()
    .setName('refresh-event-signup')
    .setDescription("Refreshes event signup embeds within announcement channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
//


// On Command Excecution:
async function execute(interaction) {
    try {
        // Defer Response:
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).then().catch((err) => { // Defer Response:
            console.log(`{!} Error Occured! - /${interaction.commandName}:`)
            console.log(err)
        });

        // Get events/sessions to update:
        const allSessionData = await sessionManager.readSessions()

        // Update each session by id:
        for (const [sessionId, sessionData] of Object.entries(allSessionData)) {
            await sessionManager.refreshEventMessage(sessionId)
        }

        // Send Success Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x6dc441)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Success - Refreshing Events!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`*The current event embeds should be fully refreshed/updated within <#${global.event_channelId}>*`))
            ]
        })

    } catch (err) {
        // Send Error Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xd43f37)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚠️ Error - Refreshing Events!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`* An error occured when trying to update the events! Please try again. . .*`))
            ]
        })

        // Debug:
        console.log(`{!} An Error Occured - /${interaction.commandName}:`)
        console.log(err)
    }
    
}


// Exports:
module.exports = {
    data,
    execute
}
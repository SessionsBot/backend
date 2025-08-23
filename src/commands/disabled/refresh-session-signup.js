import {
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
} from 'discord.js'; // Import Discord.js

import guildManager from "../../utils/guildManager.js"; // Import Session Manager

// Register Command:
const data = new SlashCommandBuilder()
    .setName('refresh-session-signup')
    .setDescription("Refreshes session signup embeds within announcement channel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setContexts(InteractionContextType.Guild)
//


// On Command Excecution:
async function execute(interaction) {
    try {

        // Defer Response:
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch((err) => { // Defer Response:
            console.log(`{!} Error Occured! - /${interaction.commandName}:`)
            console.log(err)
        });

        // Update Signup Message using Guild Manager:
        const signupUpdateAttempt = await guildManager.guildSessions(interaction.guild.id).updateSessionSignup()
        if(!signupUpdateAttempt.success){throw new Error('Attempting to update session signup from guild manager:', signupUpdateAttempt.data)}

        // Send Success Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x6dc441)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Success - Refreshing Sessions!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`*The current session embeds should be fully refreshed/updated within this guild.*`))
            ]
        })

    } catch (err) {
        // Send Error Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xd43f37)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚠️ Error - Refreshing Sessions!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(` *An error occured when trying to update the sessions! Please try again. . .*`))
            ]
        })

        // Debug:
        console.log(`{!} An Error Occured - /${interaction.commandName}:`)
        console.log(err)
    }
    
}


// Exports:
export default {
    data,
    execute
}
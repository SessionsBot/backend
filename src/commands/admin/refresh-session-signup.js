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
const { db } = require('../../utils/firebase'); // Import Firebase
const global = require('../../utils/global'); // Import Global Variables

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

        // Get guild data from firebase:
        let guildDoc = await db.collection('guilds').doc(String(interaction.guildId)).get();
        if (!guildDoc.exists) {
            throw new Error(`{!} Guild with ID ${guildId} does not exist.`);
        } else { guildDoc = guildDoc.data() } // assign var to data

        let sessionsSignup_MessageId = String(guildDoc.sessionsSignup_MessageId).trim()
        if(!sessionsSignup_MessageId) {
            // Original Message NOT FOUND - Send New:
            await sessionManager.getRefreshedSignupMessage(interaction.guildId)
        }else {
            // Original Message FOUND - EDIT:
            await sessionManager.getRefreshedSignupMessage(interaction.guildId, sessionsSignup_MessageId)
        }

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
module.exports = {
    data,
    execute
}
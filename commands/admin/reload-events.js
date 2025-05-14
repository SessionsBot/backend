const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    PermissionsBitField,
    messageLink,
} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');
const global = require('../../global')
const requirePermissions = str((1 << 13)) // Manage Messages Permission

// Register Command:
const data = new SlashCommandBuilder()
    .setName('reload-events')
    .setDescription("Refreshes events embeds in announcement channel.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)


// On Command Excecution:
async function execute(interaction) {

   
    try { // Respond / Refresh Events:
        await interaction.reply('This command is currently unusable! :/')

    } catch (error) { // Error Occured:
        console.log('[!] An Error Occured - /reload-events');
        console.log(error);
    }
    
}

module.exports = {
    data,
    execute
};

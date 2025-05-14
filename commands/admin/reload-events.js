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

// Register Command:
const data = new SlashCommandBuilder()
    .setName('reload-events')
    .setDescription("Refreshes events embeds in announcement channel.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)


// On Command Excecution:
async function execute(interaction) {

   
    try { // Respond / Refresh Events:
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(global.colors.warning)
                .setTitle('⚠️ - Command Disabled!')
                .setDescription('Unfortunately this command is not currently operational. . .')
            ],
            flags: MessageFlags.Ephemeral
        })

    } catch (error) { // Error Occured:
        console.log('[!] An Error Occured - /reload-events');
        console.log(error);
    }

    setTimeout(async () => {
        await interaction.deleteReply().then().catch(error => {
            console.log('Failed to delete reload events interaction reply:');
            console.log(error)
        })
    }, 7000);
    
}

module.exports = {
    data,
    execute
};

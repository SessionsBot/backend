const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js');

// Import Session Manager:
const sessionManager = require('../../utils/sessionManager');


module.exports = {

    // Assign Command:
    data: new SlashCommandBuilder()
        .setName('list-events')
        .setDescription('Lists all training sessions available/occurring soon.')
        .setContexts(InteractionContextType.Guild),
    
    // On Execution:
    async execute(interaction){

        // Defer early to give yourself time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });  // No ephemeral here, just deferring

        // 1. Initial title embed (edit the initial reply after deferring)
        await interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setTitle('📋 Current Training Sessions:')
            .setDescription('Below are all upcoming sessions you can sign up for:')
            .setColor('#57F287')
        ]
        });

        // 2. Get the sessions from the session manager and send as message groups:
        const sessions = await sessionManager.readSessions();
        for (const [sessionId, session] of Object.entries(sessions)) {
            const eventTimestamp = Math.floor(new Date(session.date).getTime() / 1000);
          
            const embed = new EmbedBuilder()
              .setColor('#9BE75B')
              .setAuthor({ name: `Training Session`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
              .addFields(
                { name: '📆 Date:', value: `<t:${eventTimestamp}:F>\n(<t:${eventTimestamp}:R>)`, inline: true },
                { name: '📍 Location:', value: `[Join Here](${session.location})`, inline: true },
                { name: '🎙️ Host:', value: session.host || '*Available*', inline: true },
                { name: '🤝 Trainers:', value: Object.keys(session.trainers || {}).length + '/3', inline: true }
              )
              .setFooter({ text: `ID: ${sessionId}`, iconURL: interaction.client.user.displayAvatarURL() });
          
            const buttons = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`eventSignup:${sessionId}`)
                .setLabel('📝 Sign Up')
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setLabel('🎮 Game Link')
                .setURL(session.location || 'https://roblox.com') // fallback if null
                .setStyle(ButtonStyle.Link)
            );
          
            // Send follow-up for each event
            await interaction.followUp({
              embeds: [embed],
              components: [buttons],
              ephemeral: true // Set ephemeral for each follow-up message
            });
        }
    },
}
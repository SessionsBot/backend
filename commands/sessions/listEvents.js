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
const sessionManager = require('../../utils/sessions/sessionManager');


module.exports = {

    // Assign Command:
    data: new SlashCommandBuilder()
        .setName('list-events')
        .setDescription('Lists all training sessions available/occurring soon.')
        .setContexts(InteractionContextType.Guild),
    
    // On Execution:
    async execute(interaction){

        // Variables:
        let sessions_hosting = {};
        let sessions_training = {};
        const userId = interaction.user.id

        // Defer early to give yourself time:
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Load all sessions:
        const allSessionsData = await sessionManager.readSessions()

        // Check each session for user signed up:
        for (const [sessionId, sessionData] of Object.entries(allSessionsData)){
            // Check if Event Host:
            if(sessionData['host'] === userId) {
                sessions_hosting[`${sessionId}`] = sessionData;
            }
            // Check if Training Crew:
            if(sessionData['trainers'].includes(userId)) {
                sessions_training[`${sessionId}`] = sessionData;
            }
        }

        // Debug results:
        console.log('Sessions Hosting:', Object.keys(sessions_hosting).length);
        console.log('Sessions Training:', Object.keys(sessions_training).length);


        // 1. Initial title embed (edit the initial reply after deferring)
        await interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setTitle('📋 Current Training Sessions:')
            .setDescription(`Below are all upcoming sessions you've signed up for:`)
            .setColor('#9BE75B')
        ]
        });
    },
}
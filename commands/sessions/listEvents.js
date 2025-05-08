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

        // Defer early to give yourself time
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Load all sessions:
        const allSessionsData = await sessionManager.readSessions()

        if(allSessionsData && typeof allSessionsData === 'object'){
            console.log('[i]{ListEventsCmd} SESSIONS OBJECT FOUND!')
        }

        for (const [sessionID, sessionData] of Object.entries(allSessionsData)){
            console.log(`-- Checking info for e: ${sessionID}`)
            console.log(sessionData)
            console.log(`-------------------------`)
        }

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
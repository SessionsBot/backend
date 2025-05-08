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
        .setName('my-events')
        .setDescription(`Lists the sessions you've signed up for.`)
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

        // Send results:

        const interactionChannel = interaction.channel

        // 1. Initial title embed (edit the initial reply after deferring)
        await interaction.editReply({
        embeds: [
            new EmbedBuilder()
            .setTitle('📋 Current Training Sessions:')
            .setDescription(`Below are all upcoming sessions you've signed up for:`)
            .setColor('#9BE75B')
            .addFields( // Spacer
                { name: ' ', value: ' ' }
            )
            .addFields(
                { name: '🎙️ Hosting:', value: `${Object.keys(sessions_hosting).length}`, inline: true },
                { name: '🤝 Training:', value: `${Object.keys(sessions_training).length}`, inline: true }
            )
            .addFields( // Spacer
                { name: ' ', value: ' ' }
            )
        ]
        });

        // 2. Send the sessions the user is hosting:
        for (const [sessionId, sessionData] of Object.entries(sessions_hosting)) {

            // Create msg embed
            const updatedEmbed = new EmbedBuilder()
                .setColor('#9BE75B')
                .setTitle('📋 - Training Session')
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .addFields(
                    { name: '📆 Date:', value: `<t:${sessionData['date']}:F>\n(<t:${sessionData['date']}:R>)`, inline: true },
                    { name: '📍 Location:', value: `[Event Game](${sessionData['location']})`, inline: true }
                )
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .addFields(
                    { 
                        name: '🎙️ Host:', 
                        value: sessionData['host'] 
                        ? `> <@${sessionData['host']}>\n*(1/1)*` 
                        : '*`Available`* \n *(0/1)*', 
                        inline: true 
                    },
                    { 
                        name: '🤝 Trainers:', 
                        value: sessionData['trainers'] && sessionData['trainers'].length > 0 
                        ? sessionData['trainers'].map(id => `> <@${id}>`).join('\n') + `\n*(${sessionData['trainers'].length}/3)*` 
                        : '*`Available`* \n *(0/3)*', 
                        inline: true 
                    }
                    
                    
                )          
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .setFooter({ text: `ID: ${sessionId.toUpperCase()}`, iconURL: interaction.client.user.displayAvatarURL() });

            // Create msg buttons
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eventLeaveRole:${sessionId}`)
                    .setLabel('🚪 Leave Role')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('🎮 Game Link')
                    .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                    .setStyle(ButtonStyle.Link)
            );


            // Send full message:
            interaction.followUp({
                embeds: [updatedEmbed],
                components: [buttons],
                flags: MessageFlags.Ephemeral
            })

        }

        // 3. Send the sessions the user is training crew:
        for (const [sessionId, sessionData] of Object.entries(sessions_training)) {

            // Create msg embed
            const updatedEmbed = new EmbedBuilder()
                .setColor('#9BE75B')
                .setTitle('📋 - Training Session')
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .addFields(
                    { name: '📆 Date:', value: `<t:${sessionData['date']}:F>\n(<t:${sessionData['date']}:R>)`, inline: true },
                    { name: '📍 Location:', value: `[Event Game](${sessionData['location']})`, inline: true }
                )
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .addFields(
                    { 
                        name: '🎙️ Host:', 
                        value: sessionData['host'] 
                        ? `> <@${sessionData['host']}>\n*(1/1)*` 
                        : '*`Available`* \n *(0/1)*', 
                        inline: true 
                    },
                    { 
                        name: '🤝 Trainers:', 
                        value: sessionData['trainers'] && sessionData['trainers'].length > 0 
                        ? sessionData['trainers'].map(id => `> <@${id}>`).join('\n') + `\n*(${sessionData['trainers'].length}/3)*` 
                        : '*`Available`* \n *(0/3)*', 
                        inline: true 
                    }
                    
                    
                )          
                .addFields( // Spacer
                    { name: ' ', value: ' ' }
                )
                .setFooter({ text: `ID: ${sessionId.toUpperCase()}`, iconURL: interaction.client.user.displayAvatarURL() });

            // Create msg buttons
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`eventLeaveRole:${sessionId}`)
                    .setLabel('🚪 Leave Role')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setLabel('🎮 Game Link')
                    .setURL(sessionData['location'] || 'https://roblox.com') // fallback if null
                    .setStyle(ButtonStyle.Link)
            );


            // Send full message:
            interaction.followUp({
                embeds: [updatedEmbed],
                components: [buttons],
                flags: MessageFlags.Ephemeral
            })

        }


    },
}
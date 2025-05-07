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

        // Load Sessions from Session Manager:
        const sessions = await sessionManager.readSessions();
        console.log('Sessions Loaded from JSONL:')
        console.log(sessions);

        for (const session of sessions) {
            console.log('-------EVENT:-------');
            console.log(`Session ID: ${session.id}`);
            console.log(`Session Date: ${session.date}`);
            console.log(`Session Trainers: ${session.trainers}`);
            console.log(`Session Host: ${session.host}`);
            console.log(`Session Type: ${session.type}`);
        }
        console.log('--------------------');

        // Generate Event Id:
        function generateId() {
            return 'e_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        }

        // Variables:
        const chanel = interaction.channel
        const botAvatar = interaction.client.user.displayAvatarURL();
        const botUsername = interaction.client.user.username;
        const eventId = generateId();


        // Event Embed:
        let event1Date = new Date();
        event1Date.setHours(event1Date.getHours() + 1);
        event1Date.setMinutes(event1Date.getMinutes() + 45);
        const event1timestamp = Math.floor(event1Date.getTime() / 1000);

        const exEvent1Embed = new EmbedBuilder()
            .setColor('#9BE75B')
            .setAuthor({ name: `Training Session:`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .addFields(
                { 
                    name: '📆 Date:', 
                    value: 
                    `<t:${event1timestamp}:F> 
                    (<t:${event1timestamp}:R>)`, 
                    inline: true 
                },
                { 
                    name: '📍 Location:', 
                    value: '    [Game Link](https://roblox.com)', 
                    inline: true 
                },

            )
            .addFields(
                { name: '\u200B', value: '\u200B' }, // Spacer
            )
            .addFields(
                {
                    name: '🎙️ Host:', 
                    value: 
                    `*Available* 
                    (0/1)`, 
                    inline: true},
                { 
                    name: '🤝 Trainers:', 
                    value: 
                    `*Available* 
                    (0/3)`, 
                    inline: true 
                },
            )
            .setFooter({ text: `ID: ${eventId.toUpperCase()}`, iconURL: botAvatar });

        // Event Buttons:
        const eventButtonsRow = new ActionRowBuilder().addComponents(
            // Sign Up:
            new ButtonBuilder()
                .setCustomId(`eventSignup:${eventId}:'ROLE`)
                .setLabel('📝 Sign Up')
                .setStyle(ButtonStyle.Success),
            // Game Link:
            new ButtonBuilder()
                .setLabel('🎮 Game Link')
                .setURL('https://www.roblox.com/games/407106466/Munch-V1')
                .setStyle(ButtonStyle.Link),
        )

        // Send Event List Message:
        await interaction.reply({
            embeds: [exEvent1Embed],
            components: [eventButtonsRow],
            flags: MessageFlags.Ephemeral
        })
    },
}
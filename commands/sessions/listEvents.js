const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle  
} = require('discord.js');

module.exports = {

    // Assign Command:
    data: new SlashCommandBuilder()
        .setName('list-events')
        .setDescription('Lists all training sessions available/occurring soon.')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('The session type')
                .setRequired(true)
                .addChoices(
                    { name: 'Trainings', value: 'trainings_value' },
                    { name: 'Interviews', value: 'interviews_value' },
                    { name: 'Internal', value: 'internal_value' },
                ))
        .setContexts(InteractionContextType.Guild),
    
    // On Execution:
    async execute(interaction){

        // Variables:
        const category = interaction.options.getString('type');
        const chanel = interaction.channel
        const botAvatar = interaction.client.user.displayAvatarURL();
        const botUsername = interaction.client.username;

        // Header Embed:
        const headerEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Please select a session below to view more details')
            .setAuthor({ name: 'Upcoming Sessions:', iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .setDescription('Please select a session below to view more details.')
            .setTimestamp()
            .setFooter({ text: `@${botUsername}`, iconURL: botAvatar });

        // Event Embed:
        const exEvent1Embed = new EmbedBuilder()
            .setColor('Yellow')
            .setAuthor({ name: `${category} Session:`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .addFields(
                { name: '📆 Date:', value: '00/00/00 00:00 XX' },
                { name: '📍 Location:', value: '[Game Link](https://google.com)' },
                { name: '\u200B', value: '\u200B' },
                { name: '🎙️ Host:', value: '**Available** (0/1)' },
                { name: '🤝 Trainers:', value: '**Available** (0/3)' },
            )
            .setTimestamp()
            .setFooter({ text: `@${botUsername}`, iconURL: botAvatar });

        // Event Buttons:
        const eventButtonsRow = new ActionRowBuilder().addComponents(
            // Sign Up:
            new ButtonBuilder()
                .setCustomId('eventX_signup')
                .setLabel('📝 Sign Up')
                .setStyle(ButtonStyle.Success),
            // Game Link:
            new ButtonBuilder()
                .setLabel('🎮 Join Game')
                .setURL('https://www.roblox.com/games/407106466/Munch-V1')
                .setStyle(ButtonStyle.Link),
        )


        await interaction.reply({
            embeds: [headerEmbed, exEvent1Embed],
            components: [eventButtonsRow],
            flags: MessageFlags.Ephemeral
        })
    },
}
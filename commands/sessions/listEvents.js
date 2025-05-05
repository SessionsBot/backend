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
                    { name: 'Trainings', value: 'Trainings' },
                    { name: 'Interviews', value: 'Interviews' },
                    { name: 'Internal', value: 'Internal' },
                ))
        .setContexts(InteractionContextType.Guild),
    
    // On Execution:
    async execute(interaction){

        // Variables:
        const category = interaction.options.getString('type');
        const chanel = interaction.channel
        const botAvatar = interaction.client.user.displayAvatarURL();
        const botUsername = interaction.client.user.username;


        // Event Embed:
        let event1Date = new Date();
        event1Date.setHours(event1Date.getHours() + 1);
        event1Date.setMinutes(event1Date.getMinutes() + 45);
        const event1timestamp = Math.floor(event1Date.getTime() / 1000);

        const exEvent1Embed = new EmbedBuilder()
            .setColor('Yellow')
            .setAuthor({ name: `${category} Session:`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .addFields(
                { name: '📆 Date:', value: `<t:${event1timestamp}:F> (<t:${event1timestamp}:R>)` },
                { name: '📍 Location:', value: '[Game Link](https://google.com)' },
                // { name: '\u200B', value: '\u200B' },
                { name: '🎙️ Host:', value: '**Available** (0/1) /n' },
                { name: '🤝 Trainers:', value: '**Available** (0/3) /n' },
            )
            .setTimestamp()
            .setFooter({ text: `<@${client.user.id}>`, iconURL: botAvatar });

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
            embeds: [exEvent1Embed],
            components: [eventButtonsRow],
            flags: MessageFlags.Ephemeral
        })
    },
}
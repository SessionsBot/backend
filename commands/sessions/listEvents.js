const { EmbedBuilder, InteractionContextType, SlashCommandBuilder, MessageFlags } = require('discord.js');

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

        const category = interaction.options.getString('type');
        const chanel = interaction.channel
        const botAvatar = interaction.client.user.displayAvatarURL();

        const headerEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Upcoming Sessions:')
            .setURL('https://www.roblox.com/communities/1070447/Red-Robin#!/about')
            .setAuthor({ name: 'Sessions', iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
            .setDescription('Please select a session below to view more details.')
            .setTimestamp()
            .setFooter({ text: `${interaction.client.user}`, iconURL: botAvatar });

        await interaction.reply({
            embeds: [headerEmbed],
            flags: MessageFlags.Ephemeral
        })
    },
}
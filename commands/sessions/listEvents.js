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

        const embed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Upcoming Sessions:')
            .setURL('https://www.roblox.com/communities/1070447/Red-Robin#!/about')
            .setAuthor({ name: 'Sessions', iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png', url: 'https://www.roblox.com/communities/1070447/Red-Robin#!/about' })
            .setDescription('Some description here')
            .setThumbnail('https://tr.rbxcdn.com/180DAY-ef6ac1fa59052b50cafb1ff605bb35f8/768/432/Image/Webp/noFilter')
            .addFields(
                { name: 'Regular field title', value: 'Some value here' },
                { name: '\u200B', value: '\u200B' },
                { name: 'Inline field title', value: 'Some value here', inline: true },
                { name: 'Inline field title', value: 'Some value here', inline: true },
            )
            .addFields({ name: 'Inline field title', value: 'Some value here', inline: true })
            .setImage('https://i.imgur.com/AfFp7pu.png')
            .setTimestamp()
            .setFooter({ text: 'Some footer text here', iconURL: 'https://i.imgur.com/AfFp7pu.png' });

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral
        })
    },
}
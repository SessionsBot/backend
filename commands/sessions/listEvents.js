const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-events')
        .setDescription('Lists all training sessions available/occurring soon.')
        .addStringOption(option =>
            option.setName('Type')
                .setDescription('The session type')
                .setRequired(true)
                .addChoices(
                    { name: 'Trainings', value: 'trainings_value' },
                    { name: 'Interviews', value: 'interviews_value' },
                    { name: 'Internal', value: 'internal_value' },
                )),
    async execute(interaction){
        await interaction.reply({
            content: `**Upcoming Events:** /n
            **1.** | **Event Name:** | Event 1 /n
            **2.** | **Event Name:** | Event 2 /n
            **3.** | **Event Name:** | Event 3 /n`,
            flags: MessageFlags.Ephemeral
        })

        await interaction.followUp({
            content: `Follow up message...`,
            flags: MessageFlags.Ephemeral
        });
    },
}
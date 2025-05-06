// const { // Import Discord.js
//     EmbedBuilder, 
//     InteractionContextType, 
//     SlashCommandBuilder, 
//     MessageFlags,
//     ActionRowBuilder, 
//     ButtonBuilder, 
//     ButtonStyle  
// } = require('discord.js');

// module.exports = {

//     data: {
//         customId: 'eventSignup',
//     },
    
//     // On Execution:
//     async execute(interaction){

//         // Parese interaction.customId data:
// 		const interactionData = interaction.customId.split(':');
//         const interactionCustomId = interactionData[0];
// 		const interactionEventId = interactionData[1];

//         const roleChoice = interaction.values

//         // Variables:
//         const chanel = interaction.channel
//         const botAvatar = interaction.client.user.displayAvatarURL();
//         const botUsername = interaction.client.user.username;


//         // Event Embed:
//         const exEvent1Embed = new EmbedBuilder()
//             .setColor('Yellow')
//             .setAuthor({ name: `${category} Session:`, iconURL: 'https://cdn-icons-png.flaticon.com/512/1869/1869397.png' })
//             .addFields(
//                 { name: '📆 Date:', value: `<t:${event1timestamp}:F> 
//                 (<t:${event1timestamp}:R>)` },
//                 { name: '📍 Location:', value: '[Game Link](https://roblox.com)', inline: true },

//             )
//             .addFields(
//                 { name: '\u200B', value: '\u200B' },

//                 { name: '🎙️ Host:', value: '   *Available (0/1)* ' },
//                 { name: '🤝 Trainers:', value: '   *Available (0/3)*', inline: true },
//             )
//             .setFooter({ text: `ID: ${eventId.toUpperCase()}`, iconURL: botAvatar });

//         // Event Buttons:
//         const eventButtonsRow = new ActionRowBuilder().addComponents(
//             // Sign Up:
//             new ButtonBuilder()
//                 .setCustomId(`eventSignup:${eventId}:'ROLE`)
//                 .setLabel('📝 Sign Up')
//                 .setStyle(ButtonStyle.Success),
//             // Game Link:
//             new ButtonBuilder()
//                 .setLabel('🎮 Game Link')
//                 .setURL('https://www.roblox.com/games/407106466/Munch-V1')
//                 .setStyle(ButtonStyle.Link),
//         )

//         // Send Message:
//         await interaction.reply({
//             embeds: [exEvent1Embed],
//             components: [eventButtonsRow],
//             flags: MessageFlags.Ephemeral
//         })
//     },
// }
const { // Import Discord.js
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    PermissionsBitField,
    // [ ↓ V2  COMPONENETS ↓ ] 
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ButtonBuilder,
    ButtonStyle,
    SeparatorSpacingSize,
    ContainerBuilder,
    

} = require('discord.js');

const sessionManager = require('../../utils/sessions/sessionManager');
const global = require('../../global')

// Register Command:
const data = new SlashCommandBuilder()
    .setName('reload-events')
    .setDescription("Refreshes events embeds in announcement channel.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)


// On Command Excecution:
async function execute(interaction) {

    // Send Response - V1:
    async function sendResponseV1(){
        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor(global.colors.warning)
                .setTitle('⚠️ - Command Disabled!')
                .setDescription('Unfortunately this command is not currently operational. . .')
            ],
            flags: MessageFlags.Ephemeral
        })
    }

    // Send Response - V2:
    async function sendResponseV2(){

        const text1 = new TextDisplayBuilder()
            .setContent('#This is a text component!#')

        const separator = new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small);

        const text2 = new TextDisplayBuilder()
            .setContent('`This is a text component!`')


        const confirmButton = new ButtonBuilder()
            .setCustomId('refresh-events-button')
            // .setLabel('Confirm')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅')
        

        const section1 = new SectionBuilder()
            .addComponents(text1, text2)
            .setAccessory(confirmButton);

        const section2 = new SectionBuilder()
            .addComponents(text2);
        const container1 = new ContainerBuilder()
            .addComponents(
                section1,
                separator,
                section2,
                separator
            );

        // Send:
        await interaction.reply({
            flags: MessageFlags.IsComponentsV2,
            components: [container1]
        })

        // Delete:
        setTimeout(async () => {
            await interaction.deleteReply().then().catch(error => {
                console.log('Failed to delete reload events interaction reply:');
                console.log(error)
            })
        }, 15_000);
    }

   
    try { // Respond / Refresh Events:
        
        // Attemot Component V2 Response:
        await sendResponseV2();

    } catch (error) { // Error Occured:
        console.log('[!] An Error Occured - /reload-events');
        console.log(error);
    }
    
}

module.exports = {
    data,
    execute
};

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

        // Message Elements:
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        const titleText = new TextDisplayBuilder()
            .setContent('## 📅  Your Events:')

        const descText = new TextDisplayBuilder()
            .setContent(`-# Below are the events you're currently signed up for:`)

        // const topTitleSection = new SectionBuilder()
        //     .addTextDisplayComponents(titleText)

        container.setAccentColor(0xeb8334)
        container.addTextDisplayComponents(titleText)
        // container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(descText)
        container.addSeparatorComponents(separator)

        //Example Event:
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('⏰:  <t:1747218600:F>    💼:  `Training Crew`'))
                .setButtonAccessory(new ButtonBuilder().setCustomId('view-event:exid172839112').setEmoji('👁️').setStyle(ButtonStyle.Success))
        )

        container.addSeparatorComponents(separator)

        //Example Event:
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('⏰:  <t:1747251000:F>    💼:  `Training Crew`'))
                .setButtonAccessory(new ButtonBuilder().setCustomId('view-event:exid249782234').setEmoji('👁️').setStyle(ButtonStyle.Success))
        )

        //Footer:
        container.addSeparatorComponents(separator)
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# End of list'))
        
            

        // Send:
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container]
        })

        // Delete:
        // setTimeout(async () => {
        //     await interaction.deleteReply().then().catch(error => {
        //         console.log('Failed to delete reload events interaction reply:');
        //         console.log(error)
        //     })
        // }, 15_000);
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

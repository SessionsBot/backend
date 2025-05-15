const {
    EmbedBuilder, 
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SectionBuilder,
    SeparatorBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
} = require('discord.js'); // Import Discord.js

const sessionManager = require('../../utils/sessions/sessionManager'); // Import Session Manager
const global = require('../../global'); // Import Global Variables

// Register Command:
const data = new SlashCommandBuilder()
    .setName('my-events')
    .setDescription("Lists your currently assigned events with respective options.")
    .setContexts(InteractionContextType.Guild)


// Custom Response Methods:
const responseMethods = { 
    // Send User-Assigned Event List:
    sendUsersEvents: async (interaction, eventsHosting, eventsTraining) => {
        // Message Elements:
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        const eventCount = (Object.entries(eventsHosting).length + Object.entries(eventsTraining).length)

        const titleText = new TextDisplayBuilder()
            .setContent('## 📅  Your Events:')

        const descText = new TextDisplayBuilder()
            .setContent(`-# Events you're currently assigned to are listed below:`)

        // Color & Ttitle:
        container.setAccentColor(0x3bc2d1)
        container.addTextDisplayComponents(titleText)
        container.addTextDisplayComponents(descText)
        container.addSeparatorComponents(separator)

        // Add Hosting Role Sessions:
        for (const [sessionId, sessionData] of Object.entries(eventsHosting)) {
            // Add Event Details & Removal Button:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏰:  <t:${sessionData['date']}:F>` + '\n\n💼:, *`Event Host`* \n '))
            container.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eventLeaveRole:${sessionId}`)
                        .setEmoji('❌')
                        .setLabel('Remove')
                        .setStyle(ButtonStyle.Secondary)
                )
            )
            container.addSeparatorComponents(separator)
        }

        // Add Trainer Role Sessions:
        for (const [sessionId, sessionData] of Object.entries(eventsTraining)) {
            // Add Event Details & Removal Button:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`⏰:  <t:${sessionData['date']}:F>` + '\n\n💼:, *`Trainer Crew`* \n '))
            container.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`eventLeaveRole:${sessionId}`)
                        .setEmoji('❌')
                        .setLabel('Remove')
                        .setStyle(ButtonStyle.Secondary)
                )
            )
            container.addSeparatorComponents(separator)
        } 
        
        // Footer - Event Count:
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Total Events: ${eventCount}`))

        // Send:
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container]
        })
    },

    // Send No Assigned Events Alert:
    sendNoEventsAlert: async (interaction) => {
        // Message Elements:
        const container = new ContainerBuilder()
        const separator = new SeparatorBuilder()

        // Title
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ No Events Assigned:'))
        container.setAccentColor(0xfc9d03)
        // Spacer
        container.addSeparatorComponents(separator) 
        // Info:
        container.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`**You're currently not assigned to any events!** \n-\nTo view available events for sign up please visit this channel: <#${global.event_channelId}>.`)
        )
        // Spacer
        container.addSeparatorComponents(separator) 
        // Footer:
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# This message will be deleted in 15s.'))
        
            

        // Send:
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [container]
        })

        // Delete:
        setTimeout(async () => {
            await interaction.deleteReply().then().catch(error => {
                console.log('Failed to delete interaction reply - /my-events:');
                console.log(error)
            })
        }, 15_000);
    }
}


// On Command Excecution:
async function execute(interaction) { try {

    // Variables:
    const userId = interaction.user.id
    let sessions_userHosting = {};
    let sessions_userTraining = {};
    let sessionCount = 0;

    // Defer early to give yourself time:
        // await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Load all sessions:
    const allSessionsData = await sessionManager.readSessions()

    // Check each session for user signed up:
    for (const [sessionId, sessionData] of Object.entries(allSessionsData)){
        // Check if Event Host:
        if(sessionData['host'] === userId) {
            sessions_userHosting[`${sessionId}`] = sessionData;
            sessionCount += 1;
        }
        // Check if Training Crew:
        if(sessionData['trainers'].includes(userId)) {
            sessions_userTraining[`${sessionId}`] = sessionData;
            sessionCount += 1;
        }
    }

    // Check Session Count & Respond:
    if(sessionCount >= 1){ // User Assigned Sessions:
        await responseMethods.sendUsersEvents(interaction, sessions_userHosting, sessions_userTraining)
    } else { // User NOT Assigned Sessions:
        await responseMethods.sendNoEventsAlert(interaction)
    } 
        
} catch (error) { // Error Occured:
    console.log('[!] An Error Occured - /my-events');
    console.log(error);
}}

module.exports = {
    data,
    execute
};

const {
    InteractionContextType, 
    SlashCommandBuilder, 
    MessageFlags,
    SeparatorBuilder,
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ContainerBuilder,
    ComponentType,
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
    // Get Update Events Container:
    getUpdatedEventsList: async (interaction, allSessionsData) => {
        // Load all sessions:
        const eventsHosting = {};
        const eventsTraining = {};
        let eventCount = 0;
        const userId = interaction.user.id
        const guildId = interaction.guildId
        

        // Check each session data for user signed up:
        for (const [sessionId, sessionData] of Object.entries(allSessionsData)){
            // Check if Event Host:
            if(sessionData['host'] === userId) {
                eventsHosting[`${sessionId}`] = sessionData;
                eventCount += 1;
            }
            // Check if Training Crew:
            if (Array.isArray(sessionData.trainers) && sessionData.trainers.includes(userId)) {
                eventsTraining[`${sessionId}`] = sessionData;
                eventCount += 1;
            }
        }

        // Check if user has events:
        if(eventCount >= 1){ // Assigned Events:

            const container = new ContainerBuilder()
            const separator = new SeparatorBuilder()

            const titleText = new TextDisplayBuilder()
                .setContent('## 📅  Your Events:')

            const descText = new TextDisplayBuilder()
                .setContent(`-# Events you're currently assigned to are listed below:`)

            // Color & Ttitle:
            container.setAccentColor(0x3bc2d1)
            container.addTextDisplayComponents(titleText)
            container.addTextDisplayComponents(descText)
            container.addSeparatorComponents(separator)

            // Local Function For Each Event Row:
            let thisEventIndex = 0;
            async function createEventRow(sessionId, dateString, roleString) {
                thisEventIndex += 1;
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${dateString}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
                container.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`startLeaveEventRole:${sessionId}`)
                            // .setEmoji('❌')
                            .setLabel('Remove')
                            .setStyle(ButtonStyle.Primary)
                    )
                )
                container.addSeparatorComponents(separator)
            }

            // Add Hosting Role Sessions:
            for (const [sessionId, sessionData] of Object.entries(eventsHosting)) { await createEventRow(sessionId, sessionData['date'], 'Event Host') }

            for (const [sessionId, sessionData] of Object.entries(eventsTraining)) { await createEventRow(sessionId, sessionData['date'], 'Trainer Crew') }
            
            // Footer - Event Count:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Total Events: ${eventCount}`))

            // RETURN MSG CONTAINER:
            return container

        } else { // Not Assigned Events:

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
            // container.addSeparatorComponents(separator) 
            // // Footer:
            // container.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# This message will be deleted in 15s.'))

            // RETURN MSG CONTAINER:
            return container
        }
    }
}


// On Command Excecution:
async function execute(interaction) { 
    try { // Safley Excecute
        // Get guild sessions data:
        let allSessionsData = await sessionManager.getSessions(interaction.guildId)


        // Respond to Cmd - Event List or No Events Alert:
        const eventListContainer = await responseMethods.getUpdatedEventsList(interaction, allSessionsData)
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [eventListContainer]
        })

        // Await any further interactions:
        const reply = await interaction.fetchReply();
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        // On Interaction Collection:
        collector.on('collect', async (collectorInteraction) => {
            // // Defer Colector Response:
            await collectorInteraction.deferUpdate().catch((err) => { // Defer Response:
                console.log(`{!} Error Deffering: - /${interaction.commandName}:`)
                console.log(err)
            });

            // Parse Interaction Data:
            const [interactionID, eventID] = collectorInteraction.customId.split(':');

            if(interactionID == 'startLeaveEventRole') { // START CONFIRMATION - Event Role Removal Confirmation

                const eventData = allSessionsData[eventID]
                if(!eventData) {return console.log(`{!} Cannot find session data for role removal confirmation!`)}

                const usersRoleName = function() { // Get Role String from Event Data
                    // Event Host:
                    if (eventData['host'] === collectorInteraction.user.id) {
                        return 'Event Host'
                    }
                    // Training Crew:
                    if (eventData['trainers'].includes(collectorInteraction.user.id)) {
                        return 'Training Crew'
                    }
                    // Unknown:
                    return 'Unknown'
                }

                // Ask for Confirmation:
                const confirmContainer = new ContainerBuilder()
                confirmContainer.setAccentColor(0xfc9d03)
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Please Confirm:'))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('Are you sure you would like to ***unassign*** yourself from this role?')) 
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${eventData['date']}:F>` + '\n\n### 💼:  **`'+ usersRoleName() +'`** \n '))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addActionRowComponents(
                    new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirmEventRemoval:${eventID}`)
                            .setLabel('REMOVE')
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId(`cancelEventRemoval:${eventID}`)
                            .setLabel('Go Back')
                            .setEmoji('↩️')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false)
                    )
                )

                await interaction.editReply({
                    components:[confirmContainer]
                })
            }

            if(interactionID == 'confirmEventRemoval') { // CONFIRMED - Event Role Removal Confirmation String()
                // Attempt Removal:
                const updateData = await sessionManager.removeUserFromSessionRole(String(collectorInteraction.guildId), String(eventID), String(collectorInteraction.user.id)) //.removePlayerFromEventById(eventID, collectorInteraction.user.id)

                // Build Message Response:
                const removalResponseContainer = new ContainerBuilder()
                if (updateData[0]) { // Role Removal Success:
                    removalResponseContainer.setAccentColor(0x6dc441)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - Success ✅'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('*`You have successfully removed yourself as an attendee from this event!`*'))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${eventID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelEventRemoval:${eventID}`)
                                .setLabel(' -  My Events')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(false)
                        )
                    )

                } else { // Role Removal Error:
                    removalResponseContainer.setAccentColor(0xd43f37)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - ERROR ⚠️'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("*`An error occured while trying to remove yourself from this event, are you sure you're assigned it?`*"))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${eventID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelEventRemoval:${eventID}`)
                                .setLabel(' -  My Events')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(false)
                        )
                    )

                }

                // Send Response:
                await interaction.editReply({
                    components: [removalResponseContainer]
                })
            }

            if(interactionID == 'cancelEventRemoval') { // REJECTED - Event Role Removal Confirmation 
                // Edit Message w/ Response:
                allSessionsData = await sessionManager.getSessions(collectorInteraction.guildId)
                const eventListContainer = await responseMethods.getUpdatedEventsList(collectorInteraction, allSessionsData)
                await interaction.editReply({
                    components: [eventListContainer]
                })
            }

        })

        
    } catch (error) { // Error Occured:
        console.log('[!] An Error Occured - /my-events');
        console.log(error);
    }
}

// Exports:
module.exports = {
    data,
    execute
};

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
const global = require('../../utils/global'); // Import Global Variables

// Register Command:
const data = new SlashCommandBuilder()
    .setName('my-sessions')
    .setDescription("Lists your currently assigned sessions with respective options.")
    .setContexts(InteractionContextType.Guild)


// Custom Response Methods:
const responseMethods = { 
    // Get Update Sessions Container:
    getUpdatedSessionsList: async (interaction, allSessionsData) => {
        // Load all sessions:
        const sessionsHosting = {};
        const sessionsTraining = {};
        let sessionCount = 0;
        const userId = interaction.user.id
        const guildId = interaction.guildId
        let sessionSignUp_Channel = allSessionsData.guildData.sessionSignUp_Channel || 'unknown?'
        

        // Check each session data for user signed up:
        for (const [sessionId, sessionData] of Object.entries(allSessionsData)){
            // Check if Session Host:
            if(sessionData['host'] === userId) {
                sessionsHosting[`${sessionId}`] = sessionData;
                sessionCount += 1;
            }
            // Check if Training Crew:
            if (Array.isArray(sessionData.trainers) && sessionData.trainers.includes(userId)) {
                sessionsTraining[`${sessionId}`] = sessionData;
                sessionCount += 1;
            }
        }

        // Check if user has sessions:
        if(sessionCount >= 1){ // Assigned Sessions:

            const container = new ContainerBuilder()
            const separator = new SeparatorBuilder()

            const titleText = new TextDisplayBuilder()
                .setContent('## 📅  Your Sessions:')

            const descText = new TextDisplayBuilder()
                .setContent(`-# Sessions you're currently assigned to are listed below:`)

            // Color & Ttitle:
            container.setAccentColor(0x3bc2d1)
            container.addTextDisplayComponents(titleText)
            container.addTextDisplayComponents(descText)
            container.addSeparatorComponents(separator)

            // Local Function For Each Session Row:
            let thisSessionIndex = 0;
            async function createSessionRow(sessionId, dateString, roleString) {
                thisSessionIndex += 1;
                container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${dateString}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
                container.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setCustomId(`startLeaveSessionRole:${sessionId}`)
                            // .setEmoji('❌')
                            .setLabel('Remove')
                            .setStyle(ButtonStyle.Primary)
                    )
                )
                container.addSeparatorComponents(separator)
            }

            // Add Hosting Role Sessions:
            for (const [sessionId, sessionData] of Object.entries(sessionsHosting)) { await createSessionRow(sessionId, sessionData['date'], 'Session Host') }

            for (const [sessionId, sessionData] of Object.entries(sessionsTraining)) { await createSessionRow(sessionId, sessionData['date'], 'Trainer Crew') }
            
            // Footer - Session Count:
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Total Sessions: ${sessionCount}`))

            // RETURN MSG CONTAINER:
            return container

        } else { // Not Assigned Sessions:

            const container = new ContainerBuilder()
            const separator = new SeparatorBuilder()

            // Title
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ No Sessions Assigned:'))
            container.setAccentColor(0xfc9d03)
            // Spacer
            container.addSeparatorComponents(separator) 
            // Info:
            container.addTextDisplayComponents(new TextDisplayBuilder()
                .setContent(`**You're currently not assigned to any sessions!** \n-\nTo view available sessions for sign up please visit: <#${sessionSignUp_Channel}>.`)
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


        // Respond to Cmd - Session List or No Sessions Alert:
        const sessionListContainer = await responseMethods.getUpdatedSessionsList(interaction, allSessionsData)
        await interaction.reply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [sessionListContainer]
        })

        // Await any further interactions:
        const reply = await interaction.fetchReply();
        const collector = reply.createMessageComponentCollector({
            componentType: ComponentType.Button,
        });

        // On Interaction Collection:
        collector.on('collect', async (collectorInteraction) => {
            // Defer Colector Response:
            await collectorInteraction.deferUpdate().catch((err) => { // Defer Response:
                console.log(`{!} Error Deffering: - /${interaction.commandName}:`)
                console.log(err)
            });

            // Parse Interaction Data:
            const [interactionID, sessionID] = collectorInteraction.customId.split(':');

            if(interactionID == 'startLeaveSessionRole') { // START CONFIRMATION - Session Role Removal Confirmation

                const sessionData = allSessionsData[sessionID]
                if(!sessionData) {return console.log(`{!} Cannot find session data for role removal confirmation!`)}

                const usersRoleName = function() { // Get Role String from Session Data
                    // Session Host:
                    if (sessionData['host'] === collectorInteraction.user.id) {
                        return 'Session Host'
                    }
                    // Training Crew:
                    if (sessionData['trainers'].includes(collectorInteraction.user.id)) {
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
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${sessionData['date']}:F>` + '\n\n### 💼:  **`'+ usersRoleName() +'`** \n '))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addActionRowComponents(
                    new ActionRowBuilder()
                    .setComponents(
                        new ButtonBuilder()
                            .setCustomId(`confirmSessionRemoval:${sessionID}`)
                            .setLabel('REMOVE')
                            .setEmoji('🗑️')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId(`cancelSessionRemoval:${sessionID}`)
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

            if(interactionID == 'confirmSessionRemoval') { // CONFIRMED - Session Role Removal Confirmation String()
                // Attempt Removal:
                const updateData = await sessionManager.removeUserFromSessionRole(String(collectorInteraction.guildId), String(sessionID), String(collectorInteraction.user.id)) //.removePlayerFromSessionById(sessionID, collectorInteraction.user.id)

                // Build Message Response:
                const removalResponseContainer = new ContainerBuilder()
                if (updateData[0]) { // Role Removal Success:
                    removalResponseContainer.setAccentColor(0x6dc441)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - Success ✅'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('*`You have successfully removed yourself as an attendee from this session!`*'))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${sessionID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel(' -  My Sessions')
                                .setEmoji('📋')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(false)
                        )
                    )

                } else { // Role Removal Error:
                    removalResponseContainer.setAccentColor(0xd43f37)
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 👋 Role Removal - ERROR ⚠️'))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("*`An error occured while trying to remove yourself from this session, are you sure you're assigned it?`*"))
                    removalResponseContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# (${sessionID})`))
                    removalResponseContainer.addSeparatorComponents(new SeparatorBuilder())
                    removalResponseContainer.addActionRowComponents(
                        new ActionRowBuilder()
                        .setComponents(
                            new ButtonBuilder()
                                .setCustomId(`cancelSessionRemoval:${sessionID}`)
                                .setLabel(' -  My Sessions')
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

            if(interactionID == 'cancelSessionRemoval') { // REJECTED - Session Role Removal Confirmation 
                // Edit Message w/ Response:
                allSessionsData = await sessionManager.getSessions(collectorInteraction.guildId)
                const sessionListContainer = await responseMethods.getUpdatedSessionsList(collectorInteraction, allSessionsData)
                await interaction.editReply({
                    components: [sessionListContainer]
                })
            }

        })

        
    } catch (error) { // Error Occured:
        console.log('[!] An Error Occured - /my-sessions');
        console.log(error);
    }
}

// Exports:
module.exports = {
    data,
    execute
};

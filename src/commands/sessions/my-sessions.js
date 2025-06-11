// --------------------- [Imports/Variables] --------------------- \\

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
const guildManager = require('../../utils/guildManager.js'); // Import Guild Manager
const global = require('../../utils/global.js'); // Import Global Variables

// Bot Responses - Get Contents:
const getContents = (interaction) => {return {
    
    signupFollowUp: async (guildData, signupThreadId, signupMessageId) => {
        // Guild Data:
        const accentColor = Number(guildData?.['accentColor'] || 0xfc9d03);
        const markdownLink = `[Signup Panel](https://discord.com/channels/${interaction.guild.id}/${signupThreadId}/${signupMessageId})`;

        // Build Response Container:
        const msgContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('### 📝 Signup Now'))
        // Desc:
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Want to sign up for more sessions?'))
        // Accent Color:
        msgContainer.setAccentColor(0x6dc441)
        // Spacer
        msgContainer.addSeparatorComponents(separator)
        // Info
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`View our latest ${markdownLink} to join available sessions!`)
        )
        // Spacer
        msgContainer.addSeparatorComponents(separator)

        // Return Full Container:
        return msgContainer
    }

}}

// Bot Responses - Send Response:
const respond = (interaction) => {return {

    userSessionsList: async (guildData) => {

        // Guild Data:
        const accentColor = Number(guildData?.['accentColor'] || 0xfc9d03);
        const sessionsignupThreadId = guildData?.['sessionSignup']['signupThreadId'];
        const sessionSignupMessageId = guildData?.['sessionSignup']['signupMessageId'];
        
        // Get User's Sessions:
        const guildSessions = guildData['upcomingSessions']
        let userSessions = {};
        if (!guildSessions || !typeof guildSessions === 'object' ) { // Invalid Sessions:
            // Respond:
            respond(interaction).commandError('Could not find any upcoming sessoions for this guild, if this is incorrect please contact an administrator.')
            // Log Error:
            console.log(`{?} [/${interaction.commandName}] Invalid/No Sessions Recevied for Command Interaction:`)
            console.log(guildSessions)
        }
        for(const [sessionId, sessionData] of Object.entries(guildSessions)) { // Check each session for user assigned a role:
            const sessionRoles = sessionData?.['roles'];
            if(sessionRoles && Array.isArray(sessionRoles)) {
                sessionRoles.forEach(role => { // Check each session role for the user signed up:
                    if(role['users'].includes(interaction.user.id)) {
                        // User assigned this role - Add session to user sessions:
                        userSessions[sessionId] = sessionData;
                        userSessions[sessionId]['roleName'] = role['roleName'];
                    }
                })
            }
        };


        // Build Session List Container:
        const userSessionsContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        userSessionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 📥  My Sessions'))
        // Desc:
        userSessionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Your currently assigned sessions:`))
        // Accent Color:
        userSessionsContainer.setAccentColor(accentColor)
        // Spacer
        userSessionsContainer.addSeparatorComponents(separator)

        // Local Function For Each Session Row:
        async function createSessionRow(sessionId, dateString, roleString) {
            userSessionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${dateString}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
            userSessionsContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
            userSessionsContainer.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`startLeaveSessionRole:${sessionId}:${roleString}`)
                        .setLabel('❌ Remove')
                        .setStyle(ButtonStyle.Primary)
                )
            )
            userSessionsContainer.addSeparatorComponents(separator)
        }

        // Session List:
        if(Object.entries(userSessions).length >= 1) { // Confirm user assigned 1+ session(s):
            // Sort Sessions:
            const sortedSessions = Object.entries(userSessions).sort((a, b) => a[1]['date']['discordTimestamp'] - b[1]['date']['discordTimestamp']);
            for(const [sessionId, sessionData] of sortedSessions) { await createSessionRow(sessionId, sessionData['date']['discordTimestamp'], sessionData['roleName']) }
        } else { // User not assigned to any sessions:
            userSessionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`🥺 *You're not currently assigned to any sessions!*`))
            userSessionsContainer.addSeparatorComponents(separator)
        }
        
        // Get Signup Follow Up Embed - if MsgId:
        if(!sessionSignupMessageId || !sessionsignupThreadId) {
            // Send Without:
            await interaction.editReply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [userSessionsContainer]
            })
        } else { 
            let signUpContainer = await getContents(interaction).signupFollowUp(guildData, sessionsignupThreadId, sessionSignupMessageId) 
            // Send Response:
            await interaction.editReply({
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
                components: [userSessionsContainer, signUpContainer]
            })
        }
    },

    commandError: async (detailString) => {
        // Build Response Container:
        const msgContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Command Error:'))
        msgContainer.setAccentColor(0xfc9d03)
        // Spacer
        msgContainer.addSeparatorComponents(separator) 
        // Info
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`*${detailString}*.`)
        )

        // Send Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [msgContainer]
        })
    },
    
}}

// --------------------- [Command/Excecution] --------------------- \\

// Register Command:
const data = new SlashCommandBuilder()
    .setName('my-sessions')
    .setDescription("Lists your currently assigned sessions with respective options.")
    .setContexts(InteractionContextType.Guild)

// On Command Excecution:
async function execute(interaction) { 
    try {
        // Defer Response:
        await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch((err) => { // Error Deffering:
            console.log(`{!} Couldn't defer /my-sessions response:`)
            console.log(err)
        });

        // Send Session List:
        const guildRetrieval = await guildManager.guilds(interaction.guild.id).readGuild()
        if(guildRetrieval.success){ // Retrieval Success:
            if(global.outputDebug_InDepth) { console.log('Retrieval Success:'); console.log(guildRetrieval); }
            await respond(interaction).userSessionsList(guildRetrieval.data)
        }else{ // Retrieval Error:
            if(global.outputDebug_InDepth) { console.log('Retrieval Error:'); console.log(guildRetrieval); }
            await respond(interaction).commandError(guildRetrieval.data)
        }

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

            // START CONFIRMATION:
            if(interactionID == 'startLeaveSessionRole') { // Session Role Removal Confirmation
            
                const [interactionID, sessionID, roleString] = collectorInteraction.customId.split(':');
                const sessionDate = guildRetrieval.data['upcomingSessions']?.[sessionID]?.['date']?.['discordTimestamp'] || 'Unknown Date'

                // Ask for Confirmation:
                const confirmContainer = new ContainerBuilder()
                confirmContainer.setAccentColor(0xfc9d03)
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Please Confirm:'))
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('Are you sure you would like to ***unassign*** yourself from this role?')) 
                confirmContainer.addSeparatorComponents(new SeparatorBuilder())
                confirmContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${sessionDate}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
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

            // CONFIRMED REMOVAL:
            if(interactionID == 'confirmSessionRemoval') { // CONFIRMED - Session Role Removal Confirmation String()
                // Attempt Removal:
                const removalAttempt = await guildManager.guildSessions(String(interaction.guild.id)).removeUserSessionRole(sessionID, String(interaction.user.id)) //sessionManager.removeUserFromSessionRole(String(collectorInteraction.guildId), String(sessionID), String(collectorInteraction.user.id)) //.removePlayerFromSessionById(sessionID, collectorInteraction.user.id)

                // Build Message Response:
                const removalResponseContainer = new ContainerBuilder()
                if (removalAttempt.success) { // Role Removal Success:
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
                        )
                    )

                }

                // Send Response:
                await interaction.editReply({
                    components: [removalResponseContainer]
                })
            }

            // REJECTED/CANCELD:
            if(interactionID == 'cancelSessionRemoval') { // Session Role Removal Confirmation 
                // Send Session List:
                const guildRetrieval = await guildManager.guilds(interaction.guild.id).readGuild()
                if(guildRetrieval.success){ // Retrieval Success:
                    if(global.outputDebug_InDepth) { console.log('Retrieval Success:'); console.log(guildRetrieval); }
                    await respond(interaction).userSessionsList(guildRetrieval.data)
                }else{ // Retrieval Error:
                    if(global.outputDebug_InDepth) { console.log('Retrieval Error:'); console.log(guildRetrieval); }
                    await respond(interaction).commandError(guildRetrieval.data)
                }
            }

        })

    } catch (e) {
        // Send Error Response:
        const msgContainer = new ContainerBuilder()
        const separator = new SeparatorBuilder()
        // Title
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent('## ❗️ Command Error:'))
        msgContainer.setAccentColor(0xfc9d03)
        // Spacer
        msgContainer.addSeparatorComponents(separator) 
        // Info
        msgContainer.addTextDisplayComponents(new TextDisplayBuilder()
            .setContent(`*This command failed execution, please try again in a little while. If this issue persists please contact an administrator*.`)
        )

        // Send Response:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [msgContainer]
        })

        // Log Error:
        console.log(`{!} [/${interaction.commandName}] An error occured:`)
        console.log(e)
    }
}

// Exports:
module.exports = {
    data,
    execute
};

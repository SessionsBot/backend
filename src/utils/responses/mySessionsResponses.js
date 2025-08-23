import {
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
} from 'discord.js'; // Import Discord.js

import guildManager from "../guildManager.js";
import global from "../global.js";
import {  DateTime  } from "luxon";
;

export default {
    // Bot Responses - Get Contents:
    getContents: (interaction) => {return {
        
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
    
    }},
    
    // Bot Responses - Send Response:
    respond: (interaction) => {return {
    
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
                respond(interaction).commandError('Could not find any upcoming sessions for this guild, if this is incorrect please contact an administrator.')
                // Log Error:
                console.log(`{?} [/${interaction.commandName}] Invalid/No Sessions Received for Command Interaction:`)
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
                // Check for Past Session:
                const nowUTCSeconds = DateTime.now().toUnixInteger()
                const pastSession = nowUTCSeconds >= Number(dateString)

                userSessionsContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ⏰:  <t:${dateString}:F>` + '\n\n### 💼:  **`'+ roleString +'`** \n '))
                userSessionsContainer.addSeparatorComponents( new SeparatorBuilder().setDivider(false) ) // Invisible Spacer
                if(!pastSession){ 
                    userSessionsContainer.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`startLeaveSessionRole:${sessionId}:${roleString}`)
                                .setLabel('📤 Unassign')
                                .setStyle(ButtonStyle.Secondary)
                        )
                    )
                }else {
                    userSessionsContainer.addActionRowComponents(
                        new ActionRowBuilder().addComponents(
                            new ButtonBuilder()
                                .setCustomId(`startLeaveSessionRole:${sessionId}:${roleString}`)
                                .setLabel('⌛️ Past Session')
                                .setDisabled(true)
                                .setStyle(ButtonStyle.Secondary)
                        )
                    )
                }
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
}
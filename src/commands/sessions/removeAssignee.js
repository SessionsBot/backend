import { AutocompleteInteraction, CommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import guildManager from "../../utils/guildManager.js";
import { DateTime } from "luxon";

// Define Command:
const data = new SlashCommandBuilder()
    .setName('remove-assignee')
    .setDescription("Removes a users from any role within a specified session.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) // Default permission
    .addUserOption(option => option.setName('user')
        .setDescription('The user to remove any roles from.')
        .setRequired(true)
    )
    .addStringOption(option => option.setName('session')
        .setDescription('The session to remove the user from.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setContexts(InteractionContextType.Guild)

/** Command Execution: 
 * @param {CommandInteraction} interaction
*/
async function execute(interaction) {
    const selectedUser = interaction.options.getUser('user');
    const selectedSessionId = interaction.options.getString('session');


    // Attempt role assign:
    const removeResult = await guildManager.guildSessions(interaction.guild.id).removeUserSessionRole(selectedSessionId, selectedUser?.id)
    if(removeResult.success){ // Succeeded:
        interaction.reply({
            components: [new ContainerBuilder()
                .setAccentColor(0x6dc441)
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## ✅ Role Removed!`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `### 📌 Session: \`${removeResult?.sessionData?.title}\` \n ### 👤 User: \<@${selectedUser.id}>`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `-# This message will be deleted in 15 seconds.`}))

            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        })

        // Delete after 15 secs:
        try { 
            setTimeout(()=> interaction.deleteReply(), 15_000) 
        } catch(e){}

    }else { // Failed:
        interaction.reply({
            components: [new ContainerBuilder()
                .setAccentColor(0xd43f37)
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## ❌ Failed to Remove!`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `### 📌 Session: \`${removeResult?.sessionData?.title}\` \n ### 👤 User: \<@${selectedUser.id}>`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Details: ${removeResult.data}`}))
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        })
    }
}

/** Autocomplete - Command Input 
 * @param {AutocompleteInteraction} interaction
*/
async function autocomplete(interaction) { try {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];

    // Session Date / Id
    if(focusedOption.name == 'session'){
        // Get & confirm guild data:
        const guildDataFetch = await guildManager.guilds(interaction.guild.id).readGuild()
        if(!guildDataFetch.success || !Object.entries(guildDataFetch.data.upcomingSessions)){
            // Failed - no guild sessions:
            console.log('Auto complete found no sessions/data!')
            return interaction.respond([]);
        }

        /** @type {[string, import('@sessionsbot/api-types').UpcomingSession][]} */
        const upcomingSessions = Object.entries(guildDataFetch.data.upcomingSessions)
        const guildTimeZone = guildDataFetch.data?.timeZone || 'America/Chicago'

        // Get Tile & Time for Session:
        for (const [sessionId, sessionData] of upcomingSessions) {
            const sessionTitle = sessionData?.title
            const sessionDateString = DateTime.fromSeconds(Number(sessionData.date?.discordTimestamp)).setZone(guildTimeZone).toFormat("MMM dd, hh:mm a");
            // Confirm roles in session:
            if(!sessionData?.roles?.length) continue
            else choices.push({
                name: sessionTitle + ' - ' + sessionDateString,
                value: sessionId
            });
        }

        // Filter based on user input
        const filtered = choices.filter(c =>
            c.name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );

        return interaction.respond(filtered)

    }

} catch(err) { // Autocomplete Error:
    console.log('{!} Autocomplete error!', {user: interaction?.user?.username, cmd: interaction?.command?.name}, err);
}}


export default {
    data,
    execute,
    autocomplete
}
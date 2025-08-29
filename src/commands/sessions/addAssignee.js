import { AutocompleteInteraction, CommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import guildManager from "../../utils/guildManager.js";
import { DateTime } from "luxon";

// Define Command:
const data = new SlashCommandBuilder()
    .setName('add-assignee')
    .setDescription("Adds a users to a specified role within a session.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers) // Default permission
    .addUserOption(option => option.setName('user')
        .setDescription('The user to assign a new role to.')
        .setRequired(true)
    )
    .addStringOption(option => option.setName('session')
        .setDescription('The session to assign the user to.')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option => option.setName('role')
        .setDescription('The role to assign the user to.')
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
    const selectedRoleName = interaction.options.getString('role');

    // Attempt role assign:
    const assignResult = await guildManager.guildSessions(interaction.guild.id).assignUserSessionRole(selectedSessionId, selectedUser.id, selectedRoleName)
    if(assignResult.success){ // Succeeded:
        interaction.reply({
            components: [new ContainerBuilder()
                .setAccentColor(0x6dc441)
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## ✅ Role Assigned!`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `### 📌 Session: \`${assignResult?.sessionData?.title}\` \n ### 👤 User: \<@${selectedUser.id}>`}))
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
                .addTextDisplayComponents(new TextDisplayBuilder({content: `## ❌ Failed to Assign!`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `### 📌 Session: \`${assignResult?.sessionData?.title}\` \n ### 👤 User: \<@${selectedUser.id}>`}))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Details: ${assignResult.data}`}))
            ],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        })
    }
}

/** Autocomplete - Command Input 
 * @param {AutocompleteInteraction} interaction
 * 
 * @issue Fix time-zoning... fetch guild data instead of just sessions
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

        console.log('Autocomplete data', {upcomingSessions, guildTimeZone});

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

    // Session Role / Id
    if(focusedOption.name == 'role'){
        // Get selected session id?
        const sessionId = interaction.options.getString("session"); // what they picked before
        if (!sessionId) { return interaction.respond([])}

        // Get / confirm guild sessions:
        const guildsSessionsFetch = await guildManager.guildSessions(interaction.guild.id).getSessions()
        if(!guildsSessionsFetch.success || !Object.entries(guildsSessionsFetch?.data)?.length) {
            // Failed / no guild sessions:
            return interaction.respond([]);
        }
        
        /** @type {[string, import('@sessionsbot/api-types').UpcomingSession][]} */
        const upcomingSessions = Object.entries(guildsSessionsFetch.data)
        const reqSession = upcomingSessions.find(ses => ses[0] == sessionId);
        if(!reqSession) return interaction.respond([])
        /** @type {import('@sessionsbot/api-types').UpcomingSession} */
        const sessionData = reqSession[1]
        const sessionRoles = sessionData?.roles

        sessionRoles.forEach(role => {
            choices.push({
                name: role?.roleName,
                value: role?.roleName
            })
        })

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
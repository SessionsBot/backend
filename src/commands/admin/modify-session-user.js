const { 
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    SectionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
} = require('discord.js'); // Import Discord.js

const sessionManager = require('../../utils/sessions/sessionManager.js'); // Import Session Manager
const guildManager = require('../../utils/guildManager.js') // Import Guild Manager
const global = require('../../utils/global'); // Import Global Variables

// Register Command:
const data = new SlashCommandBuilder()
    .setName('modify-session-user')
    .setDescription("Modifies a user within an session by provided sessionId.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => 
        option.setName('session-date')
		    .setDescription('The date of the session to modify.')
            .setRequired(true)
            .setAutocomplete(true) )
    .addUserOption(option =>
        option.setName('target-user')
            .setDescription('The user to remove from the session')
            .setRequired(true) )
    .addStringOption(option =>
        option.setName('role')
            .setDescription('The action to excecute')
            .setRequired(true)
            .addChoices(
                { name: 'Session Host', value: 'host' },
                { name: 'Trainer Crew', value: 'trainer' },
                { name: 'Unassigned', value: 'remove' },
            ))
    .setContexts(InteractionContextType.Guild)
//


// On Command Excecution:
async function execute(interaction) {
    // Get options:
    const sessionIdProvided = interaction.options.getString('session-date');
    const targetUser = interaction.options.getUser('target-user');
    const action = interaction.options.getString('role');
    const actionString = action == 'host' || action == 'trainer' ? 'Adding' : 'Removing';
    const guildId = interaction.guildId;
  

    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).then().catch((err) => { // Defer Response:
            console.log(`{!} Error Occured! - /${interaction.commandName}:`)
            console.log(err)
    });

    if(!sessionIdProvided || !targetUser || !action){ // On Missing Arguments:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                .setAccentColor(0xd43f37)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ⚠️ Error Occured:'))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('`' + 'Invalid Argument: Wrong Session Id, Target User, or Action Type.' + '`'))
            ]
        });
        return;
    }


    async function  sendSuccessMsg(guildDoc) { // Dynamic Success Msg:

        const sessionSignUp_Channel = guildDoc.sessionSignUp_Channel || null
        const sessionJumpLink = sessionSignUp_Channel
        ? `https://discord.com/channels/${interaction.guildId}/${sessionSignUp_Channel}`
        :  ''

        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x6dc441)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Success ${actionString} User!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔠  __**Session Id:**__     [${sessionIdProvided.toUpperCase()}](${sessionJumpLink}) \n\n👤  __**Target User:**__     <@${targetUser.id}>`))
                    .addSeparatorComponents(new SeparatorBuilder())
            ]
        });
    }


    async function  sendErrorMsg(errData, guildDoc) { // Dynamic Error Msg:

        const sessionSignUp_Channel = guildDoc.sessionSignUp_Channel || null
        const sessionJumpLink = sessionSignUp_Channel
        ? `https://discord.com/channels/${interaction.guildId}/${sessionSignUp_Channel}`
        :  ''

        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xd43f37)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚠️ ERROR ${actionString} User!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔠  __**Session Id:**__     [${sessionIdProvided.toUpperCase()}](${sessionJumpLink}) \n\n👤  __**Target User:**__     <@${targetUser.id}>`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`ℹ️ __**Details:**__ \n\n\`${data}\``))
                    .addSeparatorComponents(new SeparatorBuilder())
            ]
        });
    }


    if(action == 'host'){ // Assign User as Host to Session:

        // Attempt to Give Role:
        const updateData = await sessionManager.assignUserSessionRole(String(guildId), String(sessionIdProvided), String(targetUser.id), 'Session Host')
        if (updateData[0]) {await sendSuccessMsg(updateData[2])} else {await sendErrorMsg(updateData[1], updateData[2])}

    }
    

    if(action == 'trainer'){ // Assign User as Trainer to Session:

        // Attempt to Give Role:
        const updateData = await sessionManager.assignUserSessionRole(String(guildId), String(sessionIdProvided), String(targetUser.id), 'Training Crew')
        if (updateData[0]) {await sendSuccessMsg(updateData[2])} else {await sendErrorMsg(updateData[1], updateData[2])}

    }
    

    if(action == 'remove'){ // Removing User from Session:
       
        // Attempt to Remove Role:
        const updateData = await sessionManager.removeUserFromSessionRole(String(guildId), String(sessionIdProvided), String(targetUser.id),)
        if (updateData[0]) {await sendSuccessMsg(updateData[2])} else {await sendErrorMsg(updateData[1], updateData[2])}

    } 
    

}


// On Autocomplete Interaction:
async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];

    if (focusedOption.name === 'session-date') {
        const allSessionsObject = await sessionManager.getSessions(interaction.guildId);

        // Remove unneeded 'guildData' from the object
        delete allSessionsObject.guildData;

        // Sort sessions by date (earliest first)
        const sortedGuildSessions = Object.entries(allSessionsObject)
            .sort((a, b) => a[1].date - b[1].date); // a[1] and b[1] are sessionData objects

        // Extract sorted session IDs
        const sortedSessionIds = sortedGuildSessions.map(entry => entry[0]);

        // Filter based on user input
        const filtered = sortedSessionIds.filter(choice =>
            choice.startsWith(focusedOption.value)
        );

        // Create label for each session
        const choicesWithLabels = await Promise.all(
            filtered.map(async (choice) => {
                const sessionData = allSessionsObject[choice];
                let label = choice;

                if (sessionData?.date) {
                    const date = new Date(sessionData.date * 1000);
                    label = date.toLocaleString('en-US', {
                        timeZone: 'America/Chicago',
                        hour12: true,
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                    });
                }

                return { name: label, value: choice };
            })
        );

        // Respond with filtered and labeled options
        await interaction.respond(choicesWithLabels);
    }
}



// Exports:
module.exports = {
    data,
    execute,
    autocomplete
};
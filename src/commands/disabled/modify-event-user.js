import { 
    SlashCommandBuilder,
    InteractionContextType,
    MessageFlags,
    SectionBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    PermissionFlagsBits,
} from 'discord.js'; // Import Discord.js

// import sessionManager from "../../utils/guildManager"; // Import Session Manager
// import global from "../../global"; // Import Global Variables

// Register Command:
const data = new SlashCommandBuilder()
    .setName('modify-event-user')
    .setDescription("Modifies a user within an event by provided eventId.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => 
        option.setName('event-date')
		    .setDescription('The date of the event to modify.')
            .setRequired(true)
            .setAutocomplete(true) )
    .addUserOption(option =>
        option.setName('target-user')
            .setDescription('The user to remove from the event')
            .setRequired(true) )
    .addStringOption(option =>
        option.setName('role')
            .setDescription('The action to excecute')
            .setRequired(true)
            .addChoices(
                { name: 'Event Host', value: 'host' },
                { name: 'Trainer Crew', value: 'trainer' },
                { name: 'Unassigned', value: 'remove' },
            ))
    .setContexts(InteractionContextType.Guild)
//


// On Command Excecution:
async function execute(interaction) {
    // Get options:
    const eventIdProvided = interaction.options.getString('event-date');
    const targetUser = interaction.options.getUser('target-user');
    const action = interaction.options.getString('role');
    const actionString = action == 'host' || action == 'trainer' ? 'Adding' : 'Removing';
    const msgJumpLink  = await sessionManager.getEventMessageURL(eventIdProvided);

    
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }).then().catch((err) => { // Defer Response:
            console.log(`{!} Error Occured! - /${interaction.commandName}:`)
            console.log(err)
    });

    if(!eventIdProvided || !targetUser || !action){ // On Missing Arguments:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                .setAccentColor(0xd43f37)
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('## ⚠️ Error Occured:'))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent('`' + 'Invalid Argument: Wrong Event Id, Target User, or Action Type.' + '`'))
            ]
        });
        return;
    }


    async function  sendSuccessMsg() { // Dynamic Success Msg:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0x6dc441)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ✅ Success ${actionString} User!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔠  __**Event Id:**__     [${eventIdProvided.toUpperCase()}](${msgJumpLink}) \n\n👤  __**Target User:**__     <@${targetUser.id}>`))
                    .addSeparatorComponents(new SeparatorBuilder())
            ]
        });
    }


    async function  sendErrorMsg(data) { // Dynamic Error Msg:
        await interaction.editReply({
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
            components: [
                new ContainerBuilder()
                    .setAccentColor(0xd43f37)
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ⚠️ ERROR ${actionString} User!`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`🔠  __**Event Id:**__     [${eventIdProvided.toUpperCase()}](${msgJumpLink}) \n\n👤  __**Target User:**__     <@${targetUser.id}>`))
                    .addSeparatorComponents(new SeparatorBuilder())
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`ℹ️ __**Details:**__ \n\n\`${data}\``))
                    .addSeparatorComponents(new SeparatorBuilder())
            ]
        });
    }


    if(action == 'host'){ // Assign User as Host to Event:

        // Attempt to Give Role:
        const [updateSucess, data] = await sessionManager.updateSessionRole(eventIdProvided, 'Event Host', targetUser.id)
        if (updateSucess) {await sendSuccessMsg()} else {await sendErrorMsg(data)}

    }
    

    if(action == 'trainer'){ // Assign User as Trainer to Event:

        // Attempt to Give Role:
        const [updateSucess, data] = await sessionManager.updateSessionRole(eventIdProvided, 'Training Crew', targetUser.id)
        if (updateSucess) {await sendSuccessMsg()} else {await sendErrorMsg(data)}

    }
    

    if(action == 'remove'){ // Removing User from Event:
       
        // Attempt to Remove Role:
        const [updateSucess, data] = await sessionManager.removePlayerFromEventById(eventIdProvided, targetUser.id)
        if (updateSucess) {await sendSuccessMsg()} else {await sendErrorMsg(data)}

    } 
    

}


// On Autocomplete Interaction:
async function autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    let choices = [];

    if (focusedOption.name === 'event-date') {
        const allSessionsObject = await sessionManager.readSessions();
        const allEventIds = Object.keys(allSessionsObject);
        choices = allEventIds;

        // Filter based on user input
        const filtered = choices.filter(choice =>
            choice.startsWith(focusedOption.value)
        );

        // Convert session IDs to readable date strings
        const choicesWithLabels = await Promise.all(
            filtered.map(async (choice) => {
                const sessionData = await sessionManager.getSession(choice);
                let label = choice; // default to ID if something goes wrong

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

        // Return Options:
        await interaction.respond(choicesWithLabels);
    }
}


// Exports:
export default {
    data,
    execute,
    autocomplete
};
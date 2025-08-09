async function checkIfUserInGuild(guildId, userId) {
  const { client } = require("../../../../utils/global");
  try {

    if(!client) return {
      found: false,
      message: 'Discord bot client is not accessible.'
    }

    // Fetch the guild from the client
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return {
        found: false,
        message: `Guild (${guildId}) not found.`,
      };
    }

    // Fetch the member from the guild
    const member = await guild.members.fetch(userId);

    if (member) {
      return {
        found: true,
        user: member,
      };
    } else {
      return {
        found: false,
        user: `Could not find member(${userId}) within guild(${guildId})`
      };
    }
  
  } catch (error) {
    if (error.code === 10007) { // Discord.js error code for "Unknown Member"
      return {
        found: false,
        message: `User (${userId}) not in guild (${guildId})`,
      };
    } else {
      return {
        found: false,
        message: `Error occurred checking (${userId}) in guild (${guildId})`,
      };
    }
  }
}

module.exports = { checkIfUserInGuild };
import axios from "axios";
const botToken = process.env['BOT_TOKEN'];

export async function checkIfUserInGuild(guildId, userId) {
  try {

    console.log('Checking for user', userId, 'guild', guildId);

    const response = await axios.get(
      `https://discord.com/api/v10/guilds/${guildId}/members/${userId}`,
      {
        headers: {
          Authorization: `Bot ${botToken}`,
        },
      }
    );

    // If no error thrown, user is in the guild
    console.log('MEMBER: TRUE')
    console.log('------')
    return {
      found: true,
      user: response.data,
    };
  } catch (error) {
    console.log('MEMBER: FALSE')
    console.log(error?.data)
    // console.log(error)
    console.log('------')
    if (error.response && error.response.status === 404) {
      return {
        found: false,
        message: `User (${userId}) not in guild (${guildId})`,
      };
    } else {
      // Other error
      console.error('Error fetching user from guild:', error.response?.data || error);
      return {
        found: false,
        message: `Error occurred checking (${userId}) in guild (${guildId})`,
      };
    }
  }
}

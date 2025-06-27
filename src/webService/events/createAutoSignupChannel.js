const botToken = process.env['BOT_TOKEN'];


export const createAutoSignupChannel = async (guildId) => { try {
        
    // ! Debug:
    console.log('Attempting Channel Creation....')

    // Create default 'Sessions' Category:
    const categoryRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        method: 'POST',
        headers: {
            'Authorization': `Bot ${botToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: 'My Category Name',
            type: 4 // 4 = GUILD_CATEGORY
        })
    });
    
    // Check for HTTP Error:
    if(!categoryRes.ok) return{success: false, data: {message: 'Discord Request Error', rawReq: categoryRes}}

    const categoryData = await categoryRes.json();
    const categoryId = categoryData.id;

    // ! DEBUG:
    const result = {success: true, data: {categoryData}}
    console.log('{Creation Result:}', JSON.stringify(result))

    return result

} catch (e) { 
    // Error Occured:
    const result = {success: false, data: `{!} Couldn't create default signup channels`}
    console.log('{!}', JSON.stringify(result))
    return result
}}
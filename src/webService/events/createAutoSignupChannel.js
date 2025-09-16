import {
  ChannelType,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  SeparatorBuilder,
  SectionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from "discord.js";
import global from "../../utils/global.js";
import { sendPermsDeniedAlert } from "../../utils/responses/permissionDenied.js";
import logtail from "../../utils/logs/logtail.js";

const createAutoSignupChannel = async (guildId, adminId) => {
  try {
    const guild = await global.client.guilds.fetch(guildId);
    if (!guild) throw new Error("Guild not found / not joined");

    // Create 'Sessions' category:
    const sessionsCategory = await guild.channels.create({
      name: "📋 - Sessions",
      type: ChannelType.GuildCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [
            PermissionFlagsBits.ViewChannel,
          ],
        },
        {
          id: guild.roles.botRoleFor(global.client.user).id,
          allow: [
            PermissionFlagsBits.ViewChannel,
          ]
        }
      ],
    });

    // Create 'Session Signup' channel:
    const signupChannel = await guild.channels.create({
      name: "session-signup",
      type: ChannelType.GuildText,
      parent: sessionsCategory,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
          ]
        },
        {
          id: guild.roles.botRoleFor(global.client.user).id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
          ]
        }
      ],
    });

    // Send 'Creation Success' Message:
    await signupChannel.send({
      components: [
        new ContainerBuilder()
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              "## Welcome to your new Session Signup Channel!"
            )
          )
          .addSeparatorComponents(new SeparatorBuilder())
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `> 🥳  Each day Session's Bot will update & post your server's daily *Signup Panels* according to your servers configuration within this new channel.`
              + ` \ \n \n`
              + `> ☝️ Keep in mind: By default, **this channel is private**, you or a server mod will have to configure access permissions manually!`
              + ` \ \n \n`
            )
          )
          .addSeparatorComponents(new SeparatorBuilder())

          .addSectionComponents(
            new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder({content: `-# Initiated by: <@${adminId}>`}))
            .setButtonAccessory(
              new ButtonBuilder()
              .setCustomId('deleteSignupChannelMsg')
              .setLabel('Dismiss')
              .setEmoji({name: '❌'})
              .setStyle(ButtonStyle.Secondary)
              
            )
          )

          .addSeparatorComponents(new SeparatorBuilder())
      ],
      flags: MessageFlags.IsComponentsV2,
    });

    // Return Success:
    const result = {
      success: true,
      data: {
        sessionsCategory: {
          categoryId: sessionsCategory.id,
          sessionsCategory,
        },
        signupChannel: {
          channelId: signupChannel.id,
          signupChannel,
        },
      },
    };

    return result;
  } catch (e) { // Creation Error:
    // Debug:
    logtail.error(`Failed to create an 'Auto Signup Channel' - Guild:${guildId}`, {guildId, rawError: e})
    console.warn(`Failed to create an 'Auto Signup Channel' - Guild:${guildId}`, {guildId, rawError: e})
    // Catch Permission Errors:
    if(e?.code === 50013 || e?.code == 50001 || e?.code == 50007) { // Permission Error
      await sendPermsDeniedAlert(guildId, 'Auto Create Signup Channel');
    }
    // Return Error:
    const result = {
      success: false,
      data: `{!} Couldn't create default signup channels`,
      error: e.message,
    };
    return result;
  }
};

export { createAutoSignupChannel };

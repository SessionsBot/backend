import {
  ChannelType,
  PermissionFlagsBits,
  ContainerBuilder,
  TextDisplayBuilder,
  MessageFlags,
  SeparatorBuilder,
  SectionBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import global from "../../utils/global.js";
import { ButtonBuilder } from "@discordjs/builders";

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
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageWebhooks,
          ],
        },
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
            PermissionFlagsBits.ManageWebhooks,
            PermissionFlagsBits.CreateInstantInvite,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.SendMessagesInThreads,
            PermissionFlagsBits.CreatePrivateThreads,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.AddReactions,
            PermissionFlagsBits.UseExternalEmojis,
            PermissionFlagsBits.UseExternalStickers,
            PermissionFlagsBits.MentionEveryone,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.ManageThreads,
            PermissionFlagsBits.SendTTSMessages,
            PermissionFlagsBits.SendVoiceMessages,
            PermissionFlagsBits.SendPolls,
            PermissionFlagsBits.UseApplicationCommands,
            PermissionFlagsBits.UseEmbeddedActivities,
            PermissionFlagsBits.UseExternalApps,
          ],
        },
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
            new TextDisplayBuilder().setContent(`-# <@${adminId}>`)
          )
          .addSeparatorComponents(new SeparatorBuilder())
          .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
              `Each day Session's Bot will update/post your server's daily *Signup Panels* according to your guild's configuration within this new channel.`
            )
          )
          .addActionRowComponents(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("deleteSignupChannelMsg")
                .setLabel("❌ Dismiss")
                .setStyle(ButtonStyle.Secondary)
            )
          ),
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
  } catch (e) {
    // Catch Permission Errors:
    if(e?.code === 50013) { // Permission Error
      sendPermsDeniedAlert(interaction?.guildId, 'Auto Create Signup Channel');
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

import { MessageEmbed, Util } from 'discord.js';
import { parse } from 'twemoji-parser';

import { callbackEmbed } from '../../../utils/messages';

import type { TextCommand } from '../../../sturctures/command';

export const command: TextCommand = {
  data: {
    name: 'enlarge_emoji',
    aliases: ['eem'],
    description: 'Enlarge emoji to BIG picture file in message',
    directMessageAllowed: true,
  },
  run: async ({ message, args }) => {
    const embed = new MessageEmbed();

    const emoji = args[0];

    if (!emoji) {
      const cEmbed = callbackEmbed({
        text: 'Missing Emoji',
        color: 'RED',
      });
      message.reply({
        embeds: [cEmbed],
      });
      return;
    }

    const emojiParsed = Util.parseEmoji(emoji);

    if (!emojiParsed) {
      const cEmbed = callbackEmbed({
        text: 'Error when parsing emoji',
        color: 'RED',
      });
      message.reply({
        embeds: [cEmbed],
      });
      return;
    }

    embed.setTitle(`Enlarged version of ${emojiParsed?.name}`);

    const id = emojiParsed?.id;

    if (id) {
      embed.setImage(
        `https://cdn.discordapp.com/emojis/${id}.${
          emojiParsed.animated ? 'gif' : 'png'
        }`,
      );
      message.channel.send({
        embeds: [embed],
      });
      return;
    }

    const parsed = parse(emoji, { assetType: 'png' });

    if (!parsed[0]) {
      const cEmbed = callbackEmbed({
        text: 'Invalid emoji!',
        color: 'RED',
      });
      message.reply({
        embeds: [cEmbed],
      });
      return;
    }

    embed.setImage(parsed[0].url);

    message.reply({
      embeds: [embed],
    });
  },
};

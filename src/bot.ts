import './http/server';

import { DisTube } from 'distube';

import { YtDlpPlugin } from '@distube/yt-dlp';
import { SpotifyPlugin } from '@distube/spotify';
import { SoundCloudPlugin } from '@distube/soundcloud';

import { Collection, Client, Intents } from 'discord.js';

import { loadDiscordEvent, loadMusicEvent } from './loaders/event';

import { loadTextCommand } from './loaders/command';

import type { TextCommand, SlashCommand } from './sturctures/command';

const client = new Client({
  intents: new Intents(32767),
  allowedMentions: { parse: ['users', 'roles'], repliedUser: false },
  partials: ['GUILD_MEMBER', 'USER', 'MESSAGE', 'CHANNEL', 'REACTION'],
});

client.login(process.env.TOKEN);

export default client;

client.commands = new Collection();
client.commandsCatagories = new Collection();
client.aliases = new Collection();
client.slashcommands = new Collection();
client.cooldown = new Collection();
client.distube = new DisTube(client, {
  // While playing
  leaveOnStop: false,
  leaveOnEmpty: true,
  leaveOnFinish: true,
  // Emits
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
  // Plugins
  youtubeDL: false,
  plugins: [
    new SpotifyPlugin({
      emitEventsAfterFetching: true,
    }),
    new SoundCloudPlugin(),
    new YtDlpPlugin(),
  ],
});

loadDiscordEvent(client);
loadMusicEvent(client);
loadTextCommand(client);

// declare types.
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, TextCommand>;
    commandsCatagories: Collection<string, string[]>;
    slashcommands: Collection<string, SlashCommand>;
    aliases: Collection<string, string>;
    cooldown: Collection<string, number>;
    distube: DisTube;
  }
}

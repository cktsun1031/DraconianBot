import { REST } from '@discordjs/rest';
import chalk from 'chalk';
import type { Client } from 'discord.js';
import {
  RESTPostAPIApplicationCommandsJSONBody,
  Routes,
} from 'discord-api-types/v9';
import glob from 'glob';
import { basename, dirname, join } from 'node:path';

import { disabledCommandCatagories } from '../../config/bot.json';
import type { SlashCommand, TextCommand } from '../sturctures/command';
import { isDev } from 'src/utils/constants';

interface TextCommandCatagories {
  [key: string]: string[];
}

/** Text Command Loaders */
export async function loadTextCommand(client: Client) {
  let folderPath = join(__dirname, '../commands/message/**/*.js');

  // Parse path in windows
  if (process.platform === 'win32') {
    folderPath = folderPath.replaceAll('\\', '/');
  }

  glob(folderPath, (error, allFiles) => {
    if (error) throw error;

    if (allFiles.length === 0) {
      console.log(
        chalk.blueBright.bold(
          '\nWARNING: Cannot find any possible command target.\n',
        ),
      );
    }

    let catagories: TextCommandCatagories = {};

    for (let index = 0, l = allFiles.length; index < l; index++) {
      const filePath = allFiles[index];
      const commandFile = require(filePath);
      const command: TextCommand = commandFile.command;

      // Neglect if disabled.
      if (command?.enabled === false) continue;

      if (!command?.data) {
        throw `Error: ${filePath}`;
      }

      // Store command to memory.
      const cmdName = command.data.name;
      if (client.commands.has(cmdName)) {
        throw 'Duplicated command is found!';
      }

      const catagory = basename(dirname(filePath));

      const disabledCatagories: string[] = disabledCommandCatagories;

      if (!disabledCatagories.includes(catagory)) {
        if (catagory) {
          command.data.catagory = catagory;
          if (command.data.publicLevel !== 'None') {
            if (!catagories[catagory]) {
              catagories[catagory] = [];
            }
            catagories[catagory].push(cmdName);
          }
        }

        if (command.data.intervalLimit) {
          const list = command.data.intervalLimit;
          if (list.minute! > list.hour! || list.hour! > list.day!) {
            throw `Impolitic Custom Interval style!`;
          }
        }

        client.commands.set(cmdName, command);

        if (command.data.aliases) {
          for (const alias of command.data.aliases) {
            if (client.aliases.has(alias)) {
              throw 'Duplicated command alias is found!';
            }
            // Store aliase(s) to memory if exists.
            client.aliases.set(alias, command.data.name);
          }
        }
        delete require.cache[require.resolve(filePath)];
      }
    }

    for (const value of Object.entries(catagories)) {
      client.commandsCatagories.set(value[0], value[1]);
    }
  });
}

/** Load Slash commands to API & Collection */
export async function loadSlashCommand(
  client: Client,
  clientId: string,
  token: string,
) {
  let folderPath = join(__dirname, '../commands/slash/*.js');

  // Parse path in windows
  if (process.platform === 'win32') {
    folderPath = folderPath.replaceAll('\\', '/');
  }

  const slashCommandData: RESTPostAPIApplicationCommandsJSONBody[] = [];

  glob(folderPath, async (error, allFiles) => {
    if (error) throw error;

    for (let index = 0, l = allFiles.length; index < l; index++) {
      const filePath = allFiles[index];
      const commandFile = require(filePath);
      const slashCommand: SlashCommand = commandFile.command;

      const slashCommandCollection = client.slashcommands;
      const name = slashCommand.slashData.name;

      if (slashCommandCollection.has(name)) {
        throw 'Duplicated slash command is found!';
      }

      client.slashcommands.set(name, slashCommand);

      slashCommandData.push(slashCommand.slashData.toJSON());

      delete require.cache[require.resolve(allFiles[index])];
    }

    const rest = new REST({ version: '9' }).setToken(token);

    if (!isDev) {
      // Global Commands
      await rest.put(Routes.applicationCommands(clientId), {
        body: slashCommandData,
      });
    } else {
      // Guild Only & Development Only Commands.
      const guildId = process.env.DEV_GUILD_ID;
      
      if (guildId) {
        const { applicationGuildCommands } = Routes;

        const guildCommands = await rest.get(
          Routes.applicationGuildCommands(clientId, guildId),
        );

        for (const command of guildCommands as any) {
          const deleteUrl = `${Routes.applicationGuildCommands(
            clientId,
            guildId,
          )}/${command.id}`;
          await rest.delete(`/${deleteUrl}`);
        }

        await rest.put(applicationGuildCommands(clientId, guildId), {
          body: slashCommandData,
        });
      }
    }
  });
}

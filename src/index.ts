import Eris from 'eris';
import { Mutex } from 'async-mutex';

import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));
const bot = new Eris.Client(config.token);

const cooldownMutex = new Mutex();
const cooldowns = new Map<string, NodeJS.Timeout>();

bot.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    let channel: Eris.TextableChannel = msg.channel as any;
    if (!channel.createMessage) {
        // uncached?
        channel = bot.getChannel(msg.channel.id) as Eris.TextChannel;
    }

    if (msg.content.toLowerCase().includes('bunger')) {
        await cooldownMutex.runExclusive(async () => {
            if (cooldowns.has(channel.id)) return;

            try {
                await channel.createMessage('https://lewistehminerz.dev/assets/img/bunger.gif');
            } catch (e) {
                // Oh no! Anyway...
                return;
            }

            cooldowns.set(
                channel.id,
                setTimeout(() => {
                    cooldowns.delete(channel.id);
                }, 60000)
            );
        });
    }
});

bot.connect();

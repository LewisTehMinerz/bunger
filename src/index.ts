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

    if (msg.content.startsWith('-bonk ') && msg.author.id === config.botOwner) {
        const bonk: string[] = [];
        for (const mention of msg.mentions) {
            bonk.push(mention.id);
        }

        config.bonked.push(...bonk);
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

        return await channel.createMessage({
            content: 'bonked ' + bonk.join(', ')
        });
    }

    if (msg.content.startsWith('-unbonk ') && msg.author.id === config.botOwner) {
        const unbonk: string[] = [];
        for (const mention of msg.mentions) {
            unbonk.push(mention.id);
        }

        config.bonked = config.bonked.filter((b: string) => !unbonk.includes(b));
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));

        await channel.createMessage({
            content: 'unbonked ' + unbonk.join(', ')
        });
    }

    if (msg.content.toLowerCase().includes('bunger') && !config.bonked.includes(msg.author.id)) {
        await cooldownMutex.runExclusive(async () => {
            if (cooldowns.has(channel.id)) return;

            try {
                await channel.createMessage({
                    content: 'https://lewistehminerz.dev/assets/img/bunger.gif',
                    messageReference: { messageID: msg.id }
                });
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

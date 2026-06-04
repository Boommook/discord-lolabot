require('dotenv').config();

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const PICS_FOLDER = path.join(__dirname, 'lola-pics');

function getRandomPic() {
    const files = fs.readdirSync(PICS_FOLDER).filter(file => file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg'));

    if (files.length === 0) throw new Error('No pictures found in the folder');

    const randomFile = files[Math.floor(Math.random() * files.length)];
    return path.join(PICS_FOLDER, randomFile);
}

async function sendDailyPic() {
    try {
        const channel = await client.channels.fetch(process.env.CHANNEL_ID);

        if (!channel) {
            throw new Error('Channel not found or is not a text channel');
            return
        }

        const imagePath = getRandomPic();
        const attachment = new AttachmentBuilder(imagePath);

        await channel.send({
            content: "Daily Lola 🦎",
            files: [attachment],
        });

        console.log('Daily Lola pic sent successfully');
    } catch (error) {
        console.error('Error sending daily Lola pic:', error);
    }
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);

    cron.schedule("0 10 * * *", () => {
        sendDailyPic();
    }, {
        scheduled: true,
        timezone: process.env.TIMEZONE || 'America/New_York',
    });

    sendDailyPic();
});

client.login(process.env.DISCORD_TOKEN);
require('dotenv').config();

const path = require('path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const { google } = require('googleapis');

const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

const DRIVE_FOLDER_ID = "1xQ6o42lu-kjgaiGrHsPg1dyLhTGZzUvR";

async function getRandomPic() {
    const drive = google.drive({ version: 'v3', auth });

    const res = await drive.files.list({
        q: `'${DRIVE_FOLDER_ID}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: 'files(id, name)',
    });

    const files = res.data.files;

    if (!files || files.length === 0) throw new Error('No pictures found in the folder');

    const randomFile = files[Math.floor(Math.random() * files.length)];

    const fileRes = await drive.files.get(
        {
            fileId: randomFile.id,
            alt: 'media',
        },
        {
            responseType: 'arraybuffer',
        }
    )

    return {
        buffer: Buffer.from(fileRes.data),
        name: randomFile.name,
    }
}

async function sendDailyPic() {
    const channelIds = process.env.CHANNEL_IDS.split(',');
    try {
        const {buffer, name} = await getRandomPic();
        const attachment = new AttachmentBuilder(buffer, { name });

        for (const channelId of channelIds) {
            const channel = await client.channels.fetch(channelId.trim());
          
            if (channel?.isTextBased()) {
              await channel.send({
                content: "Daily Lola 🦎",
                files: [attachment],
              });
            }
          }

        console.log('Daily Lola pics sent successfully');
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

client.login(process.env.DISCORD_TOKEN).catch(err => {
    console.error('Failed to login:', err.message);
});
import { client as Client } from "../..";
import { ActivityType, TextChannel } from "discord.js";

Client.once('ready', async (client) => {
    console.log('Logged in as: ' + Client.user?.tag);
    Client.user?.setActivity('голоса',{ type: ActivityType.Listening });
    Client.user?.setStatus("idle")

    const checkChannel = client.guilds.cache.get('1397730981871620298');
   
        const channelSendStart = await checkChannel!.channels.cache.get(checkChannel!.id) as TextChannel;

        channelSendStart.send('Хозяин, я проснулась!');
   
});
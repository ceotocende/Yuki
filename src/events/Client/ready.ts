import { client as Client } from "../..";
import { ActivityType, TextChannel } from "discord.js";

Client.once('ready', async (client) => {
    console.log('Logged in as: ' + Client.user?.tag);
    Client.user?.setActivity('голоса',{ type: ActivityType.Listening });
    Client.user?.setStatus("idle")

    const guild = client.guilds.cache.get('1397730981124767878');
   
        const channelSendStart = await guild!.channels.cache.get('1397730981871620298') as TextChannel;

        channelSendStart.send('Хозяин, я проснулась!');
   
});
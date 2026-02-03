import { client as Client } from "../..";
import { ActivityType, TextChannel } from "discord.js";
import { TableSync } from "../../database/dbsync";
import getBoxGiftTimely from "../../functions/getBoxGiftTimely";
import { channelsId } from "../../utils/config";

Client.once('clientReady', async (client) => {
    console.log('Logged in as: ' + Client.user?.tag);
    Client.user?.setActivity('голоса', { type: ActivityType.Listening });
    Client.user?.setStatus("idle")

    const guild = client.guilds.cache.get('1397730981124767878');

    const channelSendStart = guild!.channels.cache.get(channelsId.chatLog) as TextChannel;
    const channelGeneral = guild!.channels.cache.get(channelsId.generalChat) as TextChannel;

    channelSendStart.send('Хозяин, я проснулась!');
    await TableSync(channelSendStart);

    function scheduleRandomTask(task: () => void, maxMinutes: number = 60) {
        const randomDelay = Math.floor(Math.random() * maxMinutes * 60 * 1000);
        setTimeout(() => {
            task();
            scheduleRandomTask(task, maxMinutes);
        }, randomDelay);
    }

    scheduleRandomTask(async () => {
        await getBoxGiftTimely(channelGeneral);
    }, 30);
});
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

    function scheduleRandomTask(task: () => void, minMinutes: number = 60, maxMinutes: number = 90): NodeJS.Timeout {
    // Проверка валидности диапазона
    if (minMinutes < 0 || maxMinutes < 0 || minMinutes > maxMinutes) {
        throw new Error('Некорректный диапазон минут');
    }
    
    // Генерируем случайную задержку от minMinutes до maxMinutes
    const randomDelay = Math.floor(
        Math.random() * (maxMinutes - minMinutes) * 60 * 1000 + 
        minMinutes * 60 * 1000
    );
        
    return setTimeout(() => {
        task();
        scheduleRandomTask(task, minMinutes, maxMinutes);
    }, randomDelay);
}

    const timer = scheduleRandomTask(async () => {
    await getBoxGiftTimely(channelGeneral);
}, 60, 90);
});
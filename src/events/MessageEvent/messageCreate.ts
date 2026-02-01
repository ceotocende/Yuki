import { TextChannel } from "discord.js";
import { client } from "../..";
import AddBalanceToDB from "../../database/Functions/AddBalanceToDB";
import AddExpToDatabase from "../../database/Functions/AddExpToDatabase";
import AddMessageToDB from "../../database/Functions/AddMessageToDB";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import getBoxGiftTimely from "../../functions/getBoxGiftTimely";
let messageCountToGift = 0;

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    await AddUserToDB(message.author);
    await AddExpToDatabase(message.author, 1);
    await AddMessageToDB(message.author, message.content);
    await AddBalanceToDB(message.author, 1)

    const channel = message.channel as TextChannel;

    if (messageCountToGift >= 100) {
        messageCountToGift = 0;
        await getBoxGiftTimely(channel);
    } else if (message.channel.id === '1397730981871620298') {
        messageCountToGift += 1;
    }

    function scheduleRandomTask(task: () => void, maxMinutes: number = 30) {
        const randomDelay = Math.floor(Math.random() * maxMinutes * 60 * 1000);
        setTimeout(() => {
            task();
            scheduleRandomTask(task, maxMinutes);
        }, randomDelay);
    }

    scheduleRandomTask(async () => {
        await getBoxGiftTimely(channel);
    }, 30);
})
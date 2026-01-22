import { client } from "../..";
import AddBalanceToDB from "../../database/Functions/AddBalanceToDB";
import AddExpToDatabase from "../../database/Functions/AddExpToDatabase";
import AddMessageToDB from "../../database/Functions/AddMessageToDB";
import AddUserToDB from "../../database/Functions/AddUsersToDB";

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    await AddUserToDB(message.author);
    await AddExpToDatabase(message.author, 1);
    await AddMessageToDB(message.author, message.content);
    await AddBalanceToDB(message.author, 1)
})
import { client as Client } from "../..";
import { ActivityType, TextChannel } from "discord.js";

Client.once('ready', (client) => {
    console.log('Logged in as: ' + Client.user?.tag);
    Client.user?.setActivity('голоса',{ type: ActivityType.Listening });
    Client.user?.setStatus("idle")
});
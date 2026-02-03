import { EmbedBuilder, TextChannel } from "discord.js";
import { client } from "../..";
import DestroyToDb from "../../database/Functions/DestroyToDb";
import { channelsId } from "../../utils/config";

client.on('guildMemberRemove', async (member) => {
    await DestroyToDb(member.user);

    const channel = member.guild.channels.cache.get(channelsId.chatLog) as TextChannel;
    
    if (!channel) return;
    else {
        channel.send({
            embeds: [
                new EmbedBuilder()  
                    .setTitle('Ливер')
                    .setDescription(`Вот этот ${member} с айди ${member.id} посмел ливнуть с сервера..`)
                    .setColor('Red')
                    .setTimestamp()
            ]
        })
    }
}) 
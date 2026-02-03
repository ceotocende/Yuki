import { EmbedBuilder, TextChannel } from "discord.js";
import { client } from "../..";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import { channelsId } from "../../utils/config";

client.on('guildMemberAdd', async (member) => {
    if (member.user.bot) return;
    else {
        await AddUserToDB(member.user);
        const channel = member.guild.channels.cache.get(channelsId.generalChat) as TextChannel;

        if (!channel) {
            return console.log('Ошибка приветствия пользователя');
        } else { 
            channel.send({
                content: `${member.user} Добро пожаловать на сервер`,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: 'LAGPOINT', iconURL: `${member.user.avatarURL() || member.guild.iconURL()}` })
                        .setThumbnail(`${member.guild.iconURL()}`)
                        .setDescription('Прошу, присаживайся, тебя ждали!')
                        .setColor("Purple")
                        .setTimestamp()
                ]
            })
        }
    }
})
import { Colors, TextChannel, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { channelsId } from "../../utils/config";
import AddVoiceToDB from "../../database/Functions/AddVoiceTimeToDB";
import AddBalanceToDB from "../../database/Functions/AddBalanceToDB";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import AddExpToDatabase from "../../database/Functions/AddExpToDatabase";

const map = new Map();


client.on('voiceStateUpdate', async (oldState, newState) => {
    const channelLog = newState.guild.channels.cache.get(channelsId.chatLog) as TextChannel;
    try {
        if ((oldState.guild.id !== channelsId.guildId) || (newState.guild.id !== channelsId.guildId)) return;
        if (oldState.member?.user.bot) return;
        if (newState.member?.user.bot) return;
        
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;

        const currentTime = Date.now();

        if (newState.channel !== null && oldChannel === null) {
            map.set(newState.member!.id, currentTime);
            await AddUserToDB(newState.member!.user);
            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Участник присоединился к голосовому каналу`, iconURL: `${newState.member?.user.displayAvatarURL()}` })
                        .setDescription(`Участник ${newState.member}, присоединился к каналу ${newState.channel}`)
                        .setColor(Colors.Green)
                        .setTimestamp()
                ]
            });
        }


        if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {

            await AddVoiceToDB(oldState.member!.user, currentTime - map.get(newState.member!.id));
            await AddExpToDatabase(oldState.member!.user, Math.floor((currentTime - map.get(newState.member!.id)) / 10000));
            await AddBalanceToDB(newState.member!.user, Math.floor((currentTime - map.get(newState.member!.id)) / 1000));
            map.delete(newState.member!.id);
            map.set(newState.member!.id, currentTime);

            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Участник перешел в другой канал`, iconURL: `${newState.member?.user.displayAvatarURL()}` })
                        .setDescription(`${newState.member!.user.tag} перешел из канала ${oldChannel} в канал ${newChannel}`)
                        .setColor(Colors.Grey)
                        .setTimestamp()
                ]
            });
        }

        if (oldChannel !== null && newChannel === null) {
            await AddVoiceToDB(oldState.member!.user, !(currentTime - map.get(newState.member!.id)) ? 1 : (currentTime - map.get(newState.member!.id)));
            await AddExpToDatabase(oldState.member!.user, Math.floor(!(currentTime - map.get(newState.member!.id)) ? 1 : (currentTime - map.get(newState.member!.id)) / 60000));
            await AddBalanceToDB(newState.member!.user, Math.floor(!(currentTime - map.get(newState.member!.id)) ? 1 : (currentTime - map.get(newState.member!.id)) / 60000));

            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Участник покинул голосовой канал`, iconURL: `${newState.member!.displayAvatarURL()}` })
                        .setDescription(`Участник ${newState.member}, покинул голосовой канал ${oldState.channel}`)
                        .setColor(Colors.Yellow)
                        .setTimestamp()
                ]
            });

        }
    } catch (err) {
        console.error(err);
        channelLog.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Произошла ошибка войса')
                    .setDescription('a' + err)
                    .setColor(Colors.Red)
                    .setTimestamp()
            ]
        });
    }
})
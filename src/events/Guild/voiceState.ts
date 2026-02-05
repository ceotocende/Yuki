import { Colors, TextChannel, EmbedBuilder, GuildMember, User } from "discord.js";
import { client } from "../..";
import { channelsId } from "../../utils/config";
import AddVoiceToDB from "../../database/Functions/AddVoiceTimeToDB";
import AddBalanceToDB from "../../database/Functions/AddBalanceToDB";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import AddExpToDatabase from "../../database/Functions/AddExpToDatabase";
import { VoiceSessionDB } from "../../database/Models/SecondsModels/VoiceSession";

// Локальная мапа для быстрого доступа к активным сессиям
const activeSessions = new Map<string, number>();

// Функция для инициализации активных сессий при запуске бота
export async function initializeVoiceSessions() {
    try {
        // Получаем все голосовые каналы на всех серверах
        for (const guild of client.guilds.cache.values()) {
            for (const channel of guild.channels.cache.values()) {
                if (channel.isVoiceBased() && channel.members.size > 0) {
                    for (const member of channel.members.values()) {
                        if (member.user.bot) continue;
                        
                        const currentTime = Date.now();
                        activeSessions.set(member.id, currentTime);
                        
                        // Обновляем запись в базе данных
                        const existingSession = await VoiceSessionDB.findOne({
                            where: { user_id: member.id }
                        });
                        
                        if (existingSession) {
                            // Если запись уже есть, обновляем join_time
                            await existingSession.update({
                                channel_id: channel.id,
                                join_time: currentTime,
                                last_updated: currentTime
                            });
                        } else {
                            // Если записи нет, создаем новую
                            await VoiceSessionDB.create({
                                user_id: member.id,
                                guild_id: guild.id,
                                channel_id: channel.id,
                                join_time: currentTime,
                                accumulated_time: 0,
                                last_updated: currentTime
                            });
                        }
                        
                        console.log(`Восстановлена сессия для ${member.user.tag} в канале ${channel.name}`);
                    }
                }
            }
        }
        console.log(`Инициализировано ${activeSessions.size} активных голосовых сессий`);
    } catch (error) {
        console.error('Ошибка при инициализации голосовых сессий:', error);
    }
}

// Функция для завершения сессии пользователя с начислением
async function endUserSessionWithRewards(userId: string, user: User, currentTime: number): Promise<number> {
    try {
        const sessionStartTime = activeSessions.get(userId);
        activeSessions.delete(userId);
        
        // Получаем запись из базы данных
        const sessionRecord = await VoiceSessionDB.findOne({
            where: { user_id: userId }
        });
        
        if (!sessionRecord || !sessionRecord.join_time) {
            return 0; // Нет активной сессии
        }
        
        // Вычисляем продолжительность текущей сессии
        const sessionDuration = currentTime - sessionRecord.join_time;
        
        // Добавляем к накопленному времени
        const newAccumulatedTime = sessionRecord.accumulated_time + sessionDuration;
        
        // Обновляем запись: сбрасываем join_time (пользователь вышел)
        await sessionRecord.update({
            join_time: null,
            channel_id: null,
            accumulated_time: newAccumulatedTime,
            last_updated: currentTime
        });
        
        // Начисляем награды только если есть реальная продолжительность сессии
        if (sessionDuration > 0) {
            await AddVoiceToDB(user, sessionDuration);
            await AddExpToDatabase(user, Math.floor(sessionDuration / 20000));
            await AddBalanceToDB(user, Math.floor(sessionDuration / 1000));
        }
        
        return sessionDuration;
    } catch (error) {
        console.error('Ошибка при завершении сессии с наградами:', error);
        return 0;
    }
}

// Функция для завершения сессии пользователя БЕЗ начисления (для перезагрузки)
async function endUserSessionWithoutRewards(userId: string, currentTime: number): Promise<number> {
    try {
        const sessionStartTime = activeSessions.get(userId);
        activeSessions.delete(userId);
        
        // Получаем запись из базы данных
        const sessionRecord = await VoiceSessionDB.findOne({
            where: { user_id: userId }
        });
        
        if (!sessionRecord || !sessionRecord.join_time) {
            return 0; // Нет активной сессии
        }
        
        // Вычисляем продолжительность текущей сессии
        const sessionDuration = currentTime - sessionRecord.join_time;
        
        // Добавляем к накопленному времени
        const newAccumulatedTime = sessionRecord.accumulated_time + sessionDuration;
        
        // Обновляем запись: сбрасываем join_time (пользователь вышел)
        await sessionRecord.update({
            join_time: null,
            channel_id: null,
            accumulated_time: newAccumulatedTime,
            last_updated: currentTime
        });
        
        return sessionDuration;
    } catch (error) {
        console.error('Ошибка при завершении сессии без наград:', error);
        return 0;
    }
}

// Функция для начала новой сессии
async function startUserSession(member: GuildMember, channelId: string, currentTime: number) {
    try {
        activeSessions.set(member.id, currentTime);
        
        // Находим существующую запись или создаем новую
        const [sessionRecord, created] = await VoiceSessionDB.findOrCreate({
            where: { user_id: member.id },
            defaults: {
                user_id: member.id,
                guild_id: member.guild.id,
                channel_id: channelId,
                join_time: currentTime,
                accumulated_time: 0,
                last_updated: currentTime
            }
        });
        
        if (!created) {
            // Если запись уже существует, обновляем ее
            await sessionRecord.update({
                channel_id: channelId,
                join_time: currentTime,
                last_updated: currentTime
            });
        }
    } catch (error) {
        console.error('Ошибка при начале сессии:', error);
    }
}

// Функция для сохранения времени при перезагрузке бота (без начисления наград)
async function saveTimeOnRestart() {
    try {
        const currentTime = Date.now();
        const allSessions = await VoiceSessionDB.findAll();
        
        for (const session of allSessions) {
            if (session.join_time) {
                // Если пользователь был в голосовом канале во время перезагрузки
                const sessionDuration = currentTime - session.join_time;
                const newAccumulatedTime = session.accumulated_time + sessionDuration;
                
                await session.update({
                    accumulated_time: newAccumulatedTime,
                    join_time: null, // Сбрасываем, так как бот перезагрузился
                    channel_id: null,
                    last_updated: currentTime
                });
            }
        }
        
        console.log(`Сохранено время для ${allSessions.length} пользователей при перезагрузке`);
    } catch (error) {
        console.error('Ошибка при сохранении времени при перезагрузке:', error);
    }
}

// Основной обработчик голосовых событий
client.on('voiceStateUpdate', async (oldState, newState) => {
    const channelLog = newState.guild.channels.cache.get(channelsId.chatLog) as TextChannel;
    
    try {
        if ((oldState.guild.id !== channelsId.guildId) || (newState.guild.id !== channelsId.guildId)) return;
        if (oldState.member?.user.bot) return;
        if (newState.member?.user.bot) return;
        
        const oldChannel = oldState.channel;
        const newChannel = newState.channel;
        const currentTime = Date.now();
        const memberId = newState.member?.id || oldState.member?.id;

        if (!memberId) return;

        // Присоединение к каналу
        if (newChannel && !oldChannel) {
            await AddUserToDB(newState.member!.user);
            await startUserSession(newState.member!, newChannel.id, currentTime);
            
            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ 
                            name: `Участник присоединился к голосовому каналу`, 
                            iconURL: newState.member?.user.displayAvatarURL() 
                        })
                        .setDescription(`Участник ${newState.member}, присоединился к каналу ${newChannel}`)
                        .setColor(Colors.Green)
                        .setTimestamp()
                ]
            });
        }

        // Переход между каналами
        if (oldChannel && newChannel && oldChannel.id !== newChannel.id) {
            if (oldState.member?.user) {
                await endUserSessionWithRewards(memberId, oldState.member.user, currentTime);
            }
            
            await startUserSession(newState.member!, newChannel.id, currentTime);

            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ 
                            name: `Участник перешел в другой канал`, 
                            iconURL: newState.member?.user.displayAvatarURL() 
                        })
                        .setDescription(`${newState.member!.user.tag} перешел из канала ${oldChannel} в канал ${newChannel}`)
                        .setColor(Colors.Grey)
                        .setTimestamp()
                ]
            });
        }

        // Выход из канала
        if (oldChannel && !newChannel) {
            if (oldState.member?.user) {
                await endUserSessionWithRewards(memberId, oldState.member.user, currentTime);
            }

            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ 
                            name: `Участник покинул голосовой канал`, 
                            iconURL: oldState.member!.displayAvatarURL() 
                        })
                        .setDescription(`Участник ${oldState.member}, покинул голосовой канал ${oldChannel}`)
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
                    .setTitle('Произошла ошибка в голосовом модуле')
                    .setDescription('Ошибка: ' + err)
                    .setColor(Colors.Red)
                    .setTimestamp()
            ]
        });
    }
});

client.on('ready', async () => {
    console.log(`Бот ${client.user?.tag} запущен!`);
    
    // Сохраняем накопленное время для всех пользователей при перезагрузке (БЕЗ начисления наград)
    await saveTimeOnRestart();
    
    // Инициализируем голосовые сессии
    await initializeVoiceSessions();
});
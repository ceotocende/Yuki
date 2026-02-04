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
        // НЕ очищаем старые сессии при запуске! Теперь сохраняем накопленное время
        
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

// Функция для завершения сессии пользователя
async function endUserSession(userId: string, currentTime: number): Promise<number> {
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
        console.error('Ошибка при завершении сессии:', error);
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

// Функция для получения общего накопленного времени
async function getTotalAccumulatedTime(userId: string): Promise<number> {
    try {
        const sessionRecord = await VoiceSessionDB.findOne({
            where: { user_id: userId }
        });
        
        if (!sessionRecord) return 0;
        
        // Если пользователь сейчас в голосовом канале, добавляем текущую сессию
        if (sessionRecord.join_time) {
            const currentTime = Date.now();
            const currentSessionDuration = currentTime - sessionRecord.join_time;
            return sessionRecord.accumulated_time + currentSessionDuration;
        }
        
        return sessionRecord.accumulated_time;
    } catch (error) {
        console.error('Ошибка при получении накопленного времени:', error);
        return 0;
    }
}

// Функция для сохранения общего времени при перезагрузке бота
async function saveAccumulatedTimeForAllUsers() {
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
                
                // Пытаемся найти пользователя в кэше Discord
                try {
                    // Ищем пользователя во всех гильдиях
                    let discordUser: User | undefined;
                    
                    for (const guild of client.guilds.cache.values()) {
                        const member = guild.members.cache.get(session.user_id);
                        if (member) {
                            discordUser = member.user;
                            break;
                        }
                    }
                    
                    // Если пользователь найден в кэше
                    if (discordUser) {
                        await AddVoiceToDB(discordUser, sessionDuration);
                        await AddExpToDatabase(discordUser, Math.floor(sessionDuration / 10000));
                        await AddBalanceToDB(discordUser, Math.floor(sessionDuration / 1000));
                    } else {
                        // Если пользователь не найден в кэше, пробуем фетчить из API
                        try {
                            discordUser = await client.users.fetch(session.user_id);
                            if (discordUser) {
                                await AddVoiceToDB(discordUser, sessionDuration);
                                await AddExpToDatabase(discordUser, Math.floor(sessionDuration / 10000));
                                await AddBalanceToDB(discordUser, Math.floor(sessionDuration / 1000));
                            } else {
                                console.warn(`Не удалось найти пользователя ${session.user_id} для сохранения времени`);
                            }
                        } catch (fetchError) {
                            console.warn(`Не удалось загрузить пользователя ${session.user_id}:`, fetchError);
                        }
                    }
                } catch (userError) {
                    console.error(`Ошибка при обработке пользователя ${session.user_id}:`, userError);
                }
            }
        }
        
        console.log(`Сохранено накопленное время для ${allSessions.length} пользователей`);
    } catch (error) {
        console.error('Ошибка при сохранении накопленного времени:', error);
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
            const sessionDuration = await endUserSession(memberId, currentTime);
            
            if (sessionDuration > 0 && oldState.member?.user) {
                await AddVoiceToDB(oldState.member.user, sessionDuration);
                await AddExpToDatabase(oldState.member.user, Math.floor(sessionDuration / 10000));
                await AddBalanceToDB(oldState.member.user, Math.floor(sessionDuration / 1000));
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
            const sessionDuration = await endUserSession(memberId, currentTime);
            
            if (sessionDuration > 0 && oldState.member?.user) {
                await AddVoiceToDB(oldState.member.user, sessionDuration);
                await AddExpToDatabase(oldState.member.user, Math.floor(sessionDuration / 10000));
                await AddBalanceToDB(oldState.member.user, Math.floor(sessionDuration / 1000));
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
    
    // Сохраняем накопленное время для всех пользователей (на случай перезагрузки)
    await saveAccumulatedTimeForAllUsers();
    
    // Инициализируем голосовые сессии
    await initializeVoiceSessions();
});
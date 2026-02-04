import { EmbedBuilder } from "discord.js"

export const colors = {
    stable: '2b2d31'
}

export const embedErrFromInteractions = new EmbedBuilder()
    .setTitle('Ошибка')
    .setDescription(`Произошла ошибка при выполнении команды.\nВы упомянули себя или бота, зачем вам это?`)
    .setImage('https://media.tenor.com/qkPV6_DL-NAAAAAd/bocchi-the-rock-bocchi.gif')
    .setColor('DarkRed');

export const embedErrFromUserDb = new EmbedBuilder()
    .setAuthor({ name: `Ошибка` })
    .setDescription('К сожалению вас или пользователя нет в базе данных.\nВероятнее после этого сообщения я вас или пользователя уже добавила в базу данных!')
    .setColor('Red')
    .setTimestamp()

export const channelsId = {
    guildId: "1397730981124767878",
    chatLog: "1447690029362188560",
    lvlUp: "1465786174051451174",
    generalChat: "1397730981871620298",
    basketChannel: "1405366275751805110"
}

export const workName = [
    'учителя',
    'заправщика',
    'музыканта',
    'редактора',
    'экономиста',
    'водителя',
    'эколога',
    'инженера',
    'менеджера',
    'кассира',
    'психолога',
    'работник склада',
    'курьера',
    'администратора',
    'журналиста'
]
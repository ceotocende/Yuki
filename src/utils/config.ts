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
    .setDescription('К сожалению вас или участника нет в базе данных.\nНапишите что нибудь в любой чат и я вас обязательно добавлю!')
    .setColor('Red')
    .setTimestamp()

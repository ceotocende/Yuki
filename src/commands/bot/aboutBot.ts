import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('о_боте')
        .setDescription('Посмотреть информацию о боте')
        .setDMPermission(false),
    run: async (client, interaction) => {
        interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle('О боте')
                    .setDescription(`Бот написан для сервера LagPoint и является собственностью <@515575447124181007>. По всем вопросам можете обращаться к нему.\nБот написан для развлечения и не используется для личной выгоды.\nБот собирает общедоступную информацию с сервера LagPoint (информацию о пользователе и сервере).\nБот не может запршивать логины, пароли и токены будьте осторожны.`)
                    .setTimestamp()
                    .setColor('Purple')
            ],
            ephemeral: true
        })
    }
});
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Marry } from "../../database/Models/SecondsModels/Marry";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('развестись')
        .setDescription('Развестись со своей тварью.')
        .setDMPermission(false),
    async run(client, interaction) {
        const refuseMarryFirst = await Marry.findOne({ where: { user_id_first: interaction.user.id } });
        const refuseMarrySecond = await Marry.findOne({ where: { user_id_second: interaction.user.id } });

        if (!refuseMarryFirst && !refuseMarrySecond) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Ошибка` })
                        .setDescription('Вы ни с кем не женаты.')
                        .setColor('Red')
                        .setTimestamp()
                ]
            });
        } else if (refuseMarryFirst) {
            await interaction.reply({
                content: `<@${refuseMarryFirst.user_id_second}>`,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `...` })
                        .setDescription(`Вы развелись с <@${refuseMarryFirst.user_id_second}>`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })

            refuseMarryFirst.destroy();
            refuseMarryFirst.save();
        } else if (refuseMarrySecond) {
            await interaction.reply({
                content: `<@${refuseMarrySecond.user_id_first}>`,
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `...` })
                        .setDescription(`Вы развелись с <@${refuseMarrySecond.user_id_first}>`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })

            refuseMarrySecond.destroy();
            refuseMarrySecond.save();
        }

    },
})
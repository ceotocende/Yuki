import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { colors } from "../../utils/config";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('перевод')
        .setDescription('Перевести монетки другому пользователю')
        .addUserOption(op => op
            .setName('user')
            .setDescription('Выберите пользователя')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('num')
            .setDescription('Выберите сумму (минимум 100, максимум 200000')
            .setRequired(true)
            .setMinValue(100)
            .setMaxValue(200000)
        ),
    run: async (client, interaction) => {
        const userTarget = interaction.options.getUser('user')!;
        const sumPay = interaction.options.getNumber('num')!;
        const sumPayFloor = Math.floor(sumPay)
        const user = interaction.user;
        const userWallet = await Users.findOne({ where: { user_id: user.id } });
        const userTargetWallet = await Users.findOne({ where: { user_id: userTarget.id } });

        if (user.id === userTarget.id) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Ошибка` })
                        .setDescription(`Нельзя перевести самому себе`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        }

        if (!userWallet || !userTargetWallet) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Ошибка')
                        .setDescription('Вас или участника нет в базе данных')
                        .setColor('Red')
                        .setTimestamp()
                ],
                ephemeral: true
            })
        } else if (userWallet.balance < sumPayFloor) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Ошибка перевода ${userTarget.username}`, iconURL: userTarget.displayAvatarURL() })
                        .setDescription(`
                        У вас недостаточно средств для перевода ${userTarget}
                        у вас на руках: \`${userWallet.balance.toLocaleString('ru-RU')}\` монеток.
                        `)
                        .setColor('Red')
                        .setTimestamp()
                        .setThumbnail(userTarget.displayAvatarURL())
                ]
            })
        } else {
            userWallet.balance = Number(userWallet.balance) - sumPayFloor;
            userTargetWallet.balance = Number(userTargetWallet.balance) + sumPayFloor;
            userWallet.save();
            userTargetWallet.save();
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Перевод ${userTarget.username}`, iconURL: userTarget.displayAvatarURL() })
                        .setDescription(`
                        Вы успешно перевели ${userTarget} сумму в \`${sumPayFloor.toLocaleString('ru-RU')}\` монеток!
                        `)
                        .setColor(`#${colors.stable}`)
                        .setTimestamp()
                        .setFooter({ text: user.username, iconURL: user.displayAvatarURL() })
                ]
            })
        }
    }
});
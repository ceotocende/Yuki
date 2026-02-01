import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { RateDB } from "../../database/Models/MainModels/RateModel";
import { RecordsDB } from "../../database/Models/MainModels/RecordsModel";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import getMonth from "../../functions/getMonth";
import { colors, embedErrFromInteractions } from "../../utils/config";
import formatTimeForProfile from "../../functions/formatTimeForProfile";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('профиль')
        .setDescription('Отобразить свой профиль или участника')
        .addUserOption(op => op
            .setName('пользователь')
            .setDescription('Выбрать пользователя (необезательно)')
        ),
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('пользователь') || interaction.user;
        const guildMemberJoin = interaction.guild?.members.cache.get(targetUser.id)!.joinedAt;
        const guildMemberCreate = targetUser.createdAt;

        const userDb = await Users.findOne({ where: { user_id: targetUser.id } });
        const userRateDb = await RateDB.findOne({ where: { user_id: targetUser.id } });
        const userRecordDb = await RecordsDB.findOne({ where: { user_id: targetUser.id } });

        if (!userDb || !userRateDb || !userRecordDb) {
            await AddUserToDB(targetUser);

            interaction.reply({
                embeds: [
                    embedErrFromInteractions
                ],
                ephemeral: true
            });
        } else {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Информация об участнике ${targetUser.displayName}`, iconURL: `${interaction.guild!.iconURL() ? interaction.guild!.iconURL() : targetUser.avatarURL()}` })
                        .setThumbnail(targetUser.avatarURL() ? targetUser.avatarURL() : interaction.guild!.iconURL())
                        .setDescription(`Участник ${targetUser} присоединился на сервер \`${guildMemberJoin!.getUTCDate() ?? 0} ${getMonth(guildMemberJoin?.getMonth())} ${guildMemberJoin?.getUTCFullYear() ?? 0}\`.\nДата создания аккаунта: \`${guildMemberCreate.getUTCDate() ?? 0} ${getMonth(guildMemberCreate.getUTCMonth())} ${guildMemberCreate.getUTCFullYear()}\``)
                        .setFields(
                            {
                                name: 'Баланс участника',
                                value: `Монеток: **${Number(userDb.balance).toLocaleString('ru-RU')}**`
                            },
                            {
                                name: 'Уровень',
                                value: `\`${userDb.lvl}\``
                            },
                            {
                                name: 'Опыт',
                                value: `\`${userDb.exp}\``
                            },
                            {
                                name: `Сообщений`,
                                value: `\`${userRecordDb.message_count}\``
                            },
                            {
                                name: `Символов`,
                                value: `\`${userRecordDb.count_symbol}\``
                            },
                            {
                                name: `Использованых команд`,
                                value: `\`${userRecordDb.commands_count}\``
                            },
                            {
                                name: `Время в войсе`,
                                value: `\`${formatTimeForProfile(Number(userRateDb.voice))}\``
                            }
                        )
                        .setColor(`#${colors.stable}`)
                ]
            })
        }
    }
});
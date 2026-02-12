import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { colors, embedErrFromUserDb } from "../../utils/config";
import AddUserToDB from "../../database/Functions/AddUsersToDB";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('ролл')
        .setDescription('Сделать ролл с пользователем')
        .addUserOption(op => op
            .setName('user')
            .setDescription('Выберите пользователя')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('num')
            .setDescription('Выберите сумму для ролла')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(200000)
        )
        .setDMPermission(false),
    run: async (client, interaction) => {
        const targetUser = interaction.options.getUser('user')!;
        const sumRoll = interaction.options.getNumber('num')!;

        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        const targetUserDb = await Users.findOne({ where: { user_id: targetUser.id } });
        
        if (sumRoll <= 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()  
                        .setTitle('Ошибка')
                        .setDescription('Выберите сумму не равную нулю и не меньше нуля')
                        .setColor('Red')
                        .setTimestamp()
                ],
                ephemeral: true
            })
        }

        if (!userDb) {
            await AddUserToDB(interaction.user);
            return interaction.reply({
                embeds: [embedErrFromUserDb]
            });
        }

        if (!targetUserDb) {
            await AddUserToDB(targetUser);
            return interaction.reply({
                embeds: [embedErrFromUserDb]
            });
        }

        if (userDb.balance < sumRoll) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Ошибка')
                        .setDescription(`У вас не хватает денег, на данный момент у вас \`${userDb.balance}\` монеток`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        } else if (targetUserDb.balance < sumRoll) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Ошибка')
                        .setDescription(`У пользователя ${targetUser} не хватает денег, на данный момент у него \`${targetUserDb.balance}\` монеток`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        } else {
            const buttonRoll = new ButtonBuilder()
                .setCustomId('buttonRoll')
                .setLabel('Принять ролл')
                .setStyle(ButtonStyle.Success)

            const buttonRejectionRoll = new ButtonBuilder()
                .setCustomId('buttonRejectionRoll')
                .setLabel('Отказаться от ролла')
                .setStyle(ButtonStyle.Danger)

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonRoll, buttonRejectionRoll)
            const message = await interaction.reply({
                content: `||${targetUser}||`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Ролл!')
                        .setDescription(`${targetUser}, вам предлагает ${interaction.user} сделать ролл, на сумму \`${sumRoll}\` монеток.\nБудете роллить?`)
                        .setColor('Random')
                        .setTimestamp()
                ],
                components: [row]
            })

            const collector = message.createMessageComponentCollector({ time: 300000 });

            collector.on('collect', async subInteraction => {
                if ((subInteraction.user.id === targetUser.id) || (subInteraction.user.id === interaction.user.id)) {
                    if (subInteraction.isButton()) {
                        const customId = subInteraction.customId;
                        if ((customId === 'buttonRoll') && (subInteraction.user.id === targetUser.id)) {
                            setTimeout(() => {
                                message.edit({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle('Ролл принят!')
                                            .setDescription(`${interaction.user} и ${targetUser} роллят на сумму \`${sumRoll}\` монеток..`)
                                            .setColor('DarkRed')
                                            .setTimestamp()
                                    ],
                                    components: [],
                                    content: ''
                                }).then((msg) => {
                                    const rollFirst = Roll();
                                    const rollSecond = Roll();

                                    if (rollFirst > rollSecond) {
                                        setTimeout(() => {
                                            message.edit({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle('Ролл закончен!')
                                                        .setDescription(`${interaction.user} выигрывает у ${targetUser} со значением \`${rollFirst}\` против \`${rollSecond}\`.\nПоздравляем, ваша награда \`${sumRoll}\` монеток.`)
                                                        .setColor('Green')
                                                        .setTimestamp()
                                                ],
                                                components: [],
                                                content: ''
                                            });
                                        }, 5000);

                                        userDb.balance = Number(userDb.balance) + sumRoll;
                                        targetUserDb.balance = Number(targetUserDb.balance) - sumRoll;
                                        userDb.save();
                                        targetUserDb.save();
                                    } else if (rollFirst < rollSecond) {
                                        setTimeout(() => {
                                            message.edit({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle('Ролл закончен!')
                                                        .setDescription(`${targetUser} выигрывает у ${interaction.user} со значением \`${rollSecond}\` против \`${rollFirst}\`.\nПоздравляем, ваша награда \`${sumRoll}\` монеток.`)
                                                        .setColor('Green')
                                                        .setTimestamp()
                                                ],
                                                components: [],
                                                content: ''
                                            });
                                        }, 5000);

                                        userDb.balance = Number(userDb.balance) - sumRoll;
                                        targetUserDb.balance = Number(targetUserDb.balance) + sumRoll;
                                        userDb.save();
                                        targetUserDb.save();
                                    } else if (rollFirst === rollSecond) {
                                        setTimeout(() => {
                                            message.edit({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle('Ролл закончен!')
                                                        .setDescription(`${targetUser} и ${interaction.user} закончили ролл в ничью со значениями \`${rollSecond}\` и \`${rollFirst}\`.\nНикто не победил, сумма вычисляется у пользователей в размере \`${sumRoll}\` монеток.`)
                                                        .setColor(`#${colors.stable}`)
                                                        .setTimestamp()
                                                ],
                                                components: [],
                                                content: ''
                                            });
                                        }, 5000);

                                        userDb.balance = Number(userDb.balance) - sumRoll;
                                        targetUserDb.balance = Number(targetUserDb.balance) - sumRoll;
                                        userDb.save();
                                        targetUserDb.save();
                                    } else {
                                        setTimeout(() => {
                                            message.edit({
                                                embeds: [
                                                    new EmbedBuilder()
                                                        .setTitle('Ошибка')
                                                        .setDescription(`Произошла ошибка, обратитесь к разработчику бота`)
                                                        .setColor('Green')
                                                        .setTimestamp()
                                                ],
                                                components: [],
                                                content: ''
                                            });
                                        }, 5000);
                                        console.log(rollFirst, rollSecond)
                                    }
                                })
                            }, 10);
                        } else if ((customId === 'buttonRejectionRoll') && (subInteraction.user.id === targetUser.id)) {
                            message.edit({
                                content: ' ',
                                components: [],
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Отказ от ролла')
                                        .setDescription(`${targetUser} отказался роллится с участником ${interaction.user}`)
                                        .setColor('Red')
                                        .setTimestamp()
                                ]
                            });
                        } else if ((customId === 'buttonRejectionRoll') && (subInteraction.user.id === interaction.user.id)) {
                            message.edit({
                                content: ' ',
                                components: [],
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Отказ от ролла')
                                        .setDescription(`${interaction.user} отказался роллится с участником ${targetUser}`)
                                        .setColor('Red')
                                        .setTimestamp()
                                ]
                            });
                        } else {
                            return subInteraction.reply({
                                content: 'Не трогайте их пожалуйста)'
                            })
                        }
                    }
                }
            });

            collector.on('end', () => {
                message.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Ролл закрыт')
                            .setColor(`#${colors.stable}`)
                    ],
                    content: ' ',
                    components: []
                })
            })
        }
    }
});

function Roll(): number {
    return Math.floor(Math.random() * 100) + 1;
}
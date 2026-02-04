import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, InteractionResponse, Message, SlashCommandBuilder, TextChannel, time } from "discord.js";
import { client } from "../..";
import { channelsId, colors, embedErrFromUserDb, workName } from "../../utils/config";
import { Rewards } from "../../database/Models/MainModels/Rewards";
import { NotificationRewards } from "../../database/Models/SecondsModels/NotificationRewards";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import { Users } from "../../database/Models/MainModels/UsersModels";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('работа')
        .setDescription('Устроиться на работу и получить зарплату (обновляется раз в 4 часа)')
        .setDMPermission(false),
    async run(client, interaction) {
        const rewardsDb = await Rewards.findOne({ where: { guild_id: interaction.guild!.id } });
        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        const notificationRewardDb = await NotificationRewards.findOne({ where: { user_id: interaction.user.id } });
        const currentTime = Date.now();

        if (!rewardsDb || !userDb || !notificationRewardDb) {
            interaction.reply({
                embeds: [embedErrFromUserDb]
            });
            await AddUserToDB(interaction.user);
        } else {
            if (notificationRewardDb.work <= (currentTime - 14400000)) {
                notificationRewardDb.work = 0;
                notificationRewardDb.work += currentTime;
                userDb.balance += rewardsDb.work;
                await userDb.save();
                await notificationRewardDb.save();

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Работа` })
                    .setDescription(`${interaction.user} вы устроились на **${workName[Math.floor(Math.random() * workName.length)]}** и заработали \`${rewardsDb.work.toLocaleString('ru-RU')}\` монеток.`)
                    .setColor(`#${colors.stable}`)
                    .setThumbnail(`${interaction.user.avatarURL()}`)
                    .setTimestamp()
                    .setFields({
                        name: 'Ваша следующая награда будет доступна',
                        value: `<t:${Math.floor((currentTime + 14400000) / 1000)}:R>`
                    })
                    .setFooter({ text: `${interaction.guild?.name}` })

                const message = await interaction.reply({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('buttonFromWorkReward').setLabel('Отправить уведомление').setStyle(ButtonStyle.Primary))
                    ]
                })

                const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 })
                collector.on("collect", async subInteraction => {
                    if (subInteraction.user.id !== interaction.user.id) return;

                    if (subInteraction.isButton()) {
                        await subInteraction.deferReply({
                            ephemeral: true
                        });
                        if (subInteraction.customId === 'buttonFromWorkReward') {
                            collector.stop();
                            await subInteraction.followUp({
                                content: `Уведомление успешно поставлено`,
                                ephemeral: true,
                                fetchReply: true
                            });

                            const timer = setTimeout(async () => {
                                const channel = interaction.guild?.channels.cache.get(channelsId.basketChannel) as TextChannel;
                                await channel.send({
                                    content: `${subInteraction.user}`,
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle(`Уведомление о работе`)
                                            .setDescription(`Вы можете снова устроится на работу`)
                                            .setColor(`#${colors.stable}`)
                                            .setTimestamp()
                                    ]
                                })
                            }, 14400000);

                            timer;
                        }
                    }
                })

                collector.on('end', () => {
                    message.edit({
                        components: [],
                        embeds: [embed]
                    })
                })
            } else {
                interaction.reply({
                    ephemeral: true,
                    content: `Ваша следующая награда <t:${Math.floor((currentTime + 14400000) / 1000)}:R>`
                });
            }
        }
    },
})
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { Rewards } from "../../database/Models/MainModels/Rewards";
import { channelsId, colors, embedErrFromUserDb } from "../../utils/config";
import { NotificationRewards } from "../../database/Models/SecondsModels/NotificationRewards";
import AddUserToDB from "../../database/Functions/AddUsersToDB";


export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('дневная_награда')
        .setDescription('Получить свою дневную награду (обновляется раз в день)')
        .setDMPermission(false),
    async run(client, interaction) {
        const rewardsDb = await Rewards.findOne({ where: { guild_id: interaction.guild!.id } });
        const notificationRewardDb = await NotificationRewards.findOne({ where: { user_id: interaction.user.id } });
        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        const currentTime = Date.now();

        if (!rewardsDb || !userDb || !notificationRewardDb) {
            interaction.reply({
                embeds: [embedErrFromUserDb]
            });
            await AddUserToDB(interaction.user);
        } else {
            if (notificationRewardDb.daily <= (currentTime - 86400000)) {
                notificationRewardDb.daily = 0;
                notificationRewardDb.daily += currentTime;
                userDb.balance += rewardsDb.daily;
                await userDb.save();
                await notificationRewardDb.save();

                const embed = new EmbedBuilder()
                    .setAuthor({ name: `Ежедневная награда награда` })
                    .setDescription(`${interaction.user} вы забрали свои \`${rewardsDb.daily.toLocaleString('ru-RU')}\` монеток.`)
                    .setColor(`#${colors.stable}`)
                    .setThumbnail(`${interaction.user.avatarURL()}`)
                    .setTimestamp()
                    .setFields({
                        name: 'Ваша следующая награда будет доступна',
                        value: `<t:${Math.floor((currentTime + 86400000) / 1000)}:R>`
                    })
                    .setFooter({ text: `${interaction.guild?.name}` })

                const message = await interaction.reply({
                    embeds: [embed],
                    components: [
                        new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId('buttonFromDailyReward').setLabel('Отправить уведомление').setStyle(ButtonStyle.Primary))
                    ]
                })

                const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000 })
                collector.on("collect", async subInteraction => {
                    if (subInteraction.user.id !== interaction.user.id) return;

                    if (subInteraction.isButton()) {
                        await subInteraction.deferReply({
                            ephemeral: true
                        });
                        if (subInteraction.customId === 'buttonFromDailyReward') {
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
                                            .setTitle(`Уведомление об ежедневной награде`)
                                            .setDescription(`Вы можете забрать свою временную награду`)
                                            .setColor(`#${colors.stable}`)
                                            .setTimestamp()
                                    ]
                                })
                            }, 86400000);

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
                    content: `Ваша следующая награда <t:${Math.floor((currentTime + 86400000) / 1000)}:R>`
                });
            }
        }
    },
}) 
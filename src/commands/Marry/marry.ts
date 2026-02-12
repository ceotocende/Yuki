import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromUserDb } from "../../utils/config";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { Marry } from "../../database/Models/SecondsModels/Marry";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('поженится')
        .setDescription('Поженится со своей второй половинкой.')
        .addUserOption(op => op
            .setName('user')
            .setDescription('Выберите свою вторую половинку')
            .setRequired(true))
        .setDMPermission(false),
    async run(client, interaction) {
        const userTarget = interaction.options.getUser('user');
        await interaction.deferReply();

        if (!userTarget) return;

        const userMarryFirstFirst = await Marry.findOne({ where: { user_id_first: interaction.user.id } });
        const userMarrySecondFirst = await Marry.findOne({ where: { user_id_first: userTarget.id } });
        const userMarryFirstSecond = await Marry.findOne({ where: { user_id_second: interaction.user.id } });
        const userMarrySecondSecond = await Marry.findOne({ where: { user_id_second: userTarget.id } });

        const userFirst = await Users.findOne({ where: { user_id: interaction.user.id } });
        const userSecond = await Users.findOne({ where: { user_id: userTarget.id } });

        if (!userFirst || !userSecond) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Ошибка` })
                        .setDescription('К сожалению вас или участника нет в базе данных.\nНапишите что нибудь в любой чат и я вас обязательно добавлю!')
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        } else if (userMarryFirstFirst || userMarrySecondFirst || userMarryFirstSecond || userMarrySecondSecond) {
            interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Ошибка` })
                        .setDescription(`К сожалению вы или пользователь уже женаты.`)
                        .setColor('Red')
                        .setTimestamp()
                ]
            })
        } else {
            const buttonAccept = new ButtonBuilder()
                .setCustomId('buttonAcceptForMarryAccept')
                .setLabel('Да!')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💍')

            const buttonRefuse = new ButtonBuilder()
                .setCustomId('buttonRefuseForMarryAccept')
                .setLabel('Нет.')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🙅‍♀️')

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonAccept, buttonRefuse)

            const marryEmbed = new EmbedBuilder()
                .setAuthor({ name: `Свадьба!` })
                .setDescription(`${userTarget} вам сделали предложение руки и сердца от ${interaction.user}`)
                .setColor('White')
                .setImage('https://media1.tenor.com/m/4fgTN93I2CMAAAAC/marry-me.gif')

            const message = await interaction.editReply({
                content: `${userTarget}`,
                embeds: [marryEmbed],
                components: [row]
            });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

            collector.on("collect", async subInteraction => {
                if (subInteraction.isStringSelectMenu()) return;

                if (subInteraction.isButton()) {
                    await subInteraction.deferUpdate();

                    const customId = subInteraction.customId;
                    if (subInteraction.user.id !== userTarget.id) {
                        await subInteraction.followUp({
                            content: `Вы не можете принять или отказать предложение за другого участника.`,
                            ephemeral: true
                        })
                        return;
                    }

                    if (customId === 'buttonAcceptForMarryAccept') {
                        const newMarry = await Marry.create({ user_id_first: interaction.user.id, user_id_second: userTarget.id, time: Date.now() })

                        message.edit({
                            content: '',
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({ name: `Поздравляем!` })
                                    .setDescription(`${interaction.user} поженился(ась) с ${userTarget}\nСовет вам да любовь.`)
                                    .setColor(`#${colors.stable}`)
                                    .setTimestamp()
                            ],
                            components: []
                        })

                    } else if (customId === 'buttonRefuseForMarryAccept') {
                        message.edit({
                            content: '',
                            embeds: [
                                new EmbedBuilder()
                                    .setAuthor({ name: `...` })
                                    .setDescription(`${interaction.user} нам очень жаль, но ${userTarget} отказался(ась) от вашего предложения(`)
                                    .setColor(`#${colors.stable}`)
                                    .setTimestamp()
                            ],
                            components: []
                        })
                    }
                }
            });

            collector.on('end', async () => {
                await message.edit({
                    content: '',
                    embeds: [
                        new EmbedBuilder()
                            .setAuthor({ name: `Действие закрыто` })
                            .setTimestamp()
                            .setColor(`#${colors.stable}`)
                    ],
                    components: []
                })
            })
        }
    },
})
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { client } from "../..";
import { colors } from "../../utils/config";
import { Users } from "../../database/Models/MainModels/UsersModels";
import GenerationPagesOnBalance from "../../functions/GenerationPagesOnBalance";
import GenerationPagesOnLvl from "../../functions/GenerationPagesOnLvl";

const maxUserList = 10;
let page: number = 1;
let ratingType: 'balance' | 'level' = 'balance'; // Добавляем переменную для типа рейтинга

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('лидеры')
        .setDescription('Открыть таблицу лидеров')
        .setDMPermission(false),
    async run(client, interaction) {
        const allUserDb = await Users.findAll({});

        await interaction.deferReply();

        // Создаем меню выбора типа рейтинга
        const ratingTypeMenu = new StringSelectMenuBuilder()
            .setCustomId('ratingTypeSelect')
            .setPlaceholder('Выберите тип рейтинга')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('По монеткам')
                    .setValue('balance')
                    .setDefault(true),
                new StringSelectMenuOptionBuilder()
                    .setLabel('По уровню')
                    .setValue('level')
            );

        const rowSelect = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(ratingTypeMenu);

        const buttonDown = new ButtonBuilder()
            .setCustomId('buttonDownForRating')
            .setEmoji('⏪')
            .setLabel('Назад')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)

        const buttonNext = new ButtonBuilder()
            .setCustomId('buttonNextForRating')
            .setEmoji('⏩')
            .setLabel('Вперед')
            .setStyle(ButtonStyle.Primary)

        const buttonHome = new ButtonBuilder()
            .setCustomId('buttonHomeForRating')
            .setEmoji('🏠')
            .setLabel('Домой')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true)

        const rowButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonDown, buttonHome, buttonNext);

        // Функция для получения нужного embed в зависимости от типа рейтинга
        const getEmbed = async () => {
            if (ratingType === 'balance') {
                return await GenerationPagesOnBalance(page, maxUserList, interaction.guild!);
            } else {
                return await GenerationPagesOnLvl(page, maxUserList, interaction.guild!);
            }
        };

        const embed = await getEmbed();
        
        const message = await interaction.editReply({
            embeds: [embed],
            components: [rowSelect, rowButtons] // Добавляем оба ряда компонентов
        });

        const collector = message.createMessageComponentCollector({ 
            componentType: ComponentType.Button, 
            time: 300000 
        });

        // Создаем отдельный коллектор для меню выбора
        const selectCollector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 300000
        });

        // Обработчик для меню выбора типа рейтинга
        selectCollector.on("collect", async subInteraction => {
            if (interaction.user.id !== subInteraction.user.id) return;

            if (subInteraction.isStringSelectMenu() && subInteraction.customId === 'ratingTypeSelect') {
                await subInteraction.deferUpdate();
                
                // Обновляем выбранный тип рейтинга
                ratingType = subInteraction.values[0] as 'balance' | 'level';
                
                // Сбрасываем страницу на первую при смене типа
                page = 1;
                
                // Обновляем состояние кнопок
                buttonDown.setDisabled(true);
                buttonHome.setDisabled(true);
                buttonNext.setDisabled(false);
                
                // Обновляем опции меню
                ratingTypeMenu.setOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('По монеткам')
                        .setValue('balance')
                        .setDefault(ratingType === 'balance'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('По уровню')
                        .setValue('level')
                        .setDefault(ratingType === 'level')
                );

                // Получаем новый embed
                const newEmbed = await getEmbed();
                
                await message.edit({
                    embeds: [newEmbed],
                    components: [rowSelect, rowButtons]
                });
            }
        });

        // Обработчик для кнопок
        collector.on("collect", async subInteraction => {
            if (interaction.user.id !== subInteraction.user.id) return;

            if (subInteraction.isButton()) {
                const customId = subInteraction.customId;

                await subInteraction.deferUpdate();

                if (customId === 'buttonNextForRating') {
                    page += 1;
                    const embed = await getEmbed();
                    
                    if ((allUserDb.length / maxUserList) > page) {
                        buttonNext.setDisabled(false);
                    } else {
                        buttonNext.setDisabled(true);
                    }
                    buttonDown.setDisabled(false);
                    buttonHome.setDisabled(false);

                    await message.edit({
                        embeds: [embed],
                        components: [rowSelect, rowButtons]
                    });
                } else if (customId === 'buttonHomeForRating') {
                    page = 1;
                    const embed = await getEmbed();

                    buttonNext.setDisabled(false);
                    buttonDown.setDisabled(true);
                    buttonHome.setDisabled(true);

                    await message.edit({
                        embeds: [embed],
                        components: [rowSelect, rowButtons]
                    });
                } else if (customId === 'buttonDownForRating') {
                    page += -1;
                    const embed = await getEmbed();

                    if (page === 1) {
                        buttonDown.setDisabled(true);
                        buttonHome.setDisabled(true);
                    } else {
                        buttonDown.setDisabled(false);
                        buttonHome.setDisabled(false);
                    }

                    if ((allUserDb.length / maxUserList) < page) {
                        buttonNext.setDisabled(true);
                    } else {
                        buttonNext.setDisabled(false);
                    }

                    await message.edit({
                        embeds: [embed],
                        components: [rowSelect, rowButtons]
                    });
                }
            }
        });

        selectCollector.on('end', () => {
            // Убираем меню при завершении времени
            message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Рейтинг')
                        .setDescription('Таблица лидеров закрыта')
                        .setColor(`#${colors.stable}`)
                ],
                components: [  ]
            });
        });

        collector.on('end', async () => {
            await message.edit({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Рейтинг')
                        .setDescription('Таблица лидеров закрыта')
                        .setColor(`#${colors.stable}`)
                ],
                components: [  ]
            });
        });
    },
});
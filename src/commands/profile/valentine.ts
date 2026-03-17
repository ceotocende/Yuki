import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder, TextChannel } from "discord.js";
import { client } from "../..";
import { mapWhereFieldNames } from "sequelize/types/utils";
import { where } from "sequelize";
import { Valentine } from "../../database/Models/SecondsModels/Valentine";
import { channelsId } from "../../utils/config";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('анонимка')
        .setDescription('Отправить анонимку пользователю')
        .addUserOption(op => op
            .setName('user')
            .setDescription('Выберите пользователя')
            .setRequired(true))
        .addStringOption(op => op
            .setName('text')
            .setDescription('Выберите текст который вы хотите написать')
            .setRequired(true)
            .setMaxLength(250)
            .setMinLength(10)),
    async run(client, interaction) {
        const targetUser = interaction.options.getUser('user');
        const description = interaction.options.getString('text');

        interaction.reply({
            ephemeral: true,
            content: `Ваша анонимка отправлена на рассмотрение. Откройте личные сообщения, чтобы я могла уведомить вас о рассмотрении анонимки.`
        })

        const channelValentineAdm = interaction.guild!.channels.cache.get(channelsId.valentineAdm) as TextChannel;

        const message = channelValentineAdm.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle('Подтвердите заявку')
                    .setDescription(`
                - Кому: ${targetUser} 

                - Текст: \`\`\`${description}\`\`\`
                `)
            ]
        })

        const button = new ActionRowBuilder<ButtonBuilder>().setComponents(
            new ButtonBuilder()
                .setCustomId(`buttonTrueValentine-${(await message).id}`)
                .setLabel('Подтвердить')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId(`buttonFalseValentine-${(await message).id}`)
                .setLabel('Отказать')
                .setStyle(ButtonStyle.Danger)
        );

        (await message).edit({
            components: [button]
        })

        const valentineDb = await Valentine.findOne({ where: { id: (await message).id } });

        if (!valentineDb) {
            await Valentine.create({ id: (await message).id, description: description!, user_id_first: interaction.user.id, user_id_second: targetUser!.id });
        } else if (valentineDb) {
            valentineDb.description = '';
            valentineDb.description = description!;
        }
    },
})
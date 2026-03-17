import { EmbedBuilder, GuildMemberRoleManager, PermissionFlagsBits, PermissionsBitField, Role, TextChannel } from "discord.js";
import { client } from "../..";
import { channelsId } from "../../utils/config";
import { Valentine } from "../../database/Models/SecondsModels/Valentine";

client.on('interactionCreate', async interaction => {
    if (interaction.isButton() && (interaction.channel!.id === '1471597422512701531')) {
        const splittedId = interaction.customId.split('-');
        const valentineDb = await Valentine.findOne({ where: { id: splittedId[1] } });
        const channelVal = interaction.guild?.channels.cache.get(channelsId.valentineChannel) as TextChannel;
        const userPermission = interaction.member!.permissions as PermissionsBitField;
        
        if (userPermission.has(PermissionFlagsBits.Administrator)) {
            await interaction.deferReply({
                ephemeral: true
            })

            interaction.editReply({
                content: `Ответ принят`
            })

            if (!valentineDb) {
                interaction.editReply({
                    content: 'Сообщение не найдено, обратитесь к разработчику'
                })
            } else if (valentineDb) {
                const messageId = await interaction.channel?.messages.fetch(`${valentineDb.id}`)
                if (interaction.customId === `buttonTrueValentine-${valentineDb.id}`) {

                    interaction.guild!.members.fetch(valentineDb.user_id_first)
                        .then(user => {
                            user.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Ваша анонимка одобрена')
                                        .setDescription(`Вы отправили ее для участника <@${valentineDb.user_id_second}>`)
                                        .setColor('Green')
                                        .setTimestamp()
                                ]
                            })
                        })

                    channelVal.send({
                        content: `<@${valentineDb.user_id_second}>`,
                        embeds: [
                            new EmbedBuilder()
                                .setTitle(`Анонимка`)
                                .setDescription(`${valentineDb.description}`)
                                .setTimestamp()
                                .setColor('Red')
                                .setThumbnail('https://svg-art.ru/wp-content/uploads/2016/05/heart-whole.png')
                        ]
                    })

                    messageId?.edit({
                        components: [],
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Анонимка одобрена')
                                .setDescription(`> Модератор ${interaction.user}\n> Анонимка: \n- Участнику <@${valentineDb.user_id_second}> \n- Контент: \`\`\`${valentineDb.description}\`\`\``)
                                .setTimestamp()
                                .setColor('Green')
                        ]
                    })

                } else if (interaction.customId === `buttonFalseValentine-${valentineDb.id}`) {
                    interaction.guild!.members.fetch(valentineDb.user_id_first)
                        .then(user => {
                            user.send({
                                embeds: [
                                    new EmbedBuilder()
                                        .setTitle('Ваша анонимка отклонена')
                                        .setDescription(`Вы отправили ее для участника <@${valentineDb.user_id_second}>`)
                                        .setColor('Red')
                                        .setTimestamp()
                                ]
                            })
                        })

                    messageId?.edit({
                        components: [],
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('Анонимка отклонена')
                                .setDescription(`> Модератор ${interaction.user}\n> Анонимка: \n- Участнику <@${valentineDb.user_id_second}> \n- Контент: \`\`\`${valentineDb.description}\`\`\``)
                                .setTimestamp()
                                .setColor('DarkRed')
                        ]
                    })
                }
            }
        }
    }
})
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromInteractions } from '../../utils/config';
import { lick } from '../../utils/gif.json'

export default new client.command({
    structure: new SlashCommandBuilder()
    .setName('лизнуть')
        .setDescription('лизнуть')
        .addUserOption(option => option
            .setName('юзер')
            .setDescription('выберите пользователя')
            .setRequired(true))
        .addStringOption(option => option
                .setName('контент')
                .setDescription('введите контент сообщения')
                .setRequired(false)),
    run(client, interaction) {
        const content = interaction.options.getString('контент');
            let textContent = '';
            if (content) {
                textContent = ('> **' + content + '**');;
            }
        const gif = lick[Math.floor(Math.random() * lick.length)];
        const user = interaction.user;
        const target = interaction.options.getUser('юзер');
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Команда: лизнуть' })
            .setDescription(`${user}, лизнул(а) ${target}\n\n${textContent}`)
            .setImage(gif)
            .setTimestamp()
            .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` })
            .setColor(`#${colors.stable}`)
        if (target?.bot === false && user.id != target?.id) {
            setTimeout(() => {
                interaction.reply({
                    content: `<@${target.id}>`,
                    embeds: [embed],
                }).then((msg) => {
                setTimeout(() => {
                    interaction.editReply({
                        content: ` `,
                        embeds: [embed]
                    });
                }, 10)
            })
            }, 100)
        } else if (target?.bot === true || user.id === target?.id) {
            interaction.reply({
                embeds: [embedErrFromInteractions]
            });
        }
       
    },
})
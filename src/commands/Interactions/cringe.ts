import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromInteractions } from '../../utils/config';
import { kringe } from '../../utils/gif.json'


export default new client.command({
    structure: new SlashCommandBuilder()
    .setName('кринж')
        .setDescription('кринжануть')
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
        const gif = kringe[Math.floor(Math.random() * kringe.length)];
        const user = interaction.user;
        const target = interaction.options.getUser('юзер');
        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Команда: кринж' })
            .setDescription(`${user}, кринжует с ${target}\n\n${textContent}`)
            .setImage(gif)
            .setColor(`#${colors.stable}`)
            .setTimestamp()
            .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` });
        
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
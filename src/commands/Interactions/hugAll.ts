import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromInteractions } from '../../utils/config';
import { hugAll } from '../../utils/gif.json'

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('обнять_всех')
        .setDescription('обнять весь чат')
        .addStringOption(option => option
            .setName('контент')
            .setDescription('введите контент сообщения')
            .setRequired(false)),
    run(client, interaction) {
        const content = interaction.options.getString('контент');
        let textContent = '';
        if (content) {
            textContent = ('> **' + content + '**');
        }
        const user = interaction.user;
        const gif = hugAll[Math.floor(Math.random() * hugAll.length)];

        let text = `${interaction.user} обнял весь чат\n\n${textContent}`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Команда: обнять всех' })
            .setDescription(text)
            .setColor(`#${colors.stable}`)
            .setImage(gif)
            .setTimestamp()
            .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` });
        setTimeout(() => {
            interaction.reply({
                embeds: [embed],
            })
        }, 100);
    },
})
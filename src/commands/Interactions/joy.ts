import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromInteractions } from '../../utils/config';
import { joy } from '../../utils/gif.json'

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('радоваться')
        .setDescription('радоваться')
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
        const user = interaction.user;
        const gif = joy[Math.floor(Math.random() * joy.length)];

        const embed = new EmbedBuilder()
            .setAuthor({ name: 'Команда: радоваться' })
            .setDescription(`${user} радуется\n\n${textContent}`)
            .setColor(`#${colors.stable}`)
            .setTimestamp()
            .setImage(gif)
            .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` });
        setTimeout(() => {
            interaction.reply({
                embeds: [embed],
            });
        }, 100)
    }
})
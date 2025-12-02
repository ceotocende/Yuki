import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors, embedErrFromInteractions } from '../../utils/config';
import { drink } from '../../utils/gif.json'

export default new client.command({
    structure: new SlashCommandBuilder()
    .setName('бухнуть')
        .setDescription('бухнуть')
        .addStringOption(option => option
            .setName('контент')
            .setDescription('введите контент сообщения')
            .setRequired(false)),
    run(client, interaction) {
        const target = interaction.options.getUser('юзер');

        const content = interaction.options.getString('контент');
 
        let textContent = '';
        if (content) {
            textContent = ('> **' + content + '**');;
        }
        const gif = drink[Math.floor(Math.random() * drink.length)];
        const user = interaction.user;

        if (!target) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: 'Команда: бухнуть' })
                        .setDescription(`${user} бухает\n\n${textContent}`)
                        .setImage(gif)
                        .setTimestamp()
                        .setColor(`#${colors.stable}`)
                        .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` })
                ]
            })
        }
    },
})
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { colors } from '../../utils/config';
import { suicide } from '../../utils/gif.json'


export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('суецид')
        .setDescription('суицид')
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
                const gif = suicide[Math.floor(Math.random() * suicide.length)];
        
                const embed = new EmbedBuilder()
                    .setAuthor({ name: 'Команда: суицид' })
                    .setDescription(`${user}, не стал принимать мир таким какой он есть и решил покончить жизнь самоубийством\n\n${textContent}`)
                    .setColor(`#${colors.stable}`)
                    .setTimestamp()
                    .setImage(gif)
                    .setFooter({ iconURL: `${user.displayAvatarURL()}`, text: `${user.username}` });
        
                interaction.reply({
                    embeds: [embed],
                });
            }
})
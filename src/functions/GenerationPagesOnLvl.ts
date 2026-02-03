import { EmbedBuilder, Guild } from "discord.js";
import { colors } from "../utils/config";
import { Sequelize } from "sequelize";
import { Users } from "../database/Models/MainModels/UsersModels";

export default async function GenerationPagesOnLvl(page: number, maxMember: number, guild: Guild) {
    const userDb = await Users.findAll({
        attributes: [
            'user_id',
            [Sequelize.fn('max', Sequelize.col('lvl')), 'lvl']
        ],
        group: ['user_id'],
        order: [[Sequelize.fn('max', Sequelize.col('lvl')), 'DESC']]
    });
    const from = (page - 1) * maxMember;
    const to = page * maxMember;
    const pagesCount = Math.ceil(userDb.length / maxMember);

    const embed = new EmbedBuilder()
        .setTitle('Рейтинг по опыту')
        .setDescription(`Страница ${page} из ${pagesCount}`)
        .setColor(`#${colors.stable}`)
        .setTimestamp()
        .setThumbnail(`${guild.iconURL()}`);

        userDb.slice(from, to).forEach((user, index) => {
        embed.addFields({
            name: `Место №${index + from + 1}.឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵            ឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵            ឵            ឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵឵            `,
            value: `<@${user.user_id}>\n\`${user.lvl}\` уровень`,
        });
    });
    embed.setFooter({ text: `Страница ${page} из ${pagesCount}` });
    return embed;
}
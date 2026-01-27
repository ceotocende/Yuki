import { SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import AddUserToDB from "../../database/Functions/AddUsersToDB";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('get_exp')
        .setDescription('Выдача опыта участнику')
        .addUserOption(op => op
            .setName('user')
            .setDescription('user')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('num')
            .setDescription('num')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(8),
    run: async (client, interaction) => {
        const targerUser = interaction.options.getUser('user')!;
        const targetNum = interaction.options.getNumber('num')!;
        const userDb = await Users.findOne({ where: { user_id: targerUser.id } });

        if (!userDb) {
            interaction.reply('Произошла ошибка, пользователя нет в базе данных, но мы его добавим.\nИспользуйте эту команду еще раз.');
            await AddUserToDB(targerUser);
        } else {
            userDb.exp = Number(userDb.exp) + targetNum;
            userDb.save();
            interaction.reply(`Пользователю ${targerUser} добавленно \`${targetNum}\` опыта.`);
        }
    }
});
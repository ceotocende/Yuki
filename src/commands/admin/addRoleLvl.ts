import { SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { ShopDB } from "../../database/Models/MainModels/ShopModels";
import { RankRole } from "../../database/Models/SecondsModels/RankRole";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('добавить_изменить_роль_уровеней')
        .setDescription('команда админа НЕ ТРОГАТЬ')
        .addRoleOption(op => op
            .setName('роль')
            .setDescription('Выберите роль')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('lvl')
            .setDescription('Введите lvl')
            .setRequired(true)
        )
        .addBooleanOption(op => op
            .setName('bool')
            .setDescription('Лучше не трогать если не знаешь как работать с ней, true добавить')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(8),
    run: async (client, interaction) => {
        const role = interaction.options.getRole('роль');
        const lvl = interaction.options.getNumber('lvl');
        const bool = interaction.options.getBoolean('bool');

        if (!role || !lvl) return interaction.reply({ content: 'произошла ошибка', ephemeral: true });

        const roleDb = await RankRole.findOne({ where: { role_id: role.id } });
        if (bool === true) {
            if (!roleDb) {
                const newItem = await RankRole.create({ role_id: role.id, lvl: lvl });
    
                newItem.save();
    
                interaction.reply({
                    content: `Роль ${role}, добавленна **${lvl}**`
                })
            } else {
                roleDb.lvl = lvl;
    
                interaction.reply({
                    content: `Lvl роли ${role}, изменен на **${lvl}**`
                })

                roleDb.save()
            }
        } else {
            const destroyItem = await RankRole.destroy({ where: { role_id: role.id } });
            interaction.reply({
                    content: `Удалена роль ${role}`
                })
        }
    }
});
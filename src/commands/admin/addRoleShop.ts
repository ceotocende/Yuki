import { SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { ShopDB } from "../../database/Models/MainModels/ShopModels";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('доабвить_изменить_роль_в_магазин')
        .setDescription('команда админа НЕ ТРОГАТЬ')
        .addRoleOption(op => op
            .setName('роль')
            .setDescription('Выберите роль')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('цена')
            .setDescription('Введите цену')
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
        const cost = interaction.options.getNumber('цена');
        const bool = interaction.options.getBoolean('bool');

        if (!role || !cost) return interaction.reply({ content: 'произошла ошибка', ephemeral: true });

        const itemsShop = await ShopDB.findOne({ where: { item_id: role.id } });
        if (bool === true) {
            if (!itemsShop) {
                const newItem = await ShopDB.create({ item_id: role.id, cost: cost, time: '0', timely: false });
    
                newItem.save();
    
                interaction.reply({
                    content: `Роль ${role}, добавленна стоимостью **${cost}**`
                })
            } else {
                itemsShop.cost = cost;
    
                interaction.reply({
                    content: `Цена роли ${role}, изменна на **${cost}**`
                })
            }
        } else {
            const destroyItem = await ShopDB.destroy({ where: { item_id: role.id } });
            interaction.reply({
                    content: `Удалена роль ${role}`
                })
        }
    }
});
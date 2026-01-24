import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder, 
    GuildMemberRoleManager, 
    StringSelectMenuBuilder, 
    SlashCommandBuilder, 
    StringSelectMenuOptionBuilder 
} from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { colors } from "../../utils/config";
import { ShopDB } from "../../database/Models/MainModels/ShopModels";
import { UsersItems } from "../../database/Models/SecondsModels/UsersItemsModel";

const list = 10;
const pagePare = 5;
let page = 1;

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('магазин')
        .setDescription('открыть магазин'),
    run: async (client, interaction) => {
        const shop = await ShopDB.findAll({
            attributes: [
                'item_id',
                'cost',
            ],
            order: [['cost', 'DESC']],
            raw: true
        });

        const userBal = await Users.findOne({ where: { user_id: interaction.user.id } });

        const roleId = shop.map(shop => shop.cost);
        const roleIds = shop.map(shop => shop.item_id);
        const pageList = Math.ceil(roleId.length / list);
        const member1 = interaction.user;

        await interaction.deferReply();

        const buttonNext = new ButtonBuilder()
            .setCustomId('buttonNextShop')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(false);

        const buttonBack = new ButtonBuilder()
            .setCustomId('buttonBackShop')
            .setEmoji('⏮')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true);

        const buttinHome = new ButtonBuilder()
            .setCustomId('buttonHomeShop')
            .setEmoji('🏠')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(true);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(buttonBack, buttinHome, buttonNext);
        const rowMenu = generateMenu(shop, page, list, pagePare);

        const embed = await pagination(shop, page, list, pagePare);

        const message = await interaction.editReply({
            embeds: [embed],
            components: [row, rowMenu]
        });

        const filter = (i: any) => {
            return i.user.id === interaction.user.id;
        };

        const collector = message.createMessageComponentCollector({ filter, time: 300000 });

        collector.on('collect', async (subInteraction) => {
            if (subInteraction.user.id !== interaction.user.id) return interaction.reply({ content: 'Не ваше взаимодействие', ephemeral: true });

            if (subInteraction.isStringSelectMenu()) {
                if (subInteraction.customId === 'shopRoleMenu') {
                    await subInteraction.deferUpdate();
                    let roleId = subInteraction.values[0];
                    const userRoles = await UsersItems.findOne({ 
                        where: { 
                            user_id: member1.id, 
                            item_id: roleId 
                        } 
                    });
                    const roleMap = new Map(shop.map(role => [role.item_id, role.cost]));
                    const shopItem = shop.find(role => role.item_id === roleId);
                    
                    if (!shopItem) {
                        return;
                    }
                    
                    const roleBye = Number(shopItem.cost);
                    const roleByeId = String(shopItem.item_id);
                    
                    if (roleIds.includes(subInteraction.values[0])) {
                        if (!userBal) {
                            const embed = new EmbedBuilder()
                                .setTitle('Ошибка')
                                .setDescription(`Вас нет в базе данных`)
                                .setColor(`#${colors.stable}`)
                                .setTimestamp();
                            
                            return await subInteraction.followUp({
                                embeds: [embed],
                                ephemeral: true
                            });
                        }
                        else if (userBal.balance < 1) {
                            const embed = new EmbedBuilder()
                                .setTitle('Ошибка')
                                .setDescription(`У вас слишком мало средств \n Узнать свой баланс можно командой \`/профиль\` или \`/ранг\``)
                                .setColor(`#${colors.stable}`)
                                .setTimestamp();
                            
                            return await subInteraction.followUp({
                                embeds: [embed],
                                ephemeral: true
                            });
                        } else if (userBal.balance < roleBye) {
                            const embed = new EmbedBuilder()
                                .setTitle('Ошибка')
                                .setDescription('У вас недостаточно средств \n Узнать свой баланс можно командой \`/профиль\` или \`/ранг\`')
                                .setColor(`#${colors.stable}`)
                                .setTimestamp();
                            
                            return await subInteraction.followUp({
                                embeds: [embed],
                                ephemeral: true
                            });
                        } else {
                            const memberRole = subInteraction.member!.roles as GuildMemberRoleManager;
                            
                            if (memberRole.cache.has(roleByeId)) {
                                const embed = new EmbedBuilder()
                                    .setTitle('Ошибка')
                                    .setDescription(`У вас уже есть роль <@&${roleByeId}>`)
                                    .setColor(`#${colors.stable}`)
                                    .setTimestamp();
                                
                                return await subInteraction.followUp({
                                    embeds: [embed],
                                    ephemeral: true
                                });
                            } else if (!userRoles) {
                                await UsersItems.create({ 
                                    user_id: subInteraction.user.id, 
                                    item_id: subInteraction.values[0] 
                                });
                                
                                userBal.balance = Number(userBal.balance) - roleBye;
                                await userBal.save();
                                
                                try {
                                    await memberRole.add(roleByeId);
                                } catch (error) {
                                    console.error('Ошибка при добавлении роли:', error);
                                }
                                
                                const embed = new EmbedBuilder()
                                    .setTitle('Поздравляем!')
                                    .setDescription(`Поздравляем с покупкой роли <@&${roleByeId}>`)
                                    .setColor(`#${colors.stable}`)
                                    .setTimestamp();
                                
                                return await subInteraction.followUp({
                                    embeds: [embed],
                                    ephemeral: true
                                });
                            } else if (userRoles.item_id === roleByeId) {
                                const embed = new EmbedBuilder()
                                    .setTitle('Ошибка')
                                    .setDescription(`У вас уже есть эта роль`)
                                    .setColor(`#${colors.stable}`)
                                    .setTimestamp();
                                
                                return await subInteraction.followUp({
                                    embeds: [embed],
                                    ephemeral: true
                                });
                            }
                        }
                    }
                }
            } else if (subInteraction.isButton()) {
                await subInteraction.deferUpdate();
                
                switch (subInteraction.customId) {
                    case 'buttonBackShop':
                        page -= 1;
                        break;
                    case 'buttonNextShop':
                        page += 1;
                        break;
                    case 'buttonHomeShop':
                        page = 1;
                        break;
                    default:
                        return;
                }
                
                const embed = await pagination(shop, page, list, pagePare);
                const rowMenu = generateMenu(shop, page, list, pagePare);
                
                row.components[0].setDisabled(page === 1);
                row.components[2].setDisabled(page === pageList);
                row.components[1].setDisabled(page === 1);

                await message.edit({ 
                    embeds: [embed], 
                    components: [row, rowMenu] 
                });

                collector.resetTimer();
            }
        });

        function resetPage() {
            page = 1;
        }

        client.on('interactionCreate', (interaction) => {
            if (interaction.isCommand()) {
                resetPage();
            }
        });

        collector.on('end', async (collected, reason) => {
            const embedEnd = new EmbedBuilder()
                .setTitle('Магазин ролей закрыт')
                .setDescription(`Магазин вызван ${member1}`)
                .setColor(`#${colors.stable}`)
                .setTimestamp();
            
            try {
                await message.edit({
                    embeds: [embedEnd],
                    components: []
                });
            } catch (error) {
                console.error('Ошибка при редактировании сообщения:', error);
            }
        });
    }
});

async function pagination(data: any[], page: number, rowsPerPage: number, pagesPerGroup: number) {
    const from = (page - 1) * rowsPerPage;
    const to = page * rowsPerPage;
    const pagesCount = Math.ceil(data.length / rowsPerPage);

    const embed = new EmbedBuilder()
        .setTitle('Магазин ролей')
        .setDescription(`Страница ${page} из ${pagesCount}`)
        .setColor(`#${colors.stable}`)
        .setTimestamp()
        .setThumbnail('https://images-ext-1.discordapp.net/external/2Dt5COxBH4Jt0Vlqo5BnoZp15gjQ0rIdxhoJ701t2s0/https/cdn.discordapp.com/icons/1397730981124767878/8f35d9bc8f00f654d0f9a36053a067dd.png');

    data.slice(from, to).forEach((item, index) => {
        embed.addFields({
            name: `Роль №${index + from + 1}.`,
            value: `
            Роль <@&${item.item_id}>
            Стоимость: **${item.cost}** Монеток
            `,
        });
    });
    
    embed.setFooter({ text: `Страница ${page} из ${pagesCount}` });
    return embed;
}

function generateMenu(data: any[], page: number, rowsPerPage: number, pagesPerGroup: number) {
    const from = (page - 1) * rowsPerPage;
    const to = page * rowsPerPage;

    const top = new StringSelectMenuBuilder()
        .setCustomId('shopRoleMenu')
        .setPlaceholder('Выберите роль для покупки');

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(top);
    
    data.slice(from, to).forEach((item, index) => {
        top.addOptions(
            new StringSelectMenuOptionBuilder()
                .setLabel(`Роль №${index + from + 1}`)
                .setValue(String(item.item_id))
        );
    });
    
    return row;
}
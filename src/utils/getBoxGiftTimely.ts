import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Channel, EmbedBuilder, TextChannel } from "discord.js";
import { colors } from "./config";
import { Users } from "../database/Models/MainModels/UsersModels";
import AddUserToDB from "../database/Functions/AddUsersToDB";

let userIdWin = "0";

export default async function getBoxGiftTimely(channel: TextChannel) {

    let sum = 1000;

    const randomSum = Math.floor(Math.random() * 5);

    switch (randomSum) {
        case 0:
            sum = 500;
            break;
        case 1:
            sum = 100;
            break;
        case 2:
            sum = 150;
            break;
        case 3:
            sum = 200;
            break;
        case 4:
            sum = 250;
            break;
        default:
            sum = 1;
            break;
    }

    const embed = new EmbedBuilder()
        .setAuthor({ name: `Быстрый розыгрыш 🎉` })
        .setDescription(`Быстрый розыгрыш \`${sum}\` монеток\nСкорее нажимайте кнопку получить приз.`)
        .setColor(`#${colors.stable}`)
        .setTimestamp()

    const button = new ButtonBuilder()
        .setCustomId('buttonFromGiftMessageTimely')
        .setLabel('Получить приз')
        .setEmoji('🎉')
        .setStyle(ButtonStyle.Primary)

    const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button)
    
    const message = await channel.send({
        embeds: [embed],
        components: [row]
    })
    
    const collector = message.createMessageComponentCollector({ time: 60000 });
    
    collector.on('collect', async subInteraction => {
        const { customId } = subInteraction;
        const userBalance = await Users.findOne({ where: { user_id: subInteraction.user.id } });
        
        if (customId === 'buttonFromGiftMessageTimely') {
            subInteraction.deferUpdate()
            if (!userBalance) {
                await AddUserToDB(subInteraction.user);
                subInteraction.followUp({
                    content: `Вас нет в базе данных`,
                    ephemeral: true
                })
            } else if (userBalance.user_id === subInteraction.user.id) {
                userBalance.balance = Number(userBalance.balance) + sum;
                userBalance.save();
                userIdWin = subInteraction.user.id;
                collector.stop();
            }
        }
    })

    collector.on('end', async i => {
        message.edit({
            embeds: [
                new EmbedBuilder()
                    .setAuthor({ name: `Приз получен` })
                    .setDescription(`Поздравляем победителя <@${userIdWin !== "0" ? userIdWin : 'никого'}>!`)
                    .setTimestamp()
                    .setColor(`#${colors.stable}`)
            ],
            components: []
        })
    })
}

import { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    ComponentType 
} from "discord.js";
import { client } from "../..";
import { Users } from "../../database/Models/MainModels/UsersModels";
import { embedErrFromUserDb } from "../../utils/config";
import AddUserToDB from "../../database/Functions/AddUsersToDB";

// Константы
const MULTIPLIER = 1.2; // Множитель выигрыша/проигрыша (20%)

// Система кулдаунов
const cooldowns = new Map();
const COOLDOWN_TIME = 60000; // 60 секунд кулдауна

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('флип')
        .setDescription('Подбросьте монетку: орел или решка')
        .addIntegerOption(option => 
            option
                .setName('ставка')
                .setDescription('Сумма ставки')
                .setRequired(true)
                .setMinValue(100)
                .setMaxValue(5000)),
    
    run: async (client, interaction) => {
        // Проверка кулдауна
        const userId = interaction.user.id;
        const currentTime = Date.now();
        
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + COOLDOWN_TIME;
            
            if (currentTime < expirationTime) {
                const timeLeft = (expirationTime - currentTime) / 1000;
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⏳ Кулдаун')
                            .setDescription(`Подождите **${timeLeft.toFixed(1)}** секунд перед повторным использованием команды!`)
                            .setColor('Yellow')
                    ],
                    ephemeral: true
                });
            }
        }
        
        const betAmount = interaction.options.getInteger('ставка')!;
        
        // Проверка пользователя в БД
        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        if (!userDb) {
            interaction.reply({
                embeds: [embedErrFromUserDb],
                ephemeral: true
            });
            return await AddUserToDB(interaction.user);
        }
        
        // Проверка баланса
        const userBalance = userDb.balance;
        if (userBalance < betAmount) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Недостаточно средств')
                        .setDescription(`У вас на балансе: **${userBalance.toLocaleString('ru-RU')}**\nТребуется: **${betAmount.toLocaleString('ru-RU')}**`)
                        .setColor('Red')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }
        
        // Создание кнопок для выбора
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('heads')
                    .setLabel('Орел')
                    .setEmoji('🦅')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('tails')
                    .setLabel('Решка')
                    .setEmoji('🪙')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        // Начальное сообщение
        const initialEmbed = new EmbedBuilder()
            .setTitle('🎲 Подбрасывание монетки')
            .setDescription(`**Ставка:** ${betAmount.toLocaleString('ru-RU')} монет`)
            .addFields(
                { name: '🎯 Выберите сторону:', value: 'Нажмите на кнопку ниже чтобы сделать выбор' },
                { name: '📊 Ваш текущий баланс:', value: `${userBalance.toLocaleString('ru-RU')} монет` }
            )
            .setColor('Blue')
            .setFooter({ 
                text: `У вас 30 секунд чтобы сделать выбор`,
                iconURL: interaction.user.displayAvatarURL() 
            })
            .setTimestamp();
        
        await interaction.reply({ 
            embeds: [initialEmbed], 
            components: [row] 
        });
        
        // Устанавливаем кулдаун
        cooldowns.set(userId, currentTime);
        
        // Ожидание выбора пользователя
        const filter = (i: any) => i.user.id === interaction.user.id;
        const collector = interaction.channel!.createMessageComponentCollector({
            componentType: ComponentType.Button,
            filter,
            time: 30000 // 30 секунд на выбор
        });
        
        let userChoice = null;
        let choiceMade = false;
        
        collector.on('collect', async (i) => {
            if (choiceMade) return;
            
            await i.deferUpdate();
            userChoice = i.customId;
            choiceMade = true;
            
            // Убираем кнопки после выбора
            await interaction.editReply({ 
                components: [] 
            });
            
            // Подбрасываем монетку
            await flipCoin(interaction, userDb, betAmount, userChoice);
            collector.stop();
        });
        
        collector.on('end', async (collected, reason) => {
            if (reason === 'time' && !choiceMade) {
                // Возвращаем деньги если время вышло
                const timeoutEmbed = new EmbedBuilder()
                    .setTitle('⏰ Время вышло')
                    .setDescription(`Вы не успели сделать выбор.\n**${betAmount.toLocaleString('ru-RU')}** монет возвращены на ваш баланс.`)
                    .setColor('Orange')
                    .setTimestamp();
                
                await interaction.editReply({ 
                    embeds: [timeoutEmbed], 
                    components: [] 
                });
            }
        });
    }
});

// Функция подбрасывания монетки
async function flipCoin(interaction: any, userDb: any, betAmount: any, userChoice: any) {
    // Анимация подбрасывания монетки
    const loadingMessages = [
        "🔄 Монетка подбрасывается...",
        "⚡ Монетка вращается в воздухе...",
        "🌀 Определяем результат..."
    ];
    
    // Показываем анимацию
    const loadingEmbed = new EmbedBuilder()
        .setTitle('🎲 Подбрасывание монетки')
        .setDescription(loadingMessages[0])
        .setColor('Yellow')
        .setFooter({ 
            text: `Пожалуйста, подождите...`,
            iconURL: interaction.user.displayAvatarURL() 
        });
    
    await interaction.editReply({ 
        embeds: [loadingEmbed] 
    });
    
    // Анимация смены сообщений
    for (let i = 1; i < loadingMessages.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        loadingEmbed.setDescription(loadingMessages[i]);
        await interaction.editReply({ 
            embeds: [loadingEmbed] 
        });
    }
    
    // Задержка перед результатом
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Генерация результата
    const result = Math.floor(Math.random() * 10) + 1;
    let coinResult;
    let winAmount = 0;
    let newBalance = Number(userDb.balance);
    
    // Вероятности: 45% орел, 45% решка, 10% ребро
    if (result <= 5) {
        coinResult = 'heads'; // Орел (40%)
    } else if (result <= 9) {
        coinResult = 'tails'; // Решка (40%)
    } else {
        coinResult = 'edge'; // Ребро (20%)
    }
    
    // Расчет результата
    const amountWithMultiplier = Math.floor(betAmount * MULTIPLIER);
    let resultMessage = '';
    let color = 0xFFFFFF;
    let title = '🎲 Результат';
    let emoji = '';
    
    if (coinResult === 'edge') {
        // Монета упала ребром - возвращаем ставку
        resultMessage = `**⚪ Монетка упала ребром!**\n`;
        resultMessage += `Ваша ставка **${betAmount.toLocaleString('ru-RU')}** монет возвращена.`;
        color = 0x808080;
        title = '⚪ Ничья!';
        emoji = '⚪';
    } else if (coinResult === userChoice) {
        // Выигрыш
        winAmount = amountWithMultiplier;
        newBalance += winAmount;
        
        const sideName = coinResult === 'heads' ? 'орёл' : 'решка';
        resultMessage = `**🎉 ПОБЕДА!**\n`;
        resultMessage += `Выпал(а) **${sideName}** - вы угадали!\n`;
        resultMessage += `Вы выиграли **${winAmount.toLocaleString('ru-RU')}** монет!`;
        color = 0x00FF00;
        title = coinResult === 'heads' ? '🦅 Победа! (Орел)' : '🪙 Победа! (Решка)';
        emoji = coinResult === 'heads' ? '🦅' : '🪙';
    } else {
        // Проигрыш
        newBalance -= betAmount;
        
        const actualSide = coinResult === 'heads' ? 'орёл' : 'решка';
        const chosenSide = userChoice === 'heads' ? 'орёл' : 'решка';
        resultMessage = `**😔 ПРОИГРЫШ**\n`;
        resultMessage += `Вы выбрали **${chosenSide}**, а выпал(а) **${actualSide}**.\n`;
        resultMessage += `Вы проиграли **${betAmount.toLocaleString('ru-RU')}** монет.`;
        color = 0xFF0000;
        title = coinResult === 'heads' ? '🪙 Проигрыш (Выпал орел)' : '🦅 Проигрыш (Выпала решка)';
        emoji = coinResult === 'heads' ? '🦅' : '🪙';
    }
    
    // Обновление баланса в БД
    await Users.update(
        { balance: newBalance },
        { where: { user_id: interaction.user.id } }
    );
    
    // Создание embed с результатом
    const resultEmbed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(resultMessage)
        .addFields(
            { 
                name: '📊 Детали ставки', 
                value: `**Ставка:** ${betAmount.toLocaleString('ru-RU')} монет\n**Множитель:** x${MULTIPLIER}\n**Возможный выигрыш:** ${amountWithMultiplier.toLocaleString('ru-RU')} монет` 
            },
            { 
                name: '💰 Изменение баланса', 
                value: `**Было:** ${Number(userDb.balance).toLocaleString('ru-RU')} монет\n**Стало:** ${newBalance.toLocaleString('ru-RU')} монет\n**Изменение:** ${winAmount > 0 ? '+' : ''}${(winAmount > 0 ? winAmount : -betAmount).toLocaleString('ru-RU')} монет` 
            }
        )
        .setFooter({ 
            text: `Игрок: ${interaction.user.username}`, 
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
    
    // Добавление изображения результата
    if (emoji) {
        resultEmbed.setThumbnail(`https://emojicdn.elk.sh/${encodeURIComponent(emoji)}`);
    }
    
    // Одна кнопка для повторной игры
    const replayRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('replay_same')
                .setLabel('Играть еще раз')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄')
                .setDisabled(newBalance < betAmount) // Отключаем кнопку если недостаточно средств
        );
    
    await interaction.editReply({ 
        embeds: [resultEmbed], 
        components: [replayRow] 
    });
    
    // Обработка кнопки повторной игры
    const replayFilter = (i: any) => i.user.id === interaction.user.id;
    const replayCollector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: replayFilter,
        time: 30000 // 30 секунд
    });
    
    replayCollector.on('collect', async (i: any) => {
        await i.deferUpdate();
        
        if (i.customId === 'replay_same') {
            // Проверка баланса
            const updatedUserDb = await Users.findOne({ where: { user_id: interaction.user.id } });
            if (!updatedUserDb) return;
            
            const currentBalance = Number(updatedUserDb.balance);
            
            if (currentBalance < betAmount) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Недостаточно средств')
                    .setDescription(`У вас недостаточно средств для ставки **${betAmount.toLocaleString('ru-RU')}** монет.\nТекущий баланс: **${currentBalance.toLocaleString('ru-RU')}** монет`)
                    .setColor('Red')
                    .setTimestamp();
                
                await interaction.editReply({ 
                    embeds: [errorEmbed], 
                    components: [] 
                });
                replayCollector.stop();
                return;
            }
            
            // Убираем кнопку
            await interaction.editReply({ 
                components: [] 
            });
            
            // Анимация начала новой игры
            const newGameEmbed = new EmbedBuilder()
                .setTitle('🔄 Новая игра')
                .setDescription('Начинаем новую игру с той же ставкой...')
                .setColor('Blue')
                .setFooter({ 
                    text: `Подготовка к следующему броску`,
                    iconURL: interaction.user.displayAvatarURL() 
                });
            
            await interaction.editReply({ 
                embeds: [newGameEmbed] 
            });
            
            // Небольшая задержка
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Запускаем новую игру
            await flipCoin(interaction, updatedUserDb, betAmount, userChoice);
        }
        
        replayCollector.stop();
    });
    
    replayCollector.on('end', async (collected: any, reason: any) => {
        if (reason === 'time') {
            // Убираем кнопку после истечения времени
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('replay_same')
                        .setLabel('Время вышло')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('⏰')
                        .setDisabled(true)
                );
            
            try {
                await interaction.editReply({ 
                    components: [disabledRow] 
                });
            } catch (error) {
                // Игнорируем ошибки редактирования сообщения
            }
        }
    });
}

// Очистка старых кулдаунов
setInterval(() => {
    const currentTime = Date.now();
    for (const [userId, timestamp] of cooldowns.entries()) {
        if (currentTime > timestamp + COOLDOWN_TIME + 300000) {
            cooldowns.delete(userId);
        }
    }
}, 300000);
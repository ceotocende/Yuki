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

// Символы для слотов
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐', '7️⃣', '🔔'];
const JACKPOT_SYMBOL = '💰';

// Коэффициенты выигрыша
const WIN_MULTIPLIERS = {
    '💰': 20,  // Джекпот
    '7️⃣': 10,
    '⭐': 5,
    '🔔': 3,
    '🍒': 2,
    '🍋': 2,
    '🍊': 2,
    '🍉': 1.5,
    '🍇': 1.5
};

// Система кулдаунов
const cooldowns = new Map();
const COOLDOWN_TIME = 60000; // 1 минута кулдауна

// Хранение текущих игр для кнопок
const activeGames = new Map();

export default new client.command({
    structure: 
    new SlashCommandBuilder()
        .setName('слоты')
        .setDescription('Игра в слот-машину')
        .addIntegerOption(op =>
            op
                .setName('ставка')
                .setDescription('Сумма ставки (виртуальные деньги)')
                .setRequired(true)
                .setMinValue(1000)
                .setMaxValue(10000)
        ),

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
        
        // Устанавливаем кулдаун
        cooldowns.set(userId, currentTime);
        
        const betAmount = interaction.options.getInteger('ставка')!;
        
        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        if (!userDb) {
            interaction.reply({
                embeds: [embedErrFromUserDb],
                ephemeral: true
            });
            return await AddUserToDB(interaction.user);
        }
        
        const userBalance = userDb.balance;
        if (userBalance < betAmount) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setTitle('Ошибка')
                    .setDescription(`У вас недостаточно средств на балансе.\nНа данный момент у вас на балансе \`${userBalance}\``)
                    .setColor('Red')
                    .setTimestamp()
                    .setThumbnail(interaction.user.avatarURL())
                ],
                ephemeral: true
            });
        }
        
        // Отложим ответ, так как вычисления могут занять время
        await interaction.deferReply();
        
        // Запускаем игру
        await playSlots(interaction, userDb, betAmount);
    }
});

// Основная функция игры в слоты
async function playSlots(interaction: any, userDb: any, betAmount: number, isReplay: boolean = false) {
    if (!isReplay) {
        // Анимация кручения барабанов
        const loadingMessages = [
            "🎰 Запускаем барабаны...",
            "⚙️ Барабаны крутятся...",
            "🌀 Определяем результат..."
        ];
        
        // Показываем анимацию
        const loadingEmbed = new EmbedBuilder()
            .setTitle('🎰 Слот-Машина')
            .setDescription(loadingMessages[0])
            .setColor('Yellow')
            .setFooter({ 
                text: `Ставка: ${betAmount} монет`,
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
    } else {
        // Для повторной игры показываем сообщение о начале
        const replayEmbed = new EmbedBuilder()
            .setTitle('🔄 Новая игра в слоты')
            .setDescription(`Начинаем новую игру с той же ставкой...\n**Ставка:** ${betAmount} монет`)
            .setColor('Blue')
            .setFooter({ 
                text: `Подготовка барабанов`,
                iconURL: interaction.user.displayAvatarURL() 
            });
        
        await interaction.editReply({ 
            embeds: [replayEmbed] 
        });
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Анимация кручения
        const loadingMessages = ["🎰 Барабаны крутятся...", "🌀 Определяем результат..."];
        const loadingEmbed = new EmbedBuilder()
            .setTitle('🎰 Слот-Машина')
            .setDescription(loadingMessages[0])
            .setColor('Yellow');
        
        await interaction.editReply({ 
            embeds: [loadingEmbed] 
        });
        
        for (let i = 1; i < loadingMessages.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 800));
            loadingEmbed.setDescription(loadingMessages[i]);
            await interaction.editReply({ 
                embeds: [loadingEmbed] 
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Генерация результатов слотов (3x3 сетка)
    const slots = [];
    for (let i = 0; i < 3; i++) {
        const row = [];
        for (let j = 0; j < 3; j++) {
            // Небольшой шанс на джекпот-символ
            const symbol = Math.random() < 0.02 ? JACKPOT_SYMBOL :
                SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
            row.push(symbol);
        }
        slots.push(row);
    }

    // Проверка выигрышных комбинаций
    const { winAmount, winLines } = calculateWin(slots, betAmount);
    const hasWon = winAmount > 0;
    
    // Обновляем баланс пользователя
    const newBalance = Number(userDb.balance) + (hasWon ? winAmount : -betAmount);
    await Users.update(
        { balance: newBalance },
        { where: { user_id: interaction.user.id } }
    );

    // Обновляем данные пользователя для следующей игры
    userDb.balance = newBalance;

    // Создание красивого embed
    const embed = new EmbedBuilder()
        .setTitle('🎰 Слот-Машина 🎰')
        .setColor(hasWon ? 0x00FF00 : 0xFF0000)
        .setDescription(`**Ставка:** ${betAmount.toLocaleString('ru-RU')} монет`)
        .addFields(
            {
                name: 'Результат',
                value: formatSlots(slots, winLines)
            }
        )
        .setFooter({
            text: `Баланс: ${newBalance.toLocaleString('ru-RU')} монет`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

    // Добавляем информацию о выигрыше
    if (hasWon) {
        let winDescription = `Вы выиграли **${winAmount.toLocaleString('ru-RU')}** монет!`;
        
        // Показываем какие линии выиграли
        if (winLines.length > 0) {
            winDescription += `\n\n**Выигрышные линии:**`;
            winLines.forEach(line => {
                winDescription += `\n${line.lineType} линия (x${line.multiplier})`;
            });
        }
        
        embed.addFields({
            name: '🎉 Поздравляем! 🎉',
            value: winDescription,
            inline: false
        });
        
        // Специальное сообщение для джекпота
        if (winLines.some(line => line.multiplier === WIN_MULTIPLIERS[JACKPOT_SYMBOL])) {
            embed.addFields({
                name: '🏆 ДЖЕКПОТ! 🏆',
                value: 'Вы сорвали джекпот! 🎉',
                inline: false
            });
            embed.setColor(0xFFD700); // Золотой цвет для джекпота
        }
    } else {
        embed.addFields({
            name: '😢 Повезет в следующий раз!',
            value: `Вы проиграли **${betAmount.toLocaleString('ru-RU')}** монет.`,
            inline: false
        });
    }

    // Создаем кнопку для повторной игры
    const replayRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`slots_replay_${interaction.user.id}_${betAmount}`)
                .setLabel('Играть той же ставкой')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄')
                .setDisabled(newBalance < betAmount) // Отключаем кнопку если недостаточно средств
        );
    
    await interaction.editReply({ 
        embeds: [embed], 
        components: [replayRow] 
    });
    
    // Сохраняем данные игры для обработки кнопки
    activeGames.set(`slots_replay_${interaction.user.id}_${betAmount}`, {
        interaction,
        userDb: { ...userDb, balance: newBalance },
        betAmount
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
        
        if (i.customId.startsWith('slots_replay_')) {
            // Получаем данные игры
            const gameData = activeGames.get(i.customId);
            if (!gameData) {
                replayCollector.stop();
                return;
            }
            
            // Проверяем баланс пользователя (актуальный)
            const updatedUserDb = await Users.findOne({ where: { user_id: interaction.user.id } });
            if (!updatedUserDb) {
                replayCollector.stop();
                return;
            }
            
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
            
            // Устанавливаем кулдаун для повторной игры
            cooldowns.set(interaction.user.id, Date.now());
            
            // Запускаем новую игру
            await playSlots(interaction, updatedUserDb, betAmount, true);
        }
        
        replayCollector.stop();
    });
    
    replayCollector.on('end', async (collected: any, reason: any) => {
        if (reason === 'time') {
            // Убираем кнопку после истечения времени
            const disabledRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`slots_replay_${interaction.user.id}_${betAmount}`)
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
            
            // Удаляем игру из активных
            activeGames.delete(`slots_replay_${interaction.user.id}_${betAmount}`);
        }
    });
}

// Функция форматирования слотов в виде таблицы с подсветкой выигрышных линий
function formatSlots(slots: string[][], winLines: any[]): string {
    const lines = [];
    
    // Добавляем выигрышные линии в описании
    for (let i = 0; i < 3; i++) {
        const row = slots[i];
        let rowString = '| ';
        
        for (let j = 0; j < 3; j++) {
            // Проверяем, находится ли эта ячейка в выигрышной линии
            const isWinningCell = winLines.some(line => {
                if (line.lineType === 'Горизонтальная' && line.row === i) return true;
                if (line.lineType === 'Вертикальная' && line.col === j) return true;
                if (line.lineType === 'Диагональная') {
                    if (line.diag === 'main' && i === j) return true;
                    if (line.diag === 'anti' && i === 2 - j) return true;
                }
                return false;
            });
            
            rowString += isWinningCell ? `**${row[j]}**` : row[j];
            if (j < 2) rowString += ' | ';
        }
        
        rowString += ' |';
        lines.push(rowString);
    }
    
    return lines.join('\n');
}

// Функция расчета выигрыша
function calculateWin(slots: string[][], bet: number): { winAmount: number, winLines: any[] } {
    let totalMultiplier = 0;
    const winLines: any[] = [];

    // Проверка горизонтальных линий
    for (let i = 0; i < 3; i++) {
        const row = slots[i];
        if (row[0] === row[1] && row[1] === row[2]) {
            const symbol = row[0];
            const multiplier = WIN_MULTIPLIERS[symbol as keyof typeof WIN_MULTIPLIERS] || 0;
            
            if (multiplier > 0) {
                totalMultiplier += multiplier;
                winLines.push({
                    lineType: 'Горизонтальная',
                    row: i,
                    multiplier: multiplier,
                    symbol: symbol
                });
            }
        }
    }

    // Проверка вертикальных линий
    for (let j = 0; j < 3; j++) {
        if (slots[0][j] === slots[1][j] && slots[1][j] === slots[2][j]) {
            const symbol = slots[0][j];
            const multiplier = WIN_MULTIPLIERS[symbol as keyof typeof WIN_MULTIPLIERS] || 0;
            
            if (multiplier > 0) {
                totalMultiplier += multiplier;
                winLines.push({
                    lineType: 'Вертикальная',
                    col: j,
                    multiplier: multiplier,
                    symbol: symbol
                });
            }
        }
    }

    // Проверка главной диагонали
    if (slots[0][0] === slots[1][1] && slots[1][1] === slots[2][2]) {
        const symbol = slots[0][0];
        const multiplier = WIN_MULTIPLIERS[symbol as keyof typeof WIN_MULTIPLIERS] || 0;
        
        if (multiplier > 0) {
            totalMultiplier += multiplier;
            winLines.push({
                lineType: 'Диагональная',
                diag: 'main',
                multiplier: multiplier,
                symbol: symbol
            });
        }
    }

    // Проверка побочной диагонали
    if (slots[0][2] === slots[1][1] && slots[1][1] === slots[2][0]) {
        const symbol = slots[0][2];
        const multiplier = WIN_MULTIPLIERS[symbol as keyof typeof WIN_MULTIPLIERS] || 0;
        
        if (multiplier > 0) {
            totalMultiplier += multiplier;
            winLines.push({
                lineType: 'Диагональная',
                diag: 'anti',
                multiplier: multiplier,
                symbol: symbol
            });
        }
    }

    const winAmount = totalMultiplier > 0 ? Math.floor(bet * totalMultiplier) : 0;
    
    return { winAmount, winLines };
}

// Очистка старых кулдаунов и активных игр
setInterval(() => {
    const currentTime = Date.now();
    
    // Очистка кулдаунов
    for (const [userId, timestamp] of cooldowns.entries()) {
        if (currentTime > timestamp + COOLDOWN_TIME + 300000) {
            cooldowns.delete(userId);
        }
    }
    
    // Очистка старых активных игр (старше 5 минут)
    for (const [gameId, gameData] of activeGames.entries()) {
        if (currentTime > gameData.timestamp + 300000) {
            activeGames.delete(gameId);
        }
    }
}, 300000);
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
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
                .setMinValue(100)
                .setMaxValue(100000)
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

        // Создание красивого embed
        const embed = new EmbedBuilder()
            .setTitle('🎰 Слот-Машина 🎰')
            .setColor(hasWon ? 0x00FF00 : 0xFF0000)
            .setDescription(`**Ставка:** ${betAmount} монет`)
            .addFields(
                {
                    name: 'Результат',
                    value: formatSlots(slots, winLines)
                }
            )
            .setFooter({
                text: `Баланс: ${newBalance} монет | Кулдаун: ${COOLDOWN_TIME/1000} сек`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Добавляем информацию о выигрыше
        if (hasWon) {
            let winDescription = `Вы выиграли **${winAmount}** монет!`;
            
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
            }
        } else {
            embed.addFields({
                name: '😢 Повезет в следующий раз!',
                value: `Вы проиграли **${betAmount}** монет.`,
                inline: false
            });
        }

        // Добавляем анимацию (опционально)
        await interaction.editReply('🎰 Крутим барабаны...');

        // Небольшая задержка для реалистичности
        await new Promise(resolve => setTimeout(resolve, 1500));

        await interaction.editReply({
            content: '',
            embeds: [embed]
        });
    }
});

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

// Очистка старых кулдаунов каждые 5 минут (опционально)
setInterval(() => {
    const currentTime = Date.now();
    for (const [userId, timestamp] of cooldowns.entries()) {
        if (currentTime > timestamp + COOLDOWN_TIME + 300000) { // +5 минут после истечения
            cooldowns.delete(userId);
        }
    }
}, 300000); // Каждые 5 минут
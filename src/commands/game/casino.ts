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

// Символы для слотов (только для визуала)
const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍉', '🍇', '⭐', '7️⃣', '🔔', '💎', '🎰'];

// Настройки вероятностей и выплат
const GAME_CONFIG = {
    WIN_CHANCE: 0.20, // 20% шанс на выигрыш
    MIN_BET: 100,
    MAX_BET: 10000,
    COOLDOWN_TIME: 30000, // 30 секунд кулдауна
    REPLAY_TIME: 30000, // 30 секунд на повторную игру
    
    // Множители выигрыша (базовый множитель * ставка)
    WIN_MULTIPLIERS: {
        MIN: 1.2,  // Минимальный выигрыш (120% от ставки)
        MAX: 5.0   // Максимальный выигрыш (500% от ставки)
    },
    
    // Шанс на джекпот (0.5% от всех игр)
    JACKPOT_CHANCE: 0.005,
    JACKPOT_MULTIPLIER: 20 // Джекпот x20
};

// Система кулдаунов
const cooldowns = new Map();

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('слоты')
        .setDescription('🎰 Сыграть в слот-машину')
        .addIntegerOption(option =>
            option
                .setName('ставка')
                .setDescription('Сумма ставки')
                .setRequired(true)
                .setMinValue(GAME_CONFIG.MIN_BET)
                .setMaxValue(GAME_CONFIG.MAX_BET)
        )
        .setDMPermission(false),
    
    run: async (client, interaction) => {
        // Проверка кулдауна
        const userId = interaction.user.id;
        const currentTime = Date.now();
        
        if (cooldowns.has(userId)) {
            const expirationTime = cooldowns.get(userId) + GAME_CONFIG.COOLDOWN_TIME;
            
            if (currentTime < expirationTime) {
                const timeLeft = ((expirationTime - currentTime) / 1000).toFixed(1);
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⏳ Кулдаун')
                            .setDescription(`Подождите **${timeLeft}** секунд перед новой игрой!`)
                            .setColor('Orange')
                    ],
                    ephemeral: true
                });
            }
        }
        
        // Устанавливаем кулдаун
        cooldowns.set(userId, currentTime);
        
        const betAmount = interaction.options.getInteger('ставка')!;
        
        // Проверка баланса
        const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
        if (!userDb) {
            await interaction.reply({
                embeds: [embedErrFromUserDb],
                ephemeral: true
            });
            return await AddUserToDB(interaction.user);
        }
        
        if (userDb.balance < betAmount) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Недостаточно средств')
                        .setDescription(`Ваш баланс: **${userDb.balance.toLocaleString('ru-RU')}** монет\nНеобходимо: **${betAmount.toLocaleString('ru-RU')}** монет`)
                        .setColor('Red')
                ],
                ephemeral: true
            });
        }
        
        // Отложенный ответ для анимации
        await interaction.deferReply();
        
        // Запускаем игру
        await playSlots(interaction, userDb, betAmount);
        
        // Очищаем кулдаун через указанное время
        setTimeout(() => {
            cooldowns.delete(userId);
        }, GAME_CONFIG.COOLDOWN_TIME);
    }
});

async function playSlots(interaction: any, userDb: any, betAmount: number) {
    // Анимация кручения
    await showSpinAnimation(interaction, betAmount);
    
    // Определяем результат игры
    const gameResult = determineGameResult(betAmount);
    
    // Генерируем визуальное отображение слотов
    const slots = generateSlotDisplay(gameResult.isWin, gameResult.isJackpot);
    
    // Обновляем баланс
    const oldBalance = Number(userDb.balance);
    const newBalance = gameResult.isWin 
        ? oldBalance + gameResult.winAmount 
        : oldBalance - betAmount;
    
    await Users.update(
        { balance: newBalance },
        { where: { user_id: interaction.user.id } }
    );
    
    // Создаём embed с результатом
    const embed = createResultEmbed(
        interaction,
        slots,
        gameResult,
        betAmount,
        oldBalance,
        newBalance
    );
    
    // Создаём кнопку для повторной игры
    const replayButton = createReplayButton(interaction.user.id, betAmount, newBalance >= betAmount);
    
    // Отправляем результат
    await interaction.editReply({
        embeds: [embed],
        components: replayButton ? [replayButton] : []
    });
    
    // Если есть кнопка, настраиваем обработчик
    if (replayButton) {
        setupReplayHandler(interaction, userDb, betAmount, newBalance);
    }
}

async function showSpinAnimation(interaction: any, betAmount: number) {
    const messages = [
        "🎰 Запускаем барабаны...",
        "⚙️ Барабаны крутятся...",
        "✨ Комбинации собираются...",
        "🎯 Определяем результат..."
    ];
    
    for (const message of messages) {
        const embed = new EmbedBuilder()
            .setTitle('🎰 Слот-Машина')
            .setDescription(message)
            .setColor('Yellow')
            .setFooter({ 
                text: `Ставка: ${betAmount.toLocaleString('ru-RU')} монет`,
                iconURL: interaction.user.displayAvatarURL() 
            });
        
        await interaction.editReply({ embeds: [embed] });
        await new Promise(resolve => setTimeout(resolve, 600));
    }
}

function determineGameResult(betAmount: number) {
    // Проверяем джекпот
    const isJackpot = Math.random() < GAME_CONFIG.JACKPOT_CHANCE;
    
    if (isJackpot) {
        const winAmount = Math.floor(betAmount * GAME_CONFIG.JACKPOT_MULTIPLIER);
        return {
            isWin: true,
            isJackpot: true,
            winAmount,
            multiplier: GAME_CONFIG.JACKPOT_MULTIPLIER
        };
    }
    
    // Проверяем обычный выигрыш (20% шанс)
    const isWin = Math.random() < GAME_CONFIG.WIN_CHANCE;
    
    if (isWin) {
        // Генерируем случайный множитель от MIN до MAX
        const multiplier = GAME_CONFIG.WIN_MULTIPLIERS.MIN + 
            Math.random() * (GAME_CONFIG.WIN_MULTIPLIERS.MAX - GAME_CONFIG.WIN_MULTIPLIERS.MIN);
        
        // Округляем до 2 знаков после запятой
        const roundedMultiplier = Math.round(multiplier * 100) / 100;
        const winAmount = Math.floor(betAmount * roundedMultiplier);
        
        return {
            isWin: true,
            isJackpot: false,
            winAmount,
            multiplier: roundedMultiplier
        };
    }
    
    // Проигрыш
    return {
        isWin: false,
        isJackpot: false,
        winAmount: 0,
        multiplier: 0
    };
}

function generateSlotDisplay(isWin: boolean, isJackpot: boolean): string[][] {
    const slots: string[][] = [[], [], []];
    
    if (isJackpot) {
        // Для джекпота показываем все 💰
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                slots[i][j] = '💰';
            }
        }
    } else if (isWin) {
        // Для выигрыша создаём видимость одной выигрышной линии
        const winLineType = Math.floor(Math.random() * 3); // 0-горизонт, 1-вертик, 2-диагональ
        const winSymbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        
        // Заполняем случайными символами
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                slots[i][j] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
            }
        }
        
        // Создаём выигрышную линию
        if (winLineType === 0) { // Горизонтальная
            const row = Math.floor(Math.random() * 3);
            for (let j = 0; j < 3; j++) {
                slots[row][j] = winSymbol;
            }
        } else if (winLineType === 1) { // Вертикальная
            const col = Math.floor(Math.random() * 3);
            for (let i = 0; i < 3; i++) {
                slots[i][col] = winSymbol;
            }
        } else { // Диагональ
            if (Math.random() < 0.5) {
                // Главная диагональ
                for (let i = 0; i < 3; i++) {
                    slots[i][i] = winSymbol;
                }
            } else {
                // Побочная диагональ
                for (let i = 0; i < 3; i++) {
                    slots[i][2 - i] = winSymbol;
                }
            }
        }
    } else {
        // Для проигрыша - все символы разные
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                // Гарантируем, что в каждой линии символы разные
                let symbol;
                do {
                    symbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
                } while (
                    (j > 0 && symbol === slots[i][j-1]) || // Проверка по горизонтали
                    (i > 0 && symbol === slots[i-1][j])    // Проверка по вертикали
                );
                slots[i][j] = symbol;
            }
        }
    }
    
    return slots;
}

function createResultEmbed(
    interaction: any,
    slots: string[][],
    gameResult: any,
    betAmount: number,
    oldBalance: number,
    newBalance: number
): EmbedBuilder {
    // Форматируем слоты для отображения
    const slotsDisplay = slots.map(row => 
        row.map(symbol => symbol).join(' | ')
    ).join('\n─────────────\n');
    
    // Определяем цвет и заголовок
    let color: number;
    let title = '🎰 Слот-Машина';
    let resultText = '';
    
    if (gameResult.isJackpot) {
        color = 0xFFD700; // Золотой
        title = '🏆 ДЖЕКПОТ! 🏆';
        resultText = `🎉 **ДЖЕКПОТ x${gameResult.multifier}!**\nВы выиграли **${gameResult.winAmount.toLocaleString('ru-RU')}** монет!`;
    } else if (gameResult.isWin) {
        color = 0x00FF00; // Зелёный
        resultText = `✅ **Выигрыш x${gameResult.multiplier}!**\nВы получили **${gameResult.winAmount.toLocaleString('ru-RU')}** монет!`;
    } else {
        color = 0xFF0000; // Красный
        resultText = `❌ **Проигрыш**\nВы потеряли **${betAmount.toLocaleString('ru-RU')}** монет.`;
    }
    
    const embed = new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .setDescription(`\`\`\`\n${slotsDisplay}\n\`\`\``)
        .addFields(
            {
                name: '📊 Ставка',
                value: `\`${betAmount.toLocaleString('ru-RU')}\` монет`,
                inline: true
            },
            {
                name: gameResult.isWin ? '🎁 Выигрыш' : '💸 Потеря',
                value: gameResult.isWin 
                    ? `\`+${gameResult.winAmount.toLocaleString('ru-RU')}\` монет`
                    : `\`-${betAmount.toLocaleString('ru-RU')}\` монет`,
                inline: true
            },
            {
                name: '💳 Баланс',
                value: `\`${oldBalance.toLocaleString('ru-RU')}\` → \`${newBalance.toLocaleString('ru-RU')}\` монет`,
                inline: false
            }
        )
        .setFooter({ 
            text: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
    
    // Добавляем описание результата
    if (gameResult.isWin) {
        embed.addFields({
            name: '✨ Результат',
            value: resultText,
            inline: false
        });
    }
    
    return embed;
}

function createReplayButton(userId: string, betAmount: number, enabled: boolean): ActionRowBuilder<ButtonBuilder> | null {
    if (!enabled) return null;
    
    return new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`replay_${userId}_${betAmount}`)
                .setLabel('🎰 Играть ещё')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄')
        );
}

function setupReplayHandler(interaction: any, userDb: any, betAmount: number, currentBalance: number) {
    const filter = (i: any) => 
        i.customId === `replay_${interaction.user.id}_${betAmount}` && 
        i.user.id === interaction.user.id;
    
    const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: GAME_CONFIG.REPLAY_TIME,
        componentType: ComponentType.Button
    });
    
    collector.on('collect', async (i: any) => {
        await i.deferUpdate();
        
        // Получаем актуальный баланс
        const updatedUser = await Users.findOne({ where: { user_id: interaction.user.id } });
        
        if (!updatedUser || updatedUser.balance < betAmount) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('❌ Недостаточно средств')
                .setDescription(`Для повторной игры нужно **${betAmount.toLocaleString('ru-RU')}** монет`)
                .setColor('Red');
            
            await interaction.editReply({
                embeds: [errorEmbed],
                components: []
            });
            return;
        }
        
        // Убираем кнопку
        await interaction.editReply({ components: [] });
        
        // Запускаем новую игру
        await playSlots(interaction, updatedUser, betAmount);
        collector.stop();
    });
    
    collector.on('end', async () => {
        try {
            await interaction.editReply({ components: [] });
        } catch (error) {
            // Игнорируем ошибки
        }
    });
}
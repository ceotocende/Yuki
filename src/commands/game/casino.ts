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
    MAX_BET: 100000,
    COOLDOWN_TIME: 30000, // 30 секунд кулдауна
    
    // Множители выигрыша
    WIN_MULTIPLIERS: {
        MIN: 1.2,
        MAX: 5.0
    },
    
    JACKPOT_CHANCE: 0.005,
    JACKPOT_MULTIPLIER: 20
};

// Хранилище для активных игр и кулдаунов
const cooldowns = new Map();
const activeGames = new Map(); // Сохраняем данные игры для кнопок

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
        const userId = interaction.user.id;
        const currentTime = Date.now();
        
        // Проверка кулдауна
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
        
        // Отложенный ответ
        await interaction.deferReply();
        
        // Запускаем игру
        await playSlots(interaction, userDb, betAmount);
    }
});

async function playSlots(interaction: any, userDb: any, betAmount: number) {
    // Устанавливаем кулдаун
    cooldowns.set(interaction.user.id, Date.now());
    
    // Анимация
    await showSpinAnimation(interaction, betAmount);
    
    // Определяем результат
    const gameResult = determineGameResult(betAmount);
    
    // Генерируем визуал
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
    
    // Получаем актуальные данные пользователя
    const updatedUserDb = await Users.findOne({ where: { user_id: interaction.user.id } });
    
    // Создаём embed
    const embed = createResultEmbed(
        interaction,
        slots,
        gameResult,
        betAmount,
        oldBalance,
        newBalance
    );
    
    // Генерируем уникальный ID для кнопки
    const buttonId = `replay_${interaction.user.id}_${Date.now()}`;
    
    // Сохраняем данные игры для кнопки
    activeGames.set(buttonId, {
        userId: interaction.user.id,
        channelId: interaction.channelId,
        messageId: null, // Будет заполнено после отправки
        betAmount,
        userDb: updatedUserDb
    });
    
    // Создаём кнопку
    const replayButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(buttonId)
                .setLabel('🎰 Играть ещё')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🔄')
                .setDisabled(newBalance < betAmount)
        );
    
    // Отправляем результат
    const message = await interaction.editReply({
        embeds: [embed],
        components: [replayButton]
    });
    
    // Обновляем messageId в хранилище
    const gameData = activeGames.get(buttonId);
    if (gameData) {
        gameData.messageId = message.id;
        activeGames.set(buttonId, gameData);
    }
    
    // Создаём коллектор для этой конкретной кнопки
    createButtonCollector(interaction.client, buttonId);
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
    
    const isWin = Math.random() < GAME_CONFIG.WIN_CHANCE;
    
    if (isWin) {
        const multiplier = GAME_CONFIG.WIN_MULTIPLIERS.MIN + 
            Math.random() * (GAME_CONFIG.WIN_MULTIPLIERS.MAX - GAME_CONFIG.WIN_MULTIPLIERS.MIN);
        
        const roundedMultiplier = Math.round(multiplier * 100) / 100;
        const winAmount = Math.floor(betAmount * roundedMultiplier);
        
        return {
            isWin: true,
            isJackpot: false,
            winAmount,
            multiplier: roundedMultiplier
        };
    }
    
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
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                slots[i][j] = '💰';
            }
        }
    } else if (isWin) {
        const winLineType = Math.floor(Math.random() * 3);
        const winSymbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                slots[i][j] = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
            }
        }
        
        if (winLineType === 0) {
            const row = Math.floor(Math.random() * 3);
            for (let j = 0; j < 3; j++) {
                slots[row][j] = winSymbol;
            }
        } else if (winLineType === 1) {
            const col = Math.floor(Math.random() * 3);
            for (let i = 0; i < 3; i++) {
                slots[i][col] = winSymbol;
            }
        } else {
            if (Math.random() < 0.5) {
                for (let i = 0; i < 3; i++) {
                    slots[i][i] = winSymbol;
                }
            } else {
                for (let i = 0; i < 3; i++) {
                    slots[i][2 - i] = winSymbol;
                }
            }
        }
    } else {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                let symbol;
                do {
                    symbol = SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)];
                } while (
                    (j > 0 && symbol === slots[i][j-1]) ||
                    (i > 0 && symbol === slots[i-1][j])
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
    const slotsDisplay = slots.map(row => 
        row.map(symbol => symbol).join(' | ')
    ).join('\n─────────────\n');
    
    let color: number;
    let title = '🎰 Слот-Машина';
    let resultText = '';
    
    if (gameResult.isJackpot) {
        color = 0xFFD700;
        title = '🏆 ДЖЕКПОТ! 🏆';
        resultText = `🎉 **ДЖЕКПОТ x${gameResult.multiplier}!**\nВы выиграли **${gameResult.winAmount.toLocaleString('ru-RU')}** монет!`;
    } else if (gameResult.isWin) {
        color = 0x00FF00;
        resultText = `✅ **Выигрыш x${gameResult.multiplier}!**\nВы получили **${gameResult.winAmount.toLocaleString('ru-RU')}** монет!`;
    } else {
        color = 0xFF0000;
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
            text: `${interaction.user.username} • Кнопка активна 30с`,
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();
    
    if (gameResult.isWin) {
        embed.addFields({
            name: '✨ Результат',
            value: resultText,
            inline: false
        });
    }
    
    return embed;
}

function createButtonCollector(client: any, buttonId: string) {
    // Создаём коллектор для кнопок
    const collector = client.on('interactionCreate', async (interaction: any) => {
        if (!interaction.isButton()) return;
        if (interaction.customId !== buttonId) return;
        
        const gameData = activeGames.get(buttonId);
        if (!gameData) {
            return interaction.reply({
                content: '❌ Игра устарела или уже завершена. Создайте новую игру!',
                ephemeral: true
            });
        }
        
        // Проверяем, что кнопку нажал тот же пользователь
        if (interaction.user.id !== gameData.userId) {
            return interaction.reply({
                content: '❌ Это не ваша игра!',
                ephemeral: true
            });
        }
        
        await interaction.deferUpdate();
        
        try {
            // Получаем актуальные данные пользователя
            const userDb = await Users.findOne({ where: { user_id: interaction.user.id } });
            
            if (!userDb || userDb.balance < gameData.betAmount) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('❌ Недостаточно средств')
                    .setDescription(`Для повторной игры нужно **${gameData.betAmount.toLocaleString('ru-RU')}** монет`)
                    .setColor('Red');
                
                await interaction.editReply({
                    embeds: [errorEmbed],
                    components: []
                });
                
                // Удаляем игру из хранилища
                activeGames.delete(buttonId);
                return;
            }
            
            // Удаляем старую кнопку
            await interaction.editReply({ components: [] });
            
            // Удаляем старую игру из хранилища
            activeGames.delete(buttonId);
            
            // Запускаем новую игру
            await playSlots(interaction, userDb, gameData.betAmount);
            
        } catch (error) {
            console.error('Ошибка при повторной игре:', error);
            activeGames.delete(buttonId);
        }
    });
    
    // Автоматически удаляем игру из хранилища через 30 секунд
    setTimeout(() => {
        const gameData = activeGames.get(buttonId);
        if (gameData) {
            // Пытаемся отключить кнопку
            const channel = client.channels.cache.get(gameData.channelId);
            if (channel) {
                channel.messages.fetch(gameData.messageId).then((message: any) => {
                    const disabledButton = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId(buttonId)
                                .setLabel('🔄 Время вышло')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    
                    message.edit({ components: [disabledButton] }).catch(() => {});
                }).catch(() => {});
            }
            
            activeGames.delete(buttonId);
        }
    }, 30000);
}

// Очистка старых кулдаунов
setInterval(() => {
    const currentTime = Date.now();
    
    for (const [userId, timestamp] of cooldowns.entries()) {
        if (currentTime > timestamp + GAME_CONFIG.COOLDOWN_TIME + 60000) {
            cooldowns.delete(userId);
        }
    }
}, 60000);
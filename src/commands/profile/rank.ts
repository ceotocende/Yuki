import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Canvas, createCanvas, loadImage } from "canvas";
import path from "node:path";
import { Users } from "../../database/Models/MainModels/UsersModels";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import formatTimeForProfile from "../../utils/formatTimeForProfile";
import { RateDB as RateDB } from "../../database/Models/MainModels/RateModel";
import { RecordsDB } from "../../database/Models/MainModels/RecordsModel";

const applyText = (canvas: Canvas, text: string, rank: string) => {
    const context = canvas.getContext('2d');
    let fontSize = 60;

    do {
        context.font = `bold ${fontSize -= 6}px VAG World`;
    } while (context.measureText(`${text + ': Уровень ' + rank}`).width > canvas.width - 520);

    return context.font;
};

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('ранг')
        .setDescription('Отображение ранга')
        .addUserOption(op => op
            .setName('юзер')
            .setDescription('Выбрать пользователя')
        ),
    run: async (client, interaction) => {
        await interaction.deferReply();
        // 1. Получаем пользователя
        const user = interaction.options.getUser('юзер') || interaction.user;

        const UserDb = await Users.findOne({ where: { user_id: user.id } });
        const RateDb = await RateDB.findOne({ where: { user_id: user.id } });
        const RecordsDb = await RecordsDB.findOne({ where: { user_id: user.id } });

        if (!UserDb) {
            await AddUserToDB(user);
            await interaction.editReply('Произошла ошибка при создании изображения. Вас нет в базе данных');
        } else {
            try {
                // 2. Определяем пути
                const imagePath = path.join(__dirname, '../../../image/1-sk.png'); // Ваша картинка 900x200

                // Данные опыта
                const currentExp = UserDb.exp;
                const maxExp = UserDb.need_exp;
                const progress = currentExp / maxExp;

                const canvas = createCanvas(900, 200);
                const ctx = canvas.getContext('2d');

                // Фон
                const background = await loadImage(imagePath);
                ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

                // Аватар пользователя
                const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256 });
                const avatar = await loadImage(avatarUrl);

                const avatarX = 100;
                const avatarY = canvas.height / 2;
                const avatarRadius = 80;

                // Обрезаем аватар в круг
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
                ctx.restore();

                // Обводка аватара
                ctx.beginPath();
                ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#FFFFFF';
                ctx.stroke();

                const maxUsernameWidth = 400; // Максимальная ширина для ника

                const usernameFit = scaleTextToFit(
                    ctx,
                    user.displayName,
                    maxUsernameWidth,
                    48,  // Начальный размер
                    14,  // Минимальный размер (можно поставить 12 если очень длинные ники)
                    'Microsoft YaHei'
                );

                // Рисуем никнейм с подобранным размером шрифта
                ctx.font = usernameFit.fontStyle;
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'left';
                ctx.fillText(user.displayName, 200, 90);

                // ############### ИСПРАВЛЕННАЯ ПОЛОСКА ОПЫТА С ЗАКРУГЛЕННЫМИ КРАЯМИ ###############

                // Параметры полоски
                const barWidth = 675;
                const barHeight = 40;
                const barRadius = barHeight / 2; // Полная закругленность
                const barX = ((canvas.width - (barWidth - 180)) / 2) + 0.1;
                const barY = canvas.height - 60;

                // 1. Фон полоски (полупрозрачный закругленный прямоугольник)
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                drawRoundedRect(ctx, barX, barY, barWidth, barHeight, barRadius, true, false);

                // 2. Заполнение опыта (белый закругленный прямоугольник)
                const fillWidth = barWidth * progress; // Текущая ширина заполнения
                const minFillWidth = barRadius * 2; // Минимальная ширина для левых закруглений

                // Рисуем заполнение с закругленными краями
                ctx.fillStyle = '#FFFFFF';

                if (progress >= 1) {
                    // Полностью заполненная полоска
                    drawRoundedRect(ctx, barX, barY, barWidth, barHeight, barRadius, true, false);
                } else if (fillWidth >= minFillWidth) {
                    // Достаточно широкое заполнение для левых закруглений
                    drawPartiallyRoundedRect(ctx, barX, barY, fillWidth, barHeight, barRadius, true);
                } else if (fillWidth > 0) {
                    // Маленький прогресс, но больше 0
                    // Рисуем закругленный прямоугольник с минимальной шириной для закруглений
                    const actualWidth = Math.max(barRadius, fillWidth);
                    drawPartiallyRoundedRect(ctx, barX, barY, actualWidth, barHeight, barRadius, true);
                }
                // Если progress = 0, ничего не рисуем

                // 3. Обводка полоски (закругленный прямоугольник)
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                drawRoundedRect(ctx, barX, barY, barWidth, barHeight, barRadius, false, true);

                // 4. Текст прогресса
                const progressText = `${currentExp} / ${maxExp} (${Math.round(progress * 100)}%)`;
                ctx.font = 'bold 20px Microsoft YaHei';

                // Положение текста
                const textX = barX + 1;
                const textY = 130;

                // Рисуем текст
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'start';
                ctx.fillText(`${progressText} exp`, textX, textY, 200);

                // Ранг 
                ctx.font = 'bold 20px Microsoft YaHei';

                // Положение текста
                const textRankX = 870;
                const textRankY = 130;

                // Рисуем текст
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(`Уровень: ${UserDb.lvl}`, textRankX, textRankY, 200);

                // Положение текста
                const textBalX = 870;
                const textBalY = 100;

                // Рисуем текст
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'right';
                ctx.fillText(`Баланс: ${UserDb.balance}`, textBalX, textBalY, 200);

                if (RecordsDb) {
                    if (RecordsDb.message_count !== 0) {
                        // Положение текста
                        const textMessageX = 870;
                        const textMessageY = 70;

                        // Рисуем текст
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'right';
                        ctx.fillText(`Сообщений: ${RecordsDb.message_count}`, textMessageX, textMessageY, 200);
                    }
                }


                if (RateDb) {
                    if (RateDb.voice !== '0') {
                        // Положение текста
                        const textVoiceX = 870;
                        const textVoiceY = 40;

                        // Рисуем текст
                        ctx.fillStyle = '#ffffff';
                        ctx.textAlign = 'right';
                        ctx.fillText(`${formatTimeForProfile(Number(RateDb.voice))}`, textVoiceX, textVoiceY, 200);
                    }
                }

                // Отправка результата
                const buffer = canvas.toBuffer('image/png');
                const attachment = new AttachmentBuilder(buffer, { name: 'rank-card.png' });

                await interaction.editReply({ files: [attachment] });

            } catch (error) {
                console.error('Ошибка при создании изображения:', error);
                await interaction.editReply('Произошла ошибка при создании изображения.');
            }
        }
    }
});

function scaleTextToFit(ctx: any, text: string, maxWidth: number, initialSize = 48, minSize = 12, fontFamily = 'Microsoft YaHei') {
    let fontSize = initialSize;

    // Постепенно уменьшаем размер шрифта, пока текст не поместится
    while (fontSize > minSize) {
        ctx.font = `${fontSize}px "${fontFamily}"`;
        const textWidth = ctx.measureText(text).width;

        if (textWidth <= maxWidth) {
            // Текст помещается на текущем размере шрифта
            break;
        }

        // Уменьшаем размер шрифта на 1px для следующей проверки
        fontSize -= 1;
    }

    // Если даже при минимальном размере не помещается - используем минимальный
    if (fontSize <= minSize) {
        ctx.font = `${minSize}px "${fontFamily}"`;
    }

    return {
        fontSize: fontSize,
        fontStyle: `${fontSize}px "${fontFamily}"`,
        fitsPerfectly: fontSize >= initialSize
    };
}

// ############### ФУНКЦИЯ ДЛЯ ЧАСТИЧНО ЗАПОЛНЕННОГО ЗАКРУГЛЕННОГО ПРЯМОУГОЛЬНИКА ###############
function drawPartiallyRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number, fill: boolean) {
    ctx.beginPath();

    // Верхняя линия
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width, y);

    // Правая сторона (прямая, без закругления)
    ctx.lineTo(x + width, y + height);

    // Нижняя линия (справа налево)
    ctx.lineTo(x + radius, y + height);

    // Нижнее левое закругление
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);

    // Левая сторона
    ctx.lineTo(x, y + radius);

    // Верхнее левое закругление
    ctx.quadraticCurveTo(x, y, x + radius, y);

    ctx.closePath();

    if (fill) {
        ctx.fill();
    }
}

// ############### ФУНКЦИЯ ЗАКРУГЛЕННОГО ПРЯМОУГОЛЬНИКА (ДЛЯ ФОНА И ОБВОДКИ) ###############
function drawRoundedRect(ctx: any, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke: boolean) {
    // Создаем путь с закругленными углами
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    // Заливка
    if (fill) {
        ctx.fill();
    }

    // Обводка
    if (stroke) {
        ctx.stroke();
    }
}
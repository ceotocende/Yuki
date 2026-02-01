import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import { Command } from "../../types";
import { readdirSync } from "fs";
import { join, resolve } from "path";
import { compileProject } from "../../functions/builder";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('reload_command_and_events')
        .setDescription('НЕ ТРОГАТЬ НИКОМУ, все равно не получится')
        .setDefaultMemberPermissions(8),
    run: async (client, interaction) => {
        if (interaction.user.id !== '515575447124181007') {
            return interaction.reply('Ну ты дурак? Написано не трогать же..');
        }

        await interaction.deferReply();

        try {
            // 1. Перекомпилируем TypeScript
            console.log('🔄 Компиляция TypeScript...');
            compileProject();
            console.log('✅ Компиляция завершена');

            // 2. Очищаем старые команды
            client.commands.clear();
            client.commandsArray = [];
            console.log('🗑️ Старые команды очищены');

            // 3. Перезагружаем модули у текущего клиента
            console.log('📦 Загрузка модулей...');
            const loadedCommands = await loadModules(client);

            // 4. Обновляем команды на сервере Discord
            console.log('🚀 Делаю деплой команд...');
            const deployResult = await deployCommands(client);

            // 5. Обновляем обработчики событий
            console.log('🔄 Перезагрузка событий...');
            const loadedEvents = await reloadEvents(client);

            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('✅ Перезагрузка завершена успешно!')
                        .setDescription(deployResult)
                        .setColor(0x00FF00)
                        .addFields(
                            { name: 'Загружено команд', value: `${loadedCommands}`, inline: true },
                            { name: 'Загружено событий', value: `${loadedEvents}`, inline: true },
                            { name: 'Статус', value: '✅ Готово', inline: true }
                        )
                        .setFooter({ text: 'Бот работает без перезапуска' })
                        .setTimestamp()
                ]
            });

            console.log('✅ Перезагрузка завершена через команду');

        } catch (error) {
            console.error('❌ Ошибка при перезагрузке:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Ошибка при перезагрузке')
                        .setDescription(`\`\`\`${error instanceof Error ? error.message : String(error)}\`\`\``)
                        .setColor(0xFF0000)
                ]
            });
        }
    }
});

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

/**
 * Получает абсолютный путь к корню проекта
 */
function getProjectRoot(): string {
    // Правильный путь: из dist/commands/admin/ на три уровня вверх
    return resolve(__dirname, '../../..');
}

/**
 * Загружает модули команд
 */
async function loadModules(client: any): Promise<number> {
    const projectRoot = getProjectRoot();
    const commandsDir = join(projectRoot, 'dist', 'commands');
    let loadedCount = 0;

    console.log(`📁 Ищу команды в: ${commandsDir}`);

    // Очищаем кэш require для загрузки обновлённых файлов
    Object.keys(require.cache).forEach(key => {
        if (key.includes('dist/commands') || key.includes('dist/events/')) {
            delete require.cache[key];
            console.log(`🧹 Очищен кэш: ${key}`);
        }
    });

    // Загружаем команды
    for (const dir of readdirSync(commandsDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) continue;

        const categoryDir = join(commandsDir, dir.name);
        console.log(`📂 Категория: ${dir.name}`);

        for (const file of readdirSync(categoryDir).filter(f => f.endsWith('.js'))) {
            try {
                // Абсолютный путь к файлу
                const absolutePath = join(categoryDir, file);
                const modulePath = absolutePath.replace(/\\/g, '/');
                
                console.log(`  📄 Загружаю: ${file} (${modulePath})`);
                
                // Проверяем существование файла
                if (!require('fs').existsSync(absolutePath)) {
                    console.error(`  ❌ Файл не существует: ${absolutePath}`);
                    continue;
                }

                // Удаляем из кэша перед загрузкой
                delete require.cache[require.resolve(absolutePath)];
                
                // Загружаем модуль
                const module: Command = require(absolutePath).default;
                
                if (!module || !module.structure || !module.run) {
                    console.error(`  ❌ Некорректный модуль: ${file}`);
                    continue;
                }

                // Добавляем команду
                client.commands.set(module.structure.name, module);
                client.commandsArray.push(module.structure);

                loadedCount++;
                console.log(`  ✅ Загружена: ${module.structure.name}`);
            } catch (error) {
                console.error(`  ❌ Ошибка загрузки ${file}:`, error instanceof Error ? error.message : error);
            }
        }
    }

    console.log(`✅ Всего загружено команд: ${loadedCount}`);
    return loadedCount;
}

/**
 * Деплоит команды на сервер Discord
 */
async function deployCommands(client: any): Promise<string> {
    const { REST, Routes } = require('discord.js');
    
    if (!process.env.CLIENT_TOKEN) {
        throw new Error('CLIENT_TOKEN не найден в .env');
    }
    
    if (!process.env.CLIENT_ID) {
        throw new Error('CLIENT_ID не найден в .env');
    }

    const rest = new REST().setToken(process.env.CLIENT_TOKEN);

    try {
        console.log(`🔄 Начинаю обновление ${client.commandsArray.length} команд...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: client.commandsArray }
        );

        const result = `✅ Успешно обновлено ${Array.isArray(data) ? data.length : client.commandsArray.length} команд`;
        console.log(result);
        return result;
    } catch (error) {
        console.error('❌ Ошибка при обновлении команд:', error);
        throw error;
    }
}

/**
 * Перезагружает события
 */
async function reloadEvents(client: any): Promise<number> {
    const projectRoot = getProjectRoot();
    const eventsDir = join(projectRoot, 'dist', 'events');
    let loadedCount = 0;

    console.log(`📁 Ищу события в: ${eventsDir}`);

    // Удаляем все старые слушатели
    client.removeAllListeners();
    console.log('🧹 Удалены старые слушатели');

    // Очищаем кэш событий
    Object.keys(require.cache).forEach(key => {
        if (key.includes('dist/events/')) {
            delete require.cache[key];
        }
    });

    // Перезагружаем события
    for (const dir of readdirSync(eventsDir, { withFileTypes: true })) {
        if (!dir.isDirectory()) continue;

        const categoryDir = join(eventsDir, dir.name);
        console.log(`📂 Категория событий: ${dir.name}`);

        for (const file of readdirSync(categoryDir).filter(f => f.endsWith('.js'))) {
            try {
                const absolutePath = join(categoryDir, file);
                
                // Проверяем существование файла
                if (!require('fs').existsSync(absolutePath)) {
                    console.error(`  ❌ Файл события не существует: ${absolutePath}`);
                    continue;
                }

                delete require.cache[require.resolve(absolutePath)];
                
                // Загружаем и выполняем файл события
                require(absolutePath);
                
                loadedCount++;
                console.log(`  ✅ Загружено событие: ${file}`);
            } catch (error) {
                console.error(`  ❌ Ошибка загрузки события ${file}:`, error instanceof Error ? error.message : error);
            }
        }
    }

    console.log(`✅ Загружено событий: ${loadedCount}`);
    return loadedCount;
}
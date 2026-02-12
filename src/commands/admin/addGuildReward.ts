import { SlashCommandBuilder } from "discord.js";
import { client } from "../..";
import AddUserToDB from "../../database/Functions/AddUsersToDB";
import { Rewards } from "../../database/Models/MainModels/Rewards";

export default new client.command({
    structure: new SlashCommandBuilder()
        .setName('rewards_add')
        .setDescription('Не трогать')
        .addStringOption(op => op
            .setName('str')
            .setDescription('str')
            .setRequired(true)
        )
        .addNumberOption(op => op
            .setName('num')
            .setDescription('num')
            .setRequired(true)
        )
        .setDefaultMemberPermissions(8),
    run: async (client, interaction) => {
        const targetStr = interaction.options.getString('str')!;
        const targetNum = interaction.options.getNumber('num')!;
        const rewards = await Rewards.findOne({ where: { guild_id: interaction.guild!.id } });

        if (interaction.user.id !== "515575447124181007") return;

        if (!rewards) {
            await Rewards.create({
                guild_id: interaction.guild!.id,
                commands: 1,
                daily: 1500,
                message: 1,
                voice: 1,
                work: 10000
            });
            return interaction.reply('Создана таблица с наградами')
        }

        if (targetStr === 'daily') {
            rewards.daily = Number(rewards.daily) + targetNum;
            rewards.save();
            return interaction.reply(`Изменено для ${targetStr} сумма ${targetNum}`);
        } else if (targetStr === 'message') {
            rewards.message = Number(rewards.message) + targetNum;
            rewards.save();
            return interaction.reply(`Изменено для ${targetStr} сумма ${targetNum}`);
        } else if (targetStr === 'commands') {
            rewards.commands = Number(rewards.commands) + targetNum;
            rewards.save();
            return interaction.reply(`Изменено для ${targetStr} сумма ${targetNum}`);
        } else if (targetStr === 'voice') {
            rewards.voice = Number(rewards.voice) + targetNum;
            rewards.save();
            return interaction.reply(`Изменено для ${targetStr} сумма ${targetNum}`);
        } else if (targetStr === 'work') {
            rewards.work = Number(rewards.work) + targetNum;
            rewards.save();
            return interaction.reply(`Изменено для ${targetStr} сумма ${targetNum}`);
        } else {
            interaction.reply('set\ndaily\nmessage\ncommands\nvoice\nwork')
        }  
    }
});
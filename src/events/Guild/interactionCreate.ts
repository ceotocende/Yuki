import { ButtonBuilder, ButtonInteraction, EmbedBuilder, TextChannel } from "discord.js";
import { client } from "../..";
import { RecordsDB } from "../../database/Models/MainModels/RecordsModel";
import { channelsId } from "../../utils/config";

client.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild()) return;

    if (interaction.isChatInputCommand()) {
        const userRecordsDb = await RecordsDB.findOne({ where: { user_id: interaction.user.id } });

        const command = client.commands.get(interaction.commandName);
        const channel = interaction.guild;
        if (!channel) return;
        const channelLog = channel.channels.cache.get(channelsId.voiceLog) as TextChannel;

        if (!command) return;

        try {
            command?.run(client, interaction);
            if (!userRecordsDb) return;
            userRecordsDb.commands_count = Number(userRecordsDb.commands_count) + 1;
            userRecordsDb.save();
        } catch (err) {
            console.error(err);
            interaction.reply({ ephemeral: true, content: "Произошла ошибка при выполнение команды" });
            channelLog.send({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('Произошла ошибка войса')
                        .setDescription(`Присоединение ` + err)
                        .setColor('Red')
                        .setTimestamp()
                ]
            });
        };
    }
    if (!interaction.isButton()) return;
});
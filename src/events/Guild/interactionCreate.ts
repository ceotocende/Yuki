import { ButtonBuilder, ButtonInteraction } from "discord.js";
import { client } from "../..";
import { RecordsDB } from "../../database/Models/MainModels/RecordsModel";

client.on('interactionCreate', async (interaction) => {
    if (!interaction.inGuild()) return;

    if (interaction.isChatInputCommand()) {
        const userRecordsDb = await RecordsDB.findOne({ where: { user_id: interaction.user.id } });

        const command = client.commands.get(interaction.commandName);

        if (!command) return;

        try {
            command?.run(client, interaction);
            if (!userRecordsDb) return;
            userRecordsDb.commands_count = Number(userRecordsDb.commands_count) + 1;
            userRecordsDb.save();
        } catch (err) {
            console.error(err);
            interaction.reply({ ephemeral: true, content: "Произошла ошибка при выполнение команды" })
        };
    }
    if (!interaction.isButton()) return;
});
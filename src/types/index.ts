import { SlashCommandBuilder, ContextMenuCommandBuilder, ChatInputCommandInteraction, SlashCommandSubcommandsOnlyBuilder, InteractionReplyOptions, SlashCommandOptionsOnlyBuilder } from "discord.js";
import ExtendedClient from "../class/ExtendedClient";

export interface Command {
    structure: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">  | ContextMenuCommandBuilder,
    run: (client: ExtendedClient, interaction: ChatInputCommandInteraction) => void
};
import { client } from "../..";
import DestroyToDb from "../../database/Functions/DestroyToDb";

client.on('guildMemberRemove', async (member) => {
    await DestroyToDb(member.user);
}) 
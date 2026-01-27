import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import CheckLvl from "./CheckLvl";

export default async function AddExpToDatabase(user: User, exp: number) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });

    if (!userDb) return;
    else {
        if (userDb.user_id === user.id) {
            try {
                userDb.exp = Number(userDb.exp) + exp;
                userDb.save();
                await CheckLvl(user, user.client.guilds.cache.get('1397730981124767878')!);
            } catch (err) {
                console.error('ошибка в добавление опыта: ' + err);
            }
        }
    }
}
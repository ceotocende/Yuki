import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import CheckLvl from "./CheckLvl";

export default async function AddExpToDatabase(user: User, exp: number) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });

    if (!userDb) return;
    else {
        if (userDb.user_id === user.id) {
            userDb.exp = Number(userDb.exp) + exp;
            userDb.save();
            await CheckLvl(user);
        }
    }
}
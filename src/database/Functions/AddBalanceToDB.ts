import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RateDB } from "../Models/MainModels/RateModel";
import { RecordsDB } from "../Models/MainModels/RecordsModel";
import AddUserToDB from "./AddUsersToDB";

export default async function AddBalanceToDB(user: User, balance: number) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });

    if (!userDb) return await AddUserToDB(user);

    if (userDb) {
        userDb.balance = Number(userDb.balance) + balance;
        userDb.save();
        return;
    }
}
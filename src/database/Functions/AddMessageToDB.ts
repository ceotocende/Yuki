import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RateDB } from "../Models/MainModels/RateModel";
import { RecordsDB } from "../Models/MainModels/RecordsModel";
import AddUserToDB from "./AddUsersToDB";

export default async function AddMessageToDB(user: User, message: string) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });
    const userRateDb = await RateDB.findOne({ where: { user_id: user.id } });
    const userRecordDb = await RecordsDB.findOne({ where: { user_id: user.id } });

    if (!userDb) return await AddUserToDB(user);
    if (!userRateDb) return await AddUserToDB(user);
    if (!userRecordDb) return await AddUserToDB(user);

    if (userDb && userRateDb && userRecordDb) {
        try {
            userRateDb.symbols = Number(userRateDb.symbols) + message.replace(" ", "").length;
            userRecordDb.count_symbol = Number(userRecordDb.count_symbol) + message.replace(" ", "").length;
            userRecordDb.message_count = Number(userRecordDb.message_count) + 1;
            userRateDb.save();
            userRecordDb.save();
            return;
        } catch (err) {
            console.error("Ошибка доавбления сообщения " + err)
        }
    }
}
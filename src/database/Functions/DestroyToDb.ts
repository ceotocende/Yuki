import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RateDB } from "../Models/MainModels/RateModel";
import { RecordsDB } from "../Models/MainModels/RecordsModel";

export default async function DestroyToDb(user: User) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });
    const userRateDb = await RateDB.findOne({ where: { user_id: user.id } });
    const userRecordDb = await RecordsDB.findOne({ where: { user_id: user.id } });

    if (userDb) {
        await Users.destroy({ where: { user_id: user.id } });
    }

    if (userRateDb) {
        await RateDB.destroy({ where: { user_id: user.id } });
    }

    if (userRecordDb) {
        await RecordsDB.destroy({ where: { user_id: user.id } });
    }
}
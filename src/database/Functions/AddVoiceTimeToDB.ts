import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RateDB } from "../Models/MainModels/RateModel";
import { RecordsDB } from "../Models/MainModels/RecordsModel";
import AddUserToDB from "./AddUsersToDB";

export default async function AddVoiceToDB(user: User, time: number) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });
    const userRateDb = await RateDB.findOne({ where: { user_id: user.id } });
    const userRecordDb = await RecordsDB.findOne({ where: { user_id: user.id } });

    if (!userDb) return await AddUserToDB(user);
    if (!userRateDb) return await AddUserToDB(user);
    if (!userRecordDb) return await AddUserToDB(user);

    if (userDb && userRateDb && userRecordDb) {
        if (isNaN(time)) {
            return;
        } else if (!userDb) {
            const newRate = await RateDB.create({ user_id: user.id, voice: String(time), symbols: 0 });
            const newRecords = await RecordsDB.create({ user_id: user.id, voice_time: String(Math.floor(time)), commands_count: 0, count_symbol: 0, exp_currency: 0, message_count: 0 });
            // exp: Math.floor(time / 1000), first_currency: Math.floor(time / 1000), second_currency: 0, rank: Math.floor(time / 1000) 
            newRate.save();
            newRecords.save();
        } else if (userDb.user_id === user.id) {
            try {
                userRateDb.voice = String(Number(userRateDb.voice) + Math.floor(time));
                userRecordDb.voice_time = String(Number(userRecordDb.voice_time) + Math.floor(time));
                userRecordDb.save();
                userRateDb.save();
            } catch (err) {
                console.error('Ошибка добавления войс времени' + err)
            }
        } else {
            console.log('!error function addVoiceTime please chek this function!')
        }
    }
}
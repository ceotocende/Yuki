import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RateDB } from "../Models/MainModels/RateModel";
import { RecordsDB } from "../Models/MainModels/RecordsModel";
import { NotificationRewards } from "../Models/SecondsModels/NotificationRewards";

export default async function AddUserToDB(user: User) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });
    const userRateDb = await RateDB.findOne({ where: { user_id: user.id } });
    const userRecordDb = await RecordsDB.findOne({ where: { user_id: user.id } });
    const notificationRewardDb = await NotificationRewards.findOne({ where: { user_id: user.id } });

    if (userDb && userRateDb && userRecordDb && notificationRewardDb) return
    else {
        if (!userDb) {
            const newUser = await Users.create({  
                user_id: user.id,
                balance: 0,
                exp: 1,
                need_exp: 100,
                lvl: 0
            })

            newUser.save()
        }

        if (!userRateDb) {
            const newRate = await RateDB.create({
                user_id: user.id,
                symbols: 0,
                voice: '0'
            })

            newRate.save();
        } 

        if (!userRecordDb) {
            const newRecords = await RecordsDB.create({
                user_id: user.id,
                commands_count: 0,
                count_symbol: 0,
                exp_currency: 0,
                message_count: 0,
                voice_time: '0'
            })

            newRecords.save();
        } 

        if (!notificationRewardDb) {
            const newNotificationRewardDb = await NotificationRewards.create({
                user_id: user.id,
                daily: 1,
                work: 1
            })
        }
    }
}
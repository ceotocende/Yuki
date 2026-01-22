import { User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";


function calculateRequiredExp(level: number): number {
    return 100 + 50 * level + 5 * Math.pow(level, 2);
}

export default async function CheckLvl(user: User) {
    const userDb = await Users.findOne({ where: { user_id: user.id } });

    if (!userDb) return;

    let currentExp = Number(userDb.exp);
    let currentLvl = Number(userDb.lvl);
    let gainedExp = currentExp; // Сохраняем изначальное количество опыта

    // Обрабатываем повышение уровней, пока текущий опыт больше требуемого
    while (true) {
        const requiredExp = calculateRequiredExp(currentLvl);

        // Если текущего опыта недостаточно для перехода на следующий уровень
        if (gainedExp < requiredExp) {
            break;
        }

        // Переходим на следующий уровень
        gainedExp -= requiredExp;
        currentLvl += 1;
    }

    // Если уровень изменился, обновляем данные в базе
    if (currentLvl !== Number(userDb.lvl)) {
        userDb.lvl = currentLvl;
        userDb.exp = gainedExp; // Сохраняем остаток опыта после всех повышений
        userDb.need_exp = calculateRequiredExp(currentLvl); // Устанавливаем требование для следующего уровня
        await userDb.save();
    }
}

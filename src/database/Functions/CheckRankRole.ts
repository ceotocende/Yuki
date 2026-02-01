import { Guild, GuildMemberRoleManager, Role, User } from "discord.js";
import { Users } from "../Models/MainModels/UsersModels";
import { RankRole } from "../Models/SecondsModels/RankRole";
import { RankRoleUser } from "../Models/SecondsModels/RankRoleUser";
import AddUserToDB from "./AddUsersToDB";

export async function CheckRankRole(user: User, guild: Guild): Promise<Role | null> {
    try {
        // Получаем данные пользователя
        const userDb = await Users.findOne({ where: { user_id: user.id } });
        if (!userDb) {
            await AddUserToDB(user);
            return null;
        }

        // Получаем все ранговые роли и сортируем по уровню
        const rankRoles = await RankRole.findAll({ order: [['lvl', 'DESC']] });
        if (!rankRoles || rankRoles.length === 0) {
            console.log('Нет ранговых ролей в базе данных!');
            return null;
        }

        // Находим подходящую роль по уровню пользователя
        const suitableRole = rankRoles.find(role => userDb.lvl >= role.lvl);
        
        if (!suitableRole) {
            console.log(`Не найдена подходящая роль для уровня ${userDb.lvl}`);
            return null;
        }

        // Получаем роль из Discord
        const discordRole = guild.roles.cache.get(suitableRole.role_id);
        if (!discordRole) {
            console.log(`Роль с ID ${suitableRole.role_id} не найдена на сервере`);
            return null;
        }

        // Получаем информацию о участнике
        const member = await guild.members.fetch(user.id).catch(() => null);
        if (!member) {
            console.log(`Участник ${user.id} не найден на сервере`);
            return null;
        }

        const memberRole = member.roles as GuildMemberRoleManager;
        
        // Получаем текущую ранговую роль пользователя из БД
        const userRankRoleDb = await RankRoleUser.findOne({ where: { user_id: user.id } });

        // Если у пользователя уже установлена эта роль, возвращаем null
        if (userRankRoleDb && userRankRoleDb.role_id === suitableRole.role_id) {
            return null;
        }

        // Удаляем все предыдущие ранговые роли
        const previousRankRoles = await RankRoleUser.findAll({ where: { user_id: user.id } });
        
        for (const prevRole of previousRankRoles) {
            const oldDiscordRole = guild.roles.cache.get(prevRole.role_id);
            if (oldDiscordRole && memberRole.cache.has(oldDiscordRole.id)) {
                try {
                    await memberRole.remove(oldDiscordRole.id);
                } catch (err) {
                    console.error(`Ошибка удаления роли ${oldDiscordRole.id}:`, err);
                }
            }
            await RankRoleUser.destroy({ where: { user_id: user.id, role_id: prevRole.role_id } });
        }

        // Добавляем новую роль
        try {
            await memberRole.add(discordRole.id);
            
            // Сохраняем в БД
            await RankRoleUser.create({ 
                role_id: suitableRole.role_id, 
                user_id: user.id 
            });
            
            console.log(`Выдана роль ${discordRole.name} пользователю ${user.tag}`);
            return discordRole;
            
        } catch (err) {
            console.error("Ошибка при выдаче роли:", err);
            return null;
        }

    } catch (error) {
        console.error("Ошибка в функции CheckRankRole:", error);
        return null;
    }
}
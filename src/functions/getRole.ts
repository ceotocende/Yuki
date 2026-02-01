import { Guild, Role } from "discord.js";

async function GetRole(guild: Guild, role: string): Promise<Role | null> {
    if (!guild) return null;
    else {
        const getRole = guild.roles.cache.get(`${role}`)
        if (!getRole) return null;
        else return getRole;
    }
}
// models/VoiceSessionModel.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../../sequelize';

interface VoiceSessionAttributes {
    user_id: string;
    guild_id: string;
    channel_id: string | null;
    join_time: number | null; // время последнего входа (если сейчас в войсе)
    accumulated_time: number; // общее накопленное время
    last_updated: number; // когда последний раз обновлялось
}

export class VoiceSessionDB extends Model<VoiceSessionAttributes> implements VoiceSessionAttributes {
    public user_id!: string;
    public guild_id!: string;
    public channel_id!: string | null;
    public join_time!: number | null;
    public accumulated_time!: number;
    public last_updated!: number;
}

VoiceSessionDB.init({
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    guild_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    channel_id: {
        type: DataTypes.STRING,
        allowNull: true // может быть null, если пользователь не в канале
    },
    join_time: {
        type: DataTypes.BIGINT,
        allowNull: true // null, если пользователь не в голосовом канале
    },
    accumulated_time: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    },
    last_updated: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    }
}, { sequelize, tableName: 'VoiceSessions', createdAt: false, timestamps: false });
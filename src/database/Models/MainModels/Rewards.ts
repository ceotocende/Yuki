import sequelize from "../../sequelize";
import { Model, Optional, DataTypes } from "sequelize";

interface RewardsInt {
     guild_id: string;
     message: number;
     commands: number;
     voice: number;
     daily: number;
     work: number;
};

interface RewardsOpt extends Optional<RewardsInt, 'guild_id'> { };

export class Rewards extends Model<RewardsInt, RewardsOpt> implements RewardsInt {
    public guild_id!: string;
    public message!: number;
    public commands!: number;
    public voice!: number;
    public daily!: number;
    public work!: number;
}

Rewards.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    message: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
    },
    commands: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
    },
    voice: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1
    },
    daily: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 1500
    },
    work: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 10000
    }
},{ sequelize, tableName: 'rewards', createdAt: false, timestamps: false })
import sequelize from "../../sequelize";
import { Model, Optional, DataTypes } from "sequelize";

interface NotificationRewardsInt {
     user_id: string;
     daily: number;
     work: number;
};

interface NotificationRewardsOpt extends Optional<NotificationRewardsInt, 'user_id'> { };

export class NotificationRewards extends Model<NotificationRewardsInt, NotificationRewardsOpt> implements NotificationRewardsInt {
    public user_id!: string;
    public daily!: number;
    public work!: number;
}

NotificationRewards.init({
    user_id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    daily: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 86400000 
    },
    work: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 14400000
    }
},{ sequelize, tableName: 'notification_rewards', createdAt: false, timestamps: false })
import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface RankRoleUserAttributes {
    user_id: string;
    role_id: string;
}

interface RankRoleUserCreateAt extends Optional<RankRoleUserAttributes, 'user_id'> { };

export class RankRoleUser extends Model<RankRoleUserAttributes, RankRoleUserCreateAt> implements RankRoleUserAttributes { 
    public user_id!: string;
    public role_id!: string;
};

RankRoleUser.init({
    user_id: {
        type: STRING,
        primaryKey: true,
        allowNull: false
    },
    role_id: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'rank_roles_users', createdAt: false, timestamps: false });

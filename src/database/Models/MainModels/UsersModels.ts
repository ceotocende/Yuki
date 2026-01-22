import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface UserAttributes {
    user_id: string;
    exp: number;
    need_exp: number;
    lvl: number;
    balance: number;
}

interface UsersCreateAt extends Optional<UserAttributes, 'user_id'> { };

export class Users extends Model<UserAttributes, UsersCreateAt> implements UserAttributes { 
    public user_id!: string;
    public exp!: number;
    public need_exp!: number;
    public lvl!: number;
    public balance!: number;

    public async findOneUser(user_id: string): Promise<Users | null> {
        return Users.findOne({
            where: { user_id }
        });
    }
};

Users.init({
    user_id: {
        type: STRING,
        primaryKey: true,
    },
    exp: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    need_exp: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    lvl: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    balance: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'users', createdAt: false, timestamps: false });

import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface UsersItemsAttributes {
    user_id: string;
    item_id: string;
}

interface UsersItemsCreateAt { };

export class UsersItems extends Model<UsersItemsAttributes, UsersItemsCreateAt> implements UsersItemsAttributes { 
    public user_id!: string;
    public item_id!: string;
};

UsersItems.init({
    user_id: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    item_id: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'users_items', createdAt: false, timestamps: false });

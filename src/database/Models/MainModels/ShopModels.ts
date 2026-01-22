import { Model, DataTypes, Optional, BOOLEAN } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface ShopAttributes {
    item_id: string;
    timely: boolean;
    time: string;
    cost: number;
}

interface ShopCreateAt extends Optional<ShopAttributes, 'item_id'> { };

export class ShopDB extends Model<ShopAttributes, ShopCreateAt> implements ShopAttributes { 
    public item_id!: string;
    public timely!: boolean;
    public time!: string;
    public cost!: number;

    public async findOneUser(item_id: string): Promise<ShopDB | null> {
        return ShopDB.findOne({
            where: { item_id }
        });
    }
};  

ShopDB.init({
    item_id: {
        type: STRING,
        primaryKey: true,
    },
    timely: {
        type: BOOLEAN,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    time: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    cost: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'Shop', createdAt: false, timestamps: false });

import { Model, DataTypes, Optional, BOOLEAN } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface RateAttributes {
    user_id: string;
    voice: string;
    symbols: number;
}

interface RateCreateAt extends Optional<RateAttributes, 'user_id'> { };

export class RateDB extends Model<RateAttributes, RateCreateAt> implements RateAttributes { 
    public user_id!: string;
    public voice!: string;
    public symbols!: number;

    public async findOneUser(user_id: string): Promise<RateDB | null> {
        return RateDB.findOne({
            where: { user_id }
        });
    }
};  

RateDB.init({
    user_id: {
        type: STRING,
        primaryKey: true,
    },
    voice: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    symbols: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'Rate', createdAt: false, timestamps: false });

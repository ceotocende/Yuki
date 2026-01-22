import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface RecordsAttributes {
    user_id: string;
    message_count: number;
    count_symbol: number;
    voice_time: string;
    commands_count: number;
    exp_currency: number;
}

interface RecordsCreateAt extends Optional<RecordsAttributes, 'user_id'> { };

export class RecordsDB extends Model<RecordsAttributes, RecordsCreateAt> implements RecordsAttributes { 
    public user_id!: string;
    public message_count!: number;
    public count_symbol!: number;
    public voice_time!: string;
    public commands_count!: number;
    public exp_currency!: number;

    public async findOneUser(user_id: string): Promise<RecordsDB | null> {
        return RecordsDB.findOne({
            where: { user_id }
        });
    }
};  

RecordsDB.init({
    user_id: {
        type: STRING,
        primaryKey: true,
    },
    message_count: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    count_symbol: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    voice_time: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    exp_currency: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
    commands_count: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
}, { sequelize, tableName: 'Records', createdAt: false, timestamps: false });

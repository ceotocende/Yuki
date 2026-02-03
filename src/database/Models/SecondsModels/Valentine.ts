import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { STRING } = DataTypes;

interface ValentineAttributes {
    id: string;
    user_id_first: string;
    user_id_second: string;
    description: string;
}

interface ValentineCreateAt extends Optional<ValentineAttributes, 'id'> { };

export class Valentine extends Model<ValentineAttributes, ValentineCreateAt> implements ValentineAttributes { 
    public id!: string;
    public user_id_first!: string;
    public user_id_second!: string;
    public description!: string;

    public async findOneUser(user_id: string): Promise<Valentine | null> {
        return Valentine.findOne({
            where: { user_id_first: user_id }
        });
    }
};

Valentine.init({
    id: {
        type: STRING,
        primaryKey: true
    },
    user_id_first: {
        type: STRING,
        allowNull: false,
        primaryKey: false
    },
    user_id_second: {
        type: STRING,
        allowNull: false,
        primaryKey: false
    },
    description: {
        type: STRING,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    }
}, { sequelize, tableName: 'valentines', createdAt: false, timestamps: false });

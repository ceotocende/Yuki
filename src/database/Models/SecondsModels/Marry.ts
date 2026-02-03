import sequelize from "../../sequelize";
import { Model, Optional, DataTypes } from "sequelize";

interface MarryInt {
     user_id_first: string;
     user_id_second: string;
     time: number;
};

interface MarryOpt extends Optional<MarryInt, 'user_id_first'> { };

export class Marry extends Model<MarryInt, MarryOpt> implements MarryInt {
    public user_id_first!: string;
    public user_id_second!: string;
    public time!: number;
}

Marry.init({
    user_id_first: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    user_id_second: {
        type: DataTypes.STRING,
        unique: true
    },
    time: {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 0
    }
},{ sequelize, tableName: 'marrys', createdAt: false, timestamps: false })
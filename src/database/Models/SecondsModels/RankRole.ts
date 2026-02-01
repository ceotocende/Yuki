import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../../sequelize';

const { INTEGER, BIGINT, STRING } = DataTypes;

interface RankRoleAttributes {
    role_id: string;
    lvl: number;
}

interface RankRoleCreateAt extends Optional<RankRoleAttributes, 'role_id'> { };

export class RankRole extends Model<RankRoleAttributes, RankRoleCreateAt> implements RankRoleAttributes { 
    public role_id!: string;
    public lvl!: number;

    public async findOneUser(role_id: string): Promise<RankRole | null> {
        return RankRole.findOne({
            where: { role_id: role_id }
        });
    }
};

RankRole.init({
    role_id: {
        type: STRING,
        primaryKey: true,
    },
    lvl: {
        type: BIGINT,
        primaryKey: false,
        defaultValue: 0,
        allowNull: false
    },
}, { sequelize, tableName: 'rank_roles', createdAt: false, timestamps: false });

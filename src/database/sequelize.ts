import { Sequelize } from "sequelize";

const sequelize = new Sequelize('name', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    port: 5432,
    logging: false,
    storage: 'db/database.db'
    // benchmark: true,
    // logging: console.log,
})

export default sequelize;
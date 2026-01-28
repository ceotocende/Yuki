import { Model, ModelStatic } from "sequelize";
import { Users } from "./Models/MainModels/UsersModels";
import { RecordsDB } from "./Models/MainModels/RecordsModel";
import sequelize from "./sequelize";
import { ShopDB } from "./Models/MainModels/ShopModels";
import { RateDB } from "./Models/MainModels/RateModel";
import { UsersItems } from "./Models/SecondsModels/UsersItemsModel";
import { TextChannel } from "discord.js";

export async function TableSync(channel: TextChannel) {
  try {
    await Users.sync();
    await RecordsDB.sync();
    await ShopDB.sync();
    await RateDB.sync();
    await UsersItems.sync();
    
    await sequelize.sync({ alter: true });
    console.log('Таблицы синхронизированы');

    await sequelize.authenticate();
    console.log(`[${sequelize.getDatabaseName()}]: авторизованна`)

    channel.send({
      content: `[${sequelize.getDatabaseName()}]: авторизованна`
    })
  } catch (err) {
    console.log(`[Произошла ошибка в базе данных]: ${new Date()} ${err}`);
    channel.send({
      content: `[Произошла ошибка в базе данных]: ${new Date()} ${err}`
    })
  }
};

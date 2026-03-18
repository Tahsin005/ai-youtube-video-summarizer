import { DataSource } from "typeorm";
import { environment } from "./env.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: environment.DB_HOST,
    port: parseInt(environment.DB_PORT),
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    database: environment.DB_DATABASE,
    logging: ["query", "error"],
    entities: [],
    migrations: [],
    subscribers: [],
});
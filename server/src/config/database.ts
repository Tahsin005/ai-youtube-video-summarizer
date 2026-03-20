import { DataSource } from "typeorm";
import { environment } from "./env.js";
import { User } from "../entities/user.entity.js";
import { Video } from "../entities/video.entity.js";
import { Transcription } from "../entities/transcription.entity.js";
import { Analysis } from "../entities/analysis.entity.js";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: environment.DB_HOST,
    port: parseInt(environment.DB_PORT),
    username: environment.DB_USERNAME,
    password: environment.DB_PASSWORD,
    database: environment.DB_DATABASE,
    // logging: ["query", "error"],
    entities: [User, Video, Transcription, Analysis],
    migrations: [],
    subscribers: [],
    synchronize: true,
});
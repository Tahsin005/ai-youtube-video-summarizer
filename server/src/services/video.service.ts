import { environment } from "../config/env.js";
import path from "node:path";
import { AppDataSource } from "../config/database.js";
import { Video } from "../entities/video.entity.js";
import { mkdir } from "node:fs/promises";
import { create } from "youtube-dl-exec";

const youtubeDl = create(environment.YOUTUBE_DL_PATH || "yt-dlp");
import ytdl from "ytdl-core";
import ffmpeg from "@ffmpeg-installer/ffmpeg"
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes";
import logger from "../utils/logger.js";

export interface VideoInfo {
    title: string;
    description: string;
    duration: number;
    author: string;
    videoUrl: string;
    thumbnail: string;
    audioPath?: string;
}

type YoutubeDLOutput = {
    title: string;
    description?: string;
    duration: number;
    thumbnail: string;
    uploader: string;
} & Record<string, unknown>;

export class VideoService {
    private static readonly AUDIO_DIR = path.join(process.cwd(), "temp", "audio");
    private static readonly videoRepository = AppDataSource.getRepository(Video);

    static async ensureDirectoryExists() {
        await mkdir(this.AUDIO_DIR, { recursive: true });
    }

    static async getVideoInfo(url: string): Promise<VideoInfo> {
        try {
            // get video info using youtube-dl
            const rawInfo = await youtubeDl(url, {
                dumpSingleJson: true,
                noWarnings: true,
                preferFreeFormats: true,
                ffmpegLocation: ffmpeg.path,
            });

            const info = rawInfo as YoutubeDLOutput;

            if (!info.title || !info.uploader || typeof info.duration !== "number") {
                throw new AppError(StatusCodes.BAD_REQUEST, "Invalid video info");
            }

            // get the best quality thumbnail
            const thumbnail = info.thumbnail || (info as any).thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${ytdl.getVideoID(url)}/maxresdefault.jpg`;

            return {
                title: info.title,
                description: info.description || "",
                duration: info.duration,
                author: info.uploader,
                videoUrl: url,
                thumbnail: thumbnail 
            }
        } catch (error) {
            logger.error("Failed to get video info", { url, error });
            if (error instanceof Error) {
                if (error.message.includes("Private video")) {
                    throw new AppError(StatusCodes.FORBIDDEN, "Private video not accessible");
                }
                if (error.message.includes("not unavailable")) {
                    throw new AppError(StatusCodes.NOT_FOUND, "Video not available");
                }
                throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to get video info" + error.message);
            }
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to get video info");
        }
    }

    static async downloadAudio(url: string): Promise<string> {
        try {
            await this.ensureDirectoryExists();

            const videoId = ytdl.getVideoID(url);
            const audioPath = path.join(this.AUDIO_DIR, `${videoId}.mp3`);

            await youtubeDl(url, {
                extractAudio: true,
                audioFormat: "mp3",
                audioQuality: 0, // best quality
                noWarnings: true,
                preferFreeFormats: true,
                output: audioPath,
                ffmpegLocation: ffmpeg.path,
            })
            
            const fileStats = await import("fs/promises").then((fs) => 
                fs.stat(audioPath)
            );

            if (fileStats.size === 0) {
                throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to download audio");
            }

            return audioPath;
        } catch (error) {
            logger.error("Failed to download audio", { url, error });
            if (error instanceof Error) {
                if (error.message.includes("ffmpeg")) {
                    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to download audio");
                }
                throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to download audio");
            }
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to download audio");
        }
    };
};
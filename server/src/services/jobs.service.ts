import Queue from "bull";
import { AppDataSource } from "../config/database.js";
import { Video, VideoStatus } from "../entities/video.entity.js";
import { Transcription } from "../entities/transcription.entity.js";
import { Analysis } from "../entities/analysis.entity.js";
import { User } from "../entities/user.entity.js";
import { VideoService } from "./video.service.js";
import { TranscriptionService } from "./transcription.service.js";
import { unlink } from "fs/promises";
import { AIService } from "./ai.service.js";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { environment } from "../config/env.js";

interface TranscriptionJob {
    url: string;
    videoInfo?: any;
    userId: string;
}

export class JobsService {
    private static transcriptionQueue: Queue.Queue;
    private static readonly videoRespository = AppDataSource.getRepository(Video);
    private static readonly transcriptionRepository = AppDataSource.getRepository(Transcription);
    private static readonly analysisRepository = AppDataSource.getRepository(Analysis);
    private static readonly userRepository = AppDataSource.getRepository(User);

    static async initialize() {
        this.transcriptionQueue = new Queue<TranscriptionJob>("transcription", {
            redis: {
                host: environment.REDIS_HOST || "localhost",
                port: parseInt(environment.REDIS_PORT || "6379"),
            },
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 2000,
                },
                removeOnComplete: {
                    age: 24 * 60 * 60, // 24 hours
                    count: 100,
                },
                removeOnFail: {
                    age: 24 * 60 * 60, // 24 hours
                }
            }
        });  
        
        await this.setupQueueHandlers();
    }

    static async setupQueueHandlers() {
        this.transcriptionQueue.process(async (job) => {
            const { url, userId } = job.data;
            let audioPath: string | undefined;
            let video: Video | null = null;

            try {
                // create or update video
                video = await this.videoRespository.findOne({
                    where: { url }
                });

                if (!video) {
                    video = new Video();
                    video.url = url;
                    video.status = VideoStatus.PROCESSING;
                    video.user = { id: userId } as User;
                }

                job.progress(10);

                // get video info if not already present
                const videoInfo = job.data.videoInfo || (await VideoService.getVideoInfo(url));

                // update video with info
                Object.assign(video, {
                    title: videoInfo.title,
                    description: videoInfo.description,
                    duration: videoInfo.duration,
                    author: videoInfo.author,
                    thumbnail: videoInfo.thumbnail || videoInfo.thumbnailUrl,
                });

                await this.videoRespository.save(video);
                
                job.progress(20);

                // download audio
                audioPath = await VideoService.downloadAudio(url);

                job.progress(40);

                // transcribe audio
                const transcriptionResult = await TranscriptionService.transcribe(audioPath);

                // check for existing transcription and update or create new one
                let transcription = await this.transcriptionRepository.findOne({
                    where: { video: { id: video.id } }
                });

                if (transcription) {
                    // update existing transcription
                    transcription.text = transcriptionResult.text;
                    transcription.confidence = transcriptionResult.confidence;
                    transcription.isMusic = transcriptionResult.isMusic || false;
                    transcription.audioPath = audioPath;
                } else {
                    // create new transcription
                    transcription = new Transcription();
                    transcription.video = video;
                    transcription.text = transcriptionResult.text;
                    transcription.confidence = transcriptionResult.confidence;
                    transcription.isMusic = transcriptionResult.isMusic || false;
                    transcription.audioPath = audioPath;
                }

                await this.transcriptionRepository.save(transcription);

                // clean up audio file
                if (audioPath) {
                    await unlink(audioPath).catch((error) => {});;
                }

                job.progress(70);

                // dont perform analysis if music content is detected
                if (transcription.isMusic) {
                    video.status = VideoStatus.COMPLETED;
                    await this.videoRespository.save(video);
                    return {
                        videoInfo,
                        transcription: transcriptionResult,
                        status: VideoStatus.COMPLETED,
                    }
                }

                // perform AI analysis
                const analysisResult = await AIService.analyzeTranscription(transcriptionResult.text, videoInfo);

                // check for existing analysis and update or create new one
                let analysis = await this.analysisRepository.findOne({
                    where: { video: { id: video.id } }
                });

                if (analysis) {
                    Object.assign(analysis, analysisResult);
                } else {
                    analysis = new Analysis();
                    Object.assign(analysis, analysisResult);
                    analysis.video = video;
                }

                await this.analysisRepository.save(analysis);

                // update video status to completed
                video.status = VideoStatus.COMPLETED;
                await this.videoRespository.save(video);

                job.progress(100);

                return {
                    videoInfo,
                    transcription: transcriptionResult,
                    analysis: analysisResult,
                    status: VideoStatus.COMPLETED,
                };
            } catch (error) {
                if (audioPath) {
                    await unlink(audioPath).catch((err) => {});
                }

                if (video) {
                    video.status = VideoStatus.FAILED;
                    await this.videoRespository.save(video);
                }

                logger.error("Job processing error:", error);

                if (
                    error instanceof AppError && 
                    (error.message.includes("No speech detected") || 
                    error.message.includes("This video is private") || 
                    error.message.includes("This video is no longer available"))
                ) {
                    return {
                        error: error.message,
                        status: VideoStatus.FAILED,
                        final: true,
                    }
                }

                throw error;
            }
        });

        this.transcriptionQueue.on("completed", async (job, result) => {
            try {
                const user = await this.userRepository.findOne({
                    where: { id: job.data.userId }
                });

                if (user && result.videoInfo) {
                    // TODO: send a job completion email to user with video info and analysis summary
                }
            } catch (error) {
                logger.error("Error occurred while processing completed job:", error);
            }
        });

        this.transcriptionQueue.on("failed", (job, error) => {
            logger.error("Job failed:", { jobId: job.id, error });
        });

        this.transcriptionQueue.on("error", (error) => {
            logger.error("Queue error:", error);
        });

        // clean up stuck jobs
        this.transcriptionQueue.clean(24 * 60 * 60 * 1000, "failed");
        this.transcriptionQueue.clean(24 * 60 * 60 * 1000, "active");
        this.transcriptionQueue.clean(24 * 60 * 60 * 1000, "wait");
    }

    static async addTranscriptionJob(url: string, videoInfo?: any, user?: any) {
        let video = await this.videoRespository.findOne({
            where: { url }
        });

        if (!video) {
            video = new Video();
            video.url = url;
            video.status = VideoStatus.PENDING;
            video.user = user;
            
            if (videoInfo) {
                Object.assign(video, {
                    title: videoInfo.title,
                    description: videoInfo.description,
                    duration: videoInfo.duration,
                    author: videoInfo.author,
                    thumbnail: videoInfo.thumbnailUrl || videoInfo.thumbnail,
                })
            }

            await this.videoRespository.save(video);
        }

        const job = await this.transcriptionQueue.add({
            url,
            videoInfo,
            userId: user?.id,
        });

        return {
            jobId: job.id,
        }
    }
}
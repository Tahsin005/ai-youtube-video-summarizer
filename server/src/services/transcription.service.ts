import { protos, SpeechClient } from "@google-cloud/speech";
import { Storage } from "@google-cloud/storage";
import logger from "../utils/logger.js";
import { AppError } from "../utils/errors.js";
import { StatusCodes } from "http-status-codes/build/cjs/status-codes.js";
import path from "node:path";
import ffmpeg from "fluent-ffmpeg";
import { unlink } from "fs/promises";
import { environment } from "../config/env.js";

export interface TranscriptionResult {
    text: string;
    confidence: number;
    isMusic?: boolean;
}

export class TranscriptionService {
    private static readonly BUCKET_NAME = "ai-video-summarizer-audio";
    private static readonly speechClient = new SpeechClient();  
    private static readonly storage = new Storage();

    static async ensureBucketExists() {
        try {
            const [ exists ] = await this.storage.bucket(this.BUCKET_NAME).exists();
            if (!exists) {
                await this.storage.bucket(this.BUCKET_NAME).create({
                    location: "US",
                    storageClass: "STANDARD",
                });
                logger.info(`Bucket ${this.BUCKET_NAME} created.`);
            }
        } catch (error) {
            logger.error("Error ensuring bucket exists:", error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to create bucket")
        }
    }

    static async uploadToGCS(filePath: string): Promise<string> {
        const fileName = path.basename(filePath);
        const bucket = this.storage.bucket(this.BUCKET_NAME);
        try {
            await bucket.upload(filePath, {
                destination: fileName,
                metadata: {
                    contentType: "audio/wav",
                }
            });

            const gcsUrl = `gs://${this.BUCKET_NAME}/${fileName}`;
            logger.info(`Audio uploaded to GCS: ${gcsUrl}`);
            return gcsUrl;
        } catch (error) {
            logger.error("Error uploading file to GCS:", error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to upload file to GCS");
        }
    }

    static async deleteFromGCS(gcsUrl: string): Promise<void> {
        try {
            const fileName = gcsUrl.split("").pop();
            if (!fileName) {
                return;
            }

            const file = this.storage.bucket(this.BUCKET_NAME).file(fileName);
            const [ exists ] = await file.exists();
            if (exists) {
                await file.delete();
                logger.info(`File ${fileName} deleted from GCS.`);
            }
        } catch (error) {
            logger.error("Error deleting file from GCS:", error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to delete file from GCS");
        }
    }

    static async convertToWav(inputPath: string): Promise<string> {
        const outputPath = path.join(
            path.dirname(inputPath),
            `${path.basename(inputPath, path.extname(inputPath))}.wav`
        );
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
            .toFormat("wav")
            .audioFilters([
                "aresample=resampler=soxr", // hight quality resampling
                "highpass=f=50", // remove low frequency noise
                "lowpass=f=3000", // focus on speech frequencies
                "afftdn=nf=-25", // noise reduction
                "loudnorm=I=-16:LRA=11:TP=-1.5", // normalize audio levels
                "aformat=channel_layouts=mono", // ensure mono output
            ])
            .on("end", () => {
                logger.info(`Audio converted to WAV: ${outputPath}`);
                resolve(outputPath);
            })
            .on("error", (error) => {
                logger.error("Error converting audio to WAV:", error);
                reject(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to convert audio to WAV"));
            });
        });
    }

    static async detectContentType(audioPath: string): Promise<"music" | "speech"> {
        const analysisPath = path.join(
            path.dirname(audioPath),
            `${path.basename(audioPath, path.extname(audioPath))}_analysis.wav`
        );

        return new Promise((resolve, reject) => {
            let musicScore = 0;
            let totalSamples = 0;

            ffmpeg(audioPath)
            .toFormat("wav")
            .audioFrequency(16000) // standard sample rate for speech recognition
            .audioFilters([
                "silencedetect=n=-50dB:d=0.5", // detect silence to identify speech segments
                "volumedetect", // analyze volume levels to differentiate music from speech
            ])
            .save(analysisPath)
            .on("stderr", (stderrLine: string) => {
                logger.info(`FFmpeg stderr: ${stderrLine}`);
                if (stderrLine.includes("silencedetect")) {
                    musicScore -= 1; // more silence suggests music
                }
                if (stderrLine.includes("max_volume")) {
                    const match = stderrLine.match(/max_volume:\s*([-\d.]+)/);
                    if (match) {
                        const maxVolume = parseFloat(match[1] as string);
                        // Process the max volume value as needed
                        if (maxVolume > -5) {
                            musicScore += 1; // higher volume suggests music
                        }
                    }
                }
                totalSamples += 1;
            })
            .on("end", async (error) => {
                await unlink(analysisPath).catch((err) => {});
                const ratio = totalSamples > 0 ? musicScore / totalSamples : 0;
                logger.info(`Music detection score: ${ratio.toFixed(2)} (musicScore: ${musicScore}, totalSamples: ${totalSamples})`);
                resolve(ratio > 0.5 ? "music" : "speech");
            })
            .on("error", async (error) => {
                logger.error("Error analyzing audio content type:", error);
                await unlink(analysisPath).catch((err) => {});
                reject(new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to analyze audio content type")) ;
            });
        });
    }

    static async transcribe(audioPath: string): Promise<TranscriptionResult> {
        let wavePath: string | undefined;
        let gcsUrl: string | undefined;

        try {
            if (!audioPath) {
                throw new AppError(StatusCodes.BAD_REQUEST, "Audio path is required for transcription");
            }

            await this.ensureBucketExists();

            // convert audio to wav if it's not already
            wavePath = await this.convertToWav(audioPath);
            logger.info(`Audio converted to WAV: ${wavePath}`);

            // detect if the audio is music or speech
            const contentType = await this.detectContentType(wavePath);
            logger.info(`Detected content type: ${contentType}`);

            if (contentType === "music") {
                await unlink(wavePath).catch((error) => {});
                return {
                    text: "[MUSIC CONTENT DETECTED]",
                    confidence: 1.0,
                    isMusic: true,
                };
            }

            // upload the wav file to GCS
            gcsUrl = await this.uploadToGCS(wavePath);
            logger.info(`Audio uploaded to GCS: ${gcsUrl}`);

            // configure trascription request
            const request: protos.google.cloud.speech.v1.ILongRunningRecognizeRequest = {
                audio: {
                    uri: gcsUrl,
                },
                config: {
                    encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.LINEAR16,
                    sampleRateHertz: 16000,
                    languageCode: environment.SPEECH_TO_TEXT_LANGUAGE || "en-US",
                    enableAutomaticPunctuation: true,
                    model: "default",
                    useEnhanced: true,
                    metadata: {
                        interactionType: "DICTATION",
                        microphoneDistance: "NEARFIELD",
                        recordingDeviceType: "SMARTPHONE",
                    },
                    enableWordTimeOffsets: true,
                    enableWordConfidence: true,
                    maxAlternatives: 1,
                    profanityFilter: true,
                    adaptation: {
                        phraseSetReferences: [],
                        customClasses: [],
                    },
                    audioChannelCount: 1,
                    enableSeparateRecognitionPerChannel: false,
                    speechContexts: [
                        {
                            phrases: ["video", "youtube", "subscribe", "like", "comment"],
                            boost: 20,
                        }
                    ]
                },
            };
            
            const [ operation ] = await this.speechClient.longRunningRecognize(request);
            const [ response ] = await operation.promise();
            logger.info(`Transcription response: ${JSON.stringify(response)}`);


            // clean up files
            await Promise.all([
                wavePath? unlink(wavePath).catch((error) => {}) : Promise.resolve(),
                gcsUrl ? this.deleteFromGCS(gcsUrl) : Promise.resolve(),
            ])

            if (!response.results || response.results.length === 0) {
                throw new AppError(StatusCodes.BAD_GATEWAY, "No transcription results found");
            }

            const transcriptions = response.results.map((result) => result.alternatives?.[0]?.transcript || "").join(" ");

            const confidence = response.results.reduce((sum, result) => sum + (result.alternatives?.[0]?.confidence || 0), 0) / response.results.length;

            if (!transcriptions.trim()) {
                throw new AppError(StatusCodes.BAD_GATEWAY, "Transcription failed to produce any text");
            }

            return {
                text: transcriptions,
                confidence,
                isMusic: false,
            };
        } catch (error) {
            logger.error("Error during transcription:", error);
            throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Failed to transcribe audio");
        }
    }
};
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Video } from "./video.entity.js";

@Entity()
export class Transcription {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    text: string;

    @Column({ type: "float" })
    confidence: number;
    
    @Column({ type: "boolean" })
    isMusic: boolean;

    @Column({ type: "text", nullable: true })
    audioPath: string | null;

    @OneToOne(() => Video, (video) => video.transcription )
    @JoinColumn()
    video: Video;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Video } from "./video.entity.js";

@Entity()
export class Analysis {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "text" })
    summary: string;

    @Column("text", { array: true })
    keyPoints: string[];

    @Column({ type: "enum", enum: ["positive", "neutral", "negative"], default: "neutral" })
    sentiment: string;

    @Column("text", { array: true })
    topics: string[];

    @Column("text", { array: true })
    suggestedTags: string[];    

    @OneToOne(() => Video, (video) => video.analysis)
    @JoinColumn()
    video: Video;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
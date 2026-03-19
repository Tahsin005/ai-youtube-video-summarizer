import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity.js";

export enum VideoStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    COMPLETED = "completed",
    FAILED = "failed",
}

@Entity()
export class Video {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar" })
    url: string;

    @Column({ type: "varchar" })
    title: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column({ type: "int" })
    duration: number;

    @Column({ type: "varchar" })
    author: string;

    @Column({ type: "text", nullable: true })
    thumbnail: string;

    @Column({
        type: "enum",
        enum: VideoStatus,
        default: VideoStatus.PENDING,
    })
    status: VideoStatus;

    @ManyToOne(() => User, user => user.videos, {
        nullable: false,
        onDelete: "CASCADE"
    })
    user: User;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
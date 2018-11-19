import * as bcrypt from 'bcrypt';
// import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import {
    BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, Unique,
    UpdateDateColumn
} from 'typeorm';

import { Log } from './Log';

@Entity()
@Unique(['email'])
export class User {

    public static hashPassword(password: string): Promise<string> {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    return reject(err);
                }
                resolve(hash);
            });
        });
    }

    public static comparePassword(user: User, password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            bcrypt.compare(password, user.password, (err, res) => {
                resolve(res === true);
            });
        });
    }

    @PrimaryColumn('uuid')
    public id: string;

    @IsNotEmpty()
    @Column({ name: 'first_name' })
    public firstName: string;

    @Column({ name: 'last_name' })
    public lastName: string;

    @IsNotEmpty()
    @Column()
    public email: string;

    // @Exclude
    @IsNotEmpty()
    @Column()
    public password: string;

    @Column()
    public username: string;

    @Column()
    public confirmed: boolean;

    @Column()
    public provider: string;

    @Column()
    public avatar: string;

    @Column({ name: 'open_game' })
    public openGame: string; // TODO: Game relation

    @Column({ name: 'current_games' })
    public currentGames: string; // TODO: Game relation (many to many)

    @IsNotEmpty()
    @CreateDateColumn({ name: 'created_at' })
    public createdAt: Date;

    @IsNotEmpty()
    @UpdateDateColumn({ name: 'updated_at' })
    public updatedAt: Date;

    @OneToMany(type => Log, log => log.user)
    public logs: Log[];

    public toString(): string {
        return `${this.firstName} ${this.lastName} (${this.email})`;
    }

    @BeforeInsert()
    public async hashPassword(): Promise<void> {
        this.password = await User.hashPassword(this.password);
    }

}

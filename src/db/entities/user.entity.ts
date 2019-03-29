import * as bcrypt from 'bcrypt';
import * as uuid from 'uuid';
import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DefaultNamingStrategy,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Game, Log } from '../../db/entities';

@Entity()
@Unique(['email'])
@Unique(['username'])
export class User extends DefaultNamingStrategy {
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

  public static comparePassword(
    user: User,
    password: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, res) => {
        resolve(res === true);
      });
    });
  }

  @PrimaryColumn('uuid')
  public id: string;

  @Column({ name: 'first_name', nullable: true })
  public firstName: string;

  @Column({ name: 'last_name', nullable: true })
  public lastName: string;

  @Column({ nullable: true })
  public email: string;

  @Column({ nullable: true })
  @Exclude({ toPlainOnly: true })
  public password: string;

  @Column({ nullable: true })
  public username: string;

  @Column({ name: 'is_confirmed', nullable: true })
  public isConfirmed: boolean;

  @Column({ nullable: true })
  public provider: string;

  @Column({ nullable: true })
  public avatar: string;

  @ManyToOne(type => Game, game => game.playersOnline)
  @JoinColumn({ name: 'opened_game' })
  public openedGame: Game;

  @ManyToMany(type => Game, game => game.players)
  public currentGames: Game[];

  @ManyToOne(type => Game, game => game.watchers)
  @JoinColumn({ name: 'current_watch' })
  public currentWatch: Game;

  @ManyToMany(type => Game, game => game.nextPlayers)
  public currentMove: Game[];

  @IsNotEmpty()
  @Column({ name: 'games_played' })
  public gamesPlayed: number;

  @IsNotEmpty()
  @Column({ name: 'games_won' })
  public gamesWon: number;

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
    this.id = uuid.v1();

    if (this.password) {
      this.password = await User.hashPassword(this.password);
    }

    this.gamesPlayed = 0;
    this.gamesWon = 0;
  }
}

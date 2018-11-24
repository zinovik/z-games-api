import { IsNotEmpty } from 'class-validator';
import {
  BeforeInsert, Column, CreateDateColumn, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn,
  PrimaryGeneratedColumn, Unique, UpdateDateColumn
} from 'typeorm';

import { Log } from '../models/Log';
import { User } from '../models/User';

@Entity()
@Unique(['number'])
export class Game {

  @PrimaryColumn('uuid')
  public id: string;

  @PrimaryGeneratedColumn()
  public number: number;

  @IsNotEmpty()
  @Column()
  public name: string;

  @IsNotEmpty()
  @Column()
  public state: number;

  @IsNotEmpty()
  @Column({ name: 'players_max' })
  public playersMax: number;

  @IsNotEmpty()
  @Column({ name: 'players_min' })
  public playersMin: number;

  @IsNotEmpty()
  @Column({ name: 'game_info' })
  public gameData: string;

  @IsNotEmpty()
  @Column({ name: 'is_private' })
  public isPrivate: boolean;

  @OneToMany(type => User, user => user.openedGame)
  public playersOnline: User[];

  @ManyToMany(type => User, user => user.currentGames, { cascade: true })
  @JoinTable({ name: 'user_current_game_to_game_players' })
  public players: User[];

  @ManyToMany(type => User, user => user.currentWatch, { cascade: true })
  @JoinTable({ name: 'user_current_watch_to_game_watchers' })
  public watchers: User[];

  @ManyToMany(type => User, user => user.currentMove, { cascade: true })
  @JoinTable({ name: 'user_current_move_to_game_next_players' })
  public nextPlayers: User[];

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @OneToMany(type => Log, log => log.game)
  public logs: Log[];

  public toString(): string {
    return `${this.name}`;
  }

  @BeforeInsert()
  public async setState(): Promise<void> {
    this.state = 0;
  }

}

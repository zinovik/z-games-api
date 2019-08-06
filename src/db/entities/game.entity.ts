import * as uuid from 'uuid';
import { IsNotEmpty } from 'class-validator';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  DefaultNamingStrategy,
  Entity,
  Generated,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
  Unique,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { GAME_NOT_STARTED } from 'z-games-base-game';

import { User, Log, Invite } from '../../db/entities';

@Entity()
@Unique(['number'])
export class Game extends DefaultNamingStrategy {
  @PrimaryColumn('uuid')
  public id: string;

  @Column()
  @Generated('increment')
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

  @Column({ name: 'is_move_timeout' })
  public isMoveTimeout: boolean;

  @Column({ name: 'is_removed' })
  public isRemoved: boolean;

  @Column({ name: 'private_password', nullable: true })
  public privatePassword: string;

  @ManyToMany(type => User, user => user.currentGames)
  @JoinTable({ name: 'user_current_game_to_game_players' })
  public players: User[];

  @ManyToMany(type => User, user => user.currentMoves)
  @JoinTable({ name: 'user_current_move_to_game_next_players' })
  public nextPlayers: User[];

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @ManyToOne(type => User, user => user.createdGames)
  @JoinColumn({ name: 'created_by' })
  public createdBy: User;

  @JoinTable({ name: 'previous_move_at' })
  public previousMoveAt: Date;

  @OneToMany(type => Log, log => log.game)
  public logs: Log[];

  @OneToMany(type => Invite, invite => invite.game)
  public invites: Invite[];

  public toString(): string {
    return `${this.name}`;
  }

  @BeforeInsert()
  public setState(): void {
    this.id = uuid.v1();

    this.state = GAME_NOT_STARTED;
  }
}

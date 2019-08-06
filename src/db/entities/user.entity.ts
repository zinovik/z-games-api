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

import { Game, Log, Invite } from '../../db/entities';
import { CryptService } from '../../services/crypt.service';

@Entity()
@Unique(['email'])
@Unique(['username'])
export class User extends DefaultNamingStrategy {
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

  @Column({ name: 'notifications_token', nullable: true })
  public notificationsToken: string;

  @ManyToMany(type => Game, game => game.players)
  public currentGames: Game[];

  @ManyToMany(type => User, user => user.friends)
  public friends: User[];

  @ManyToMany(type => Game, game => game.nextPlayers)
  public currentMoves: Game[];

  @IsNotEmpty()
  @Column({ name: 'games_played' })
  public gamesPlayed: number;

  @IsNotEmpty()
  @Column({ name: 'games_won' })
  public gamesWon: number;

  @IsNotEmpty()
  @Column({ name: 'games_timeout' })
  public gamesTimeout: number;

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @UpdateDateColumn({ name: 'updated_at' })
  public updatedAt: Date;

  @UpdateDateColumn({ name: 'previous_visit_at' })
  public previousVisitAt: Date;

  @OneToMany(type => Log, log => log.createdBy)
  public createdLogs: Log[];

  @OneToMany(type => Invite, invite => invite.createdBy)
  public invitesInviter: Invite[];

  @OneToMany(type => Invite, invite => invite.invitee)
  public invitesInvitee: Invite[];

  @OneToMany(type => Game, game => game.createdBy)
  public createdGames: Game[];

  public toString(): string {
    return `${this.firstName} ${this.lastName} (${this.email})`;
  }

  @BeforeInsert()
  public async beforeInsert(): Promise<void> {
    this.id = uuid.v1();

    if (this.password) {
      this.password = await CryptService.hashPassword(this.password);
    }

    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.gamesTimeout = 0;
  }
}

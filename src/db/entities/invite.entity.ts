import * as uuid from 'uuid';
import { IsNotEmpty } from 'class-validator';
import {
  BeforeInsert,
  CreateDateColumn,
  DefaultNamingStrategy,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Column,
} from 'typeorm';

import { User, Game } from '../../db/entities';

@Entity()
export class Invite extends DefaultNamingStrategy {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @ManyToOne(type => Game, game => game.invites)
  @JoinColumn({ name: 'game_id' })
  public game: Game;

  @IsNotEmpty()
  @ManyToOne(type => User, user => user.invitesInviter)
  @JoinColumn({ name: 'user_id' })
  public createdBy: User;

  @IsNotEmpty()
  @ManyToOne(type => User, user => user.invitesInvitee)
  @JoinColumn({ name: 'user_id' })
  public invitee: User;

  @Column({ name: 'is_closed', nullable: true })
  public isClosed: boolean;

  @BeforeInsert()
  public beforeInsert(): void {
    this.id = uuid.v1();
  }

}

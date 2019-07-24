import * as uuid from 'uuid';
import { IsNotEmpty } from 'class-validator';
import { BeforeInsert, Column, CreateDateColumn, DefaultNamingStrategy, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User, Game } from '../../db/entities';

@Entity()
export class Log extends DefaultNamingStrategy {
  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public type: string;

  @Column({ nullable: true })
  public text: string;

  @IsNotEmpty()
  @Column({ name: 'game_id' })
  public gameId: string;

  @IsNotEmpty()
  @Column({ name: 'user_id' })
  public userId: string;

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @ManyToOne(type => Game, game => game.logs)
  @JoinColumn({ name: 'game_id' })
  public game: Game;

  @IsNotEmpty()
  @ManyToOne(type => User, user => user.createdLogs)
  @JoinColumn({ name: 'user_id' })
  public createdBy: User;

  @BeforeInsert()
  public beforeInsert(): void {
    this.id = uuid.v1();
  }

  public toString(): string {
    return `${this.type}`;
  }
}

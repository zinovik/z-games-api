import { IsNotEmpty } from 'class-validator';
import {
  Column, CreateDateColumn, DefaultNamingStrategy, Entity, JoinColumn, ManyToOne, PrimaryColumn,
} from 'typeorm';

import { Game } from '../../db/entities/game.entity';
import { User } from '../../db/entities/user.entity';

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
  @ManyToOne(type => User, user => user.logs)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  public toString(): string {
    return `${this.type}`;
  }

}

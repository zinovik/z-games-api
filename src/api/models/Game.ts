import { Exclude } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import {
    Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, Unique, UpdateDateColumn
} from 'typeorm';

import { Log } from './Log';

@Entity()
@Unique(['email'])
export class Game {

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

  @IsNotEmpty()
  @Column()
  @Exclude({ toPlainOnly: true })
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

}

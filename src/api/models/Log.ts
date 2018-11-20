import { IsNotEmpty } from 'class-validator';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { User } from './User';

@Entity()
export class Log {

  @PrimaryColumn('uuid')
  public id: string;

  @IsNotEmpty()
  @Column()
  public type: string;

  @IsNotEmpty()
  @Column()
  public text: string;

  @IsNotEmpty()
  @Column({
    name: 'user_id',
    nullable: true,
  })
  public userId: string;

  @IsNotEmpty()
  @Column()
  public game: string; // TODO: Game relation

  @IsNotEmpty()
  @CreateDateColumn({ name: 'created_at' })
  public createdAt: Date;

  @IsNotEmpty()
  @ManyToOne(type => User, user => user.logs)
  @JoinColumn({ name: 'user_id' })
  public user: User;

  public toString(): string {
    return `${this.text}`;
  }

}

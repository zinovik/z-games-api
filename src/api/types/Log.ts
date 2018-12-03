import { Field, ID, ObjectType } from 'type-graphql';

import { User } from './User';

@ObjectType({
  description: 'Log object.',
})
export class Log {

  @Field(type => ID)
  public id: string;

  @Field({
    description: 'Text of the log.',
  })
  public text: string;

  @Field(type => User, {
    nullable: true,
  })
  public owner: User;

}

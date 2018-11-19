import { Field, InputType } from 'type-graphql';

import { Log } from '../Log';

@InputType()
export class LogInput implements Partial<Log> {

    @Field()
    public text: string;

}

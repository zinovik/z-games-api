import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1542898809409 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL, "first_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "username" character varying, "is_confirmed" boolean, "provider" character varying, "avatar" character varying, "games_played" integer NOT NULL, "games_won" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "opened_game" uuid, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "log" ("id" uuid NOT NULL, "type" character varying NOT NULL, "text" character varying, "game_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_350604cbdf991d5930d9e618fbd" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "game" ("id" uuid NOT NULL, "name" character varying NOT NULL, "state" integer NOT NULL, "players_max" integer NOT NULL, "players_min" integer NOT NULL, "game_info" character varying NOT NULL, "is_private" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "user_current_game_to_game_players" ("userId" uuid NOT NULL, "gameId" uuid NOT NULL, CONSTRAINT "PK_eb935cda2252c560d37658157d4" PRIMARY KEY ("userId", "gameId"))`);
    await queryRunner.query(`CREATE TABLE "user_current_move_to_game_next_players" ("userId" uuid NOT NULL, "gameId" uuid NOT NULL, CONSTRAINT "PK_d78c4b59bd52b287c4d68d760fc" PRIMARY KEY ("userId", "gameId"))`);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_60de0edde66018934b37d5ac7f1" FOREIGN KEY ("opened_game") REFERENCES "game"("id")`);
    await queryRunner.query(`ALTER TABLE "log" ADD CONSTRAINT "FK_5d390dc444e2993952dd12d4ccf" FOREIGN KEY ("game_id") REFERENCES "game"("id")`);
    await queryRunner.query(`ALTER TABLE "log" ADD CONSTRAINT "FK_0d5473a41a198fd20e7920889b0" FOREIGN KEY ("user_id") REFERENCES "user"("id")`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" ADD CONSTRAINT "FK_befce92454a4eaed207a6b7e286" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" ADD CONSTRAINT "FK_19ec66573818297b496b607ad3e" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" ADD CONSTRAINT "FK_7396b73acfc1b582fe9ed3d455b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" ADD CONSTRAINT "FK_12a7a3ac086cd0d78d7881ca694" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" DROP CONSTRAINT "FK_12a7a3ac086cd0d78d7881ca694"`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" DROP CONSTRAINT "FK_7396b73acfc1b582fe9ed3d455b"`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" DROP CONSTRAINT "FK_19ec66573818297b496b607ad3e"`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" DROP CONSTRAINT "FK_befce92454a4eaed207a6b7e286"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_0d5473a41a198fd20e7920889b0"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_5d390dc444e2993952dd12d4ccf"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_60de0edde66018934b37d5ac7f1"`);
    await queryRunner.query(`DROP TABLE "user_current_move_to_game_next_players"`);
    await queryRunner.query(`DROP TABLE "user_current_game_to_game_players"`);
    await queryRunner.query(`DROP TABLE "game"`);
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }

}

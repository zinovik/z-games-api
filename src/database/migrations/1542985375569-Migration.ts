import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1542985375569 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL, "first_name" character varying, "last_name" character varying, "email" character varying NOT NULL, "password" character varying NOT NULL, "username" character varying, "is_confirmed" boolean, "provider" character varying, "avatar" character varying, "games_played" integer NOT NULL, "games_won" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "opened_game" integer, CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "log" ("id" uuid NOT NULL, "type" character varying NOT NULL, "text" character varying, "game_id" integer NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_350604cbdf991d5930d9e618fbd" PRIMARY KEY ("id"))`);
    await queryRunner.query(`CREATE TABLE "game" ("id" uuid NOT NULL, "number" SERIAL NOT NULL, "name" character varying NOT NULL, "state" integer NOT NULL, "players_max" integer NOT NULL, "players_min" integer NOT NULL, "game_info" character varying NOT NULL, "is_private" boolean NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_88d6852a8937d115b37be9941b9" UNIQUE ("number"), CONSTRAINT "PK_dc65db74bd1b9dad5eff433269a" PRIMARY KEY ("id", "number"))`);
    await queryRunner.query(`CREATE TABLE "user_current_game_to_game_players" ("gameId" uuid NOT NULL, "gameNumber" integer NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_c65697bf8af40602ccdd7dec549" PRIMARY KEY ("gameId", "gameNumber", "userId"))`);
    await queryRunner.query(`CREATE TABLE "user_current_watch_to_game_watchers" ("gameId" uuid NOT NULL, "gameNumber" integer NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_039143f998cc16de15bce1e87df" PRIMARY KEY ("gameId", "gameNumber", "userId"))`);
    await queryRunner.query(`CREATE TABLE "user_current_move_to_game_next_players" ("gameId" uuid NOT NULL, "gameNumber" integer NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_d005e72a537cbaf4d49f37b5dc8" PRIMARY KEY ("gameId", "gameNumber", "userId"))`);
    await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_86051a354511e91cab2fcfaa32f" FOREIGN KEY ("opened_game", "opened_game") REFERENCES "game"("id","number")`);
    await queryRunner.query(`ALTER TABLE "log" ADD CONSTRAINT "FK_dd35f07970221bbbbb41cdfe8de" FOREIGN KEY ("game_id", "game_id") REFERENCES "game"("id","number")`);
    await queryRunner.query(`ALTER TABLE "log" ADD CONSTRAINT "FK_0d5473a41a198fd20e7920889b0" FOREIGN KEY ("user_id") REFERENCES "user"("id")`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" ADD CONSTRAINT "FK_62edade31801b4bf0d947a7b90c" FOREIGN KEY ("gameId", "gameNumber") REFERENCES "game"("id","number") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" ADD CONSTRAINT "FK_befce92454a4eaed207a6b7e286" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_watch_to_game_watchers" ADD CONSTRAINT "FK_c7e5c7d979e522942349ae4baa0" FOREIGN KEY ("gameId", "gameNumber") REFERENCES "game"("id","number") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_watch_to_game_watchers" ADD CONSTRAINT "FK_f83832ceed52bf7283d5a0f9a7f" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" ADD CONSTRAINT "FK_a58c635236007c61b0ae2632cbe" FOREIGN KEY ("gameId", "gameNumber") REFERENCES "game"("id","number") ON DELETE CASCADE`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" ADD CONSTRAINT "FK_7396b73acfc1b582fe9ed3d455b" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE`);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" DROP CONSTRAINT "FK_7396b73acfc1b582fe9ed3d455b"`);
    await queryRunner.query(`ALTER TABLE "user_current_move_to_game_next_players" DROP CONSTRAINT "FK_a58c635236007c61b0ae2632cbe"`);
    await queryRunner.query(`ALTER TABLE "user_current_watch_to_game_watchers" DROP CONSTRAINT "FK_f83832ceed52bf7283d5a0f9a7f"`);
    await queryRunner.query(`ALTER TABLE "user_current_watch_to_game_watchers" DROP CONSTRAINT "FK_c7e5c7d979e522942349ae4baa0"`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" DROP CONSTRAINT "FK_befce92454a4eaed207a6b7e286"`);
    await queryRunner.query(`ALTER TABLE "user_current_game_to_game_players" DROP CONSTRAINT "FK_62edade31801b4bf0d947a7b90c"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_0d5473a41a198fd20e7920889b0"`);
    await queryRunner.query(`ALTER TABLE "log" DROP CONSTRAINT "FK_dd35f07970221bbbbb41cdfe8de"`);
    await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_86051a354511e91cab2fcfaa32f"`);
    await queryRunner.query(`DROP TABLE "user_current_move_to_game_next_players"`);
    await queryRunner.query(`DROP TABLE "user_current_watch_to_game_watchers"`);
    await queryRunner.query(`DROP TABLE "user_current_game_to_game_players"`);
    await queryRunner.query(`DROP TABLE "game"`);
    await queryRunner.query(`DROP TABLE "log"`);
    await queryRunner.query(`DROP TABLE "user"`);
  }

}

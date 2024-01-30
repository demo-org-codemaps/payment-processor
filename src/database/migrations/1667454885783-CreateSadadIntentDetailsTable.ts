import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSadadIntentDetailsTable1667454885783 implements MigrationInterface {
  name = 'CreateSadadIntentDetailsTable1667454885783';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sadad_intent_details\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`bill_number\` varchar(36) NOT NULL, \`sadad_number\` varchar(36) NOT NULL, \`payment_intent_id\` varchar(36) NULL, UNIQUE INDEX \`IDX_2942f09a2d5875d5d7377a1b22\` (\`bill_number\`), UNIQUE INDEX \`REL_76ad6553d47322d6206cb33e44\` (\`payment_intent_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    );
    await queryRunner.query(
      `ALTER TABLE \`sadad_intent_details\` ADD CONSTRAINT \`FK_76ad6553d47322d6206cb33e444\` FOREIGN KEY (\`payment_intent_id\`) REFERENCES \`payment_intent_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`sadad_intent_details\` DROP FOREIGN KEY \`FK_76ad6553d47322d6206cb33e444\``);
    await queryRunner.query(`DROP INDEX \`REL_76ad6553d47322d6206cb33e44\` ON \`sadad_intent_details\``);
    await queryRunner.query(`DROP INDEX \`IDX_2942f09a2d5875d5d7377a1b22\` ON \`sadad_intent_details\``);
    await queryRunner.query(`DROP TABLE \`sadad_intent_details\``);
  }
}

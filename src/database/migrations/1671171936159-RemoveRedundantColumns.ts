import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveRedundantColumns1671171936159 implements MigrationInterface {
  name = 'RemoveRedundantColumns1671171936159';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` DROP COLUMN \`billNumber\``);
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` DROP COLUMN \`ref_3p\``);
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` DROP COLUMN \`payload\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` ADD \`payload\` text NULL`);
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` ADD \`ref_3p\` varchar(255) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` ADD \`billNumber\` varchar(255) NOT NULL`);
  }
}

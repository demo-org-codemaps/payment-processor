import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveImpactColumnFromPaymentIntentEntityTable1667414112632 implements MigrationInterface {
  name = 'RemoveImpactColumnFromPaymentIntentEntityTable1667414112632';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` DROP COLUMN \`impact\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`payment_intent_entity\` ADD \`impact\` enum ('IN', 'OUT') NOT NULL`);
  }
}

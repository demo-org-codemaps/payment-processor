import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntentTable1661324939763 implements MigrationInterface {
  name = 'IntentTable1661324939763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`payment_intent_entity\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`impact\` enum ('IN', 'OUT') NOT NULL, \`amount\` bigint NOT NULL, \`currency\` varchar(255) NOT NULL DEFAULT 'SAR', \`payment_method\` varchar(255) NOT NULL DEFAULT 'SADAD', \`account\` varchar(255) NOT NULL, \`state\` enum ('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING', \`idempotency_key\` varchar(255) NOT NULL, \`billNumber\` varchar(255) NOT NULL, \`ref_3p\` varchar(255) NOT NULL, \`payload\` text NULL, UNIQUE INDEX \`IDX_8cb45f81976b191f2ff5851f1c\` (\`idempotency_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_8cb45f81976b191f2ff5851f1c\` ON \`payment_intent_entity\``);
    await queryRunner.query(`DROP TABLE \`payment_intent_entity\``);
  }
}

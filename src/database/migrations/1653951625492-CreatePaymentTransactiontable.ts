import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePaymentTransactiontable1653951625492 implements MigrationInterface {
  name = 'CreatePaymentTransactiontable1653951625492';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`payment_status_entity\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`payment_action\` enum ('HOLD', 'RELEASE', 'CHARGE', 'ROLLBACK') NOT NULL, \`impact\` enum ('IN', 'OUT') NOT NULL, \`amount\` bigint NOT NULL, \`currency\` varchar(255) NOT NULL DEFAULT 'PKR', \`payment_method\` varchar(255) NOT NULL DEFAULT 'WALLET', \`account\` varchar(255) NOT NULL, \`state\` enum ('PENDING', 'COMPLETED') NOT NULL DEFAULT 'PENDING', \`idempotency_key\` varchar(255) NOT NULL, UNIQUE INDEX \`IDX_67c8ca73f8e781cd56c2c33051\` (\`idempotency_key\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_67c8ca73f8e781cd56c2c33051\` ON \`payment_status_entity\``);
    await queryRunner.query(`DROP TABLE \`payment_status_entity\``);
  }
}

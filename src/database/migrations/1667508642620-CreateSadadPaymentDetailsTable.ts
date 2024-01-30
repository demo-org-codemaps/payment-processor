import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSadadPaymentDetailsTable1667508642620 implements MigrationInterface {
  name = 'CreateSadadPaymentDetailsTable1667508642620';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`sadad_payment_details\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`sadad_payment_id\` varchar(100) NOT NULL, \`payload\` text NULL, \`payment_status_id\` varchar(36) NULL, UNIQUE INDEX \`REL_35539fd0cbcc594e8bb456a685\` (\`payment_status_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    );
    await queryRunner.query(
      `ALTER TABLE \`sadad_payment_details\` ADD CONSTRAINT \`FK_35539fd0cbcc594e8bb456a685e\` FOREIGN KEY (\`payment_status_id\`) REFERENCES \`payment_status_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`sadad_payment_details\` DROP FOREIGN KEY \`FK_35539fd0cbcc594e8bb456a685e\``
    );
    await queryRunner.query(`DROP INDEX \`REL_35539fd0cbcc594e8bb456a685\` ON \`sadad_payment_details\``);
    await queryRunner.query(`DROP TABLE \`sadad_payment_details\``);
  }
}

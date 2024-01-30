import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEasypaisaIntegrationTables1667482548793 implements MigrationInterface {
  name = 'CreateEasypaisaIntegrationTables1667482548793';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`easypaisa_intent_details\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`bill_number\` varchar(255) NOT NULL, \`payment_intent_id\` varchar(36) NULL, UNIQUE INDEX \`REL_e4579543d904c82dc95f533345\` (\`payment_intent_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    );
    await queryRunner.query(
      `CREATE TABLE \`easypaisa_payment_details\` (\`id\` varchar(36) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`version\` int NOT NULL, \`transaction_auth_id\` varchar(255) NOT NULL, \`transaction_date\` varchar(255) NOT NULL, \`transaction_time\` varchar(255) NOT NULL, \`transaction_id\` varchar(255) NOT NULL, \`payment_status_id\` varchar(36) NULL, UNIQUE INDEX \`REL_54253afe10b581bd8c628a67c6\` (\`payment_status_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB DEFAULT CHARSET=latin1`
    );
    await queryRunner.query(
      `ALTER TABLE \`easypaisa_intent_details\` ADD CONSTRAINT \`FK_e4579543d904c82dc95f533345a\` FOREIGN KEY (\`payment_intent_id\`) REFERENCES \`payment_intent_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`easypaisa_payment_details\` ADD CONSTRAINT \`FK_54253afe10b581bd8c628a67c62\` FOREIGN KEY (\`payment_status_id\`) REFERENCES \`payment_status_entity\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`easypaisa_payment_details\` DROP FOREIGN KEY \`FK_54253afe10b581bd8c628a67c62\``
    );
    await queryRunner.query(
      `ALTER TABLE \`easypaisa_intent_details\` DROP FOREIGN KEY \`FK_e4579543d904c82dc95f533345a\``
    );
    await queryRunner.query(`DROP INDEX \`REL_54253afe10b581bd8c628a67c6\` ON \`easypaisa_payment_details\``);
    await queryRunner.query(`DROP TABLE \`easypaisa_payment_details\``);
    await queryRunner.query(`DROP INDEX \`REL_e4579543d904c82dc95f533345\` ON \`easypaisa_intent_details\``);
    await queryRunner.query(`DROP TABLE \`easypaisa_intent_details\``);
  }
}

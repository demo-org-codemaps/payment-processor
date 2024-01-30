import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDataIntoSadadIntentDetails1667557341822 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO sadad_intent_details (id, version, bill_number, sadad_number, payment_intent_id) SELECT uuid() AS id, '1' as version, billNumber AS bill_number, ref_3p AS sadad_number, id AS payment_intent_id FROM payment_intent_entity;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE sadad_intent_details;`);
  }
}

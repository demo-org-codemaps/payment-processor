import { MigrationInterface, QueryRunner } from 'typeorm';

export class InsertDataIntoSadadPaymentDetails1667557623840 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO sadad_payment_details (id, version, sadad_payment_id, payload, payment_status_id) SELECT uuid() AS id, '1' as version, JSON_EXTRACT(JSON_UNQUOTE(p.payload), '$.sadadPaymentId') AS sadad_payment_id, p.payload AS payload, s.id AS payment_status_id FROM payment_intent_entity AS p INNER JOIN payment_status_entity s ON p.idempotency_key = s.idempotency_key;`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`TRUNCATE sadad_payment_details;`);
  }
}

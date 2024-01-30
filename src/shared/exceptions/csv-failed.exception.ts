import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

export class CSVFailedError {
  rowNum: number;
  row: string;
  validationErrors: ValidationError[];

  constructor(rowNum: number, row: string, validationErrors: ValidationError[]) {
    this.row = row;
    this.rowNum = rowNum;
    this.validationErrors = validationErrors;
  }
}

export class CSVFailedExceptions extends BadRequestException {
  errors: CSVFailedError[];

  constructor(errors: CSVFailedError[]) {
    super(errors);
    this.errors = errors;
  }
}

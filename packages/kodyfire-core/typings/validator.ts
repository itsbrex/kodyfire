export interface IValidator {
  rules: any;
  errors: any;
  validate(data: any): boolean;
}

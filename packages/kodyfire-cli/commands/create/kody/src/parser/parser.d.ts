import { IParser, IValidator } from 'kodyfire-core';
export declare class Parser implements IParser {
  validator: IValidator;
  requiresExtract: boolean;
  requiresTansform: boolean;
  requiresLoad: boolean;
  data: any;
  constructor(validator: IValidator);
  reader(source: string): any;
  parse(data: any): any;
  validate: (data: any) => boolean;
  extractor: any;
  transformer: () => string;
  loader: () => any;
  readfile(filepath: any): any;
  write(filepath: any, data: any): void;
}
//# sourceMappingURL=parser.d.ts.map

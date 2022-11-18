import { IConcept, ITechnology, Source, Technology, TemplateSchema } from 'kodyfire-core';
import { Engine } from './engine';
export declare class Concept implements IConcept {
    name: string;
    defaultAction: string;
    source?: Source | undefined;
    template: TemplateSchema;
    outputDir: string;
    technology: Technology;
    engine: Engine;
    constructor(concept: Partial<IConcept>, technology: ITechnology);
    getTemplatesPath(): string;
    generate(_data: any): void;
    underscorize(word: any): any;
}

/// <reference types="node" />
import EventEmitter from 'events';
import { BaseKody, IGenerator, IKody, IParser, ITechnology } from 'kodyfire-core';
export declare class Kody extends BaseKody implements IKody {
    [x: string]: any;
    parser: IParser;
    generator: IGenerator;
    technology: ITechnology;
    events: EventEmitter;
    constructor(params: any);
    generate(_content: any): void;
    parse(content: any): any;
    read(source: any): any;
    write(source: string, content: any): any;
    get errors(): any;
    get data(): any;
    whereami(): string;
    whoami(): string;
}

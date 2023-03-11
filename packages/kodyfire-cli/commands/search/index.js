"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Command } = require('commander');
const action_1 = require("./action");
module.exports = (program) => {
    program
        .command('search')
        .alias('s')
        .argument('[keywords...]', 'search kodyfire packages using keywords')
        .description('search kodyfire packages from npm registry')
        .action((keywords, _opt) => __awaiter(void 0, void 0, void 0, function* () {
        _opt.keywords = keywords;
        return yield (0, action_1.action)(_opt);
    }));
};
exports.default = action_1.action;
//# sourceMappingURL=index.js.map
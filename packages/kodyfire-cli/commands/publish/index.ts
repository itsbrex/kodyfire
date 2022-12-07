import { existsSync } from 'fs';
import { Package } from 'kodyfire-core';
const chalk = require('chalk');
const boxen = require('boxen');
const { Command } = require('commander');
const { promises: fs } = require('fs');
const path = require('path');

const action = async (args: any) => {
  const kodies = await Package.getInstalledKodies();

  if (kodies.length == 0) {
    const kody = chalk.greenBright(chalk.bold('kody'));
    const message = `😞 No ${kody} installed yet.\nInstall a ${kody} to become a Ninja 🚀🚀🚀`;
    console.log(
      boxen(message, {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'yellow',
        borderStyle: 'round',
      })
    );
  } else {
    if (kodies.find(kody => kody.name == args.name)) {
      const target = `./.kody/${args.name}/templates`;
      const sources = [
        `./node_modules/${args.name}/src/concepts/templates`,
        `./node_modules/${args.name}/src/templates`,
      ];
      //for each source folder if it exists copy it to the target folder
      for (const source of sources) {
        if (existsSync(source)) {
          await copyDir(source, target);
        }
      }
      //copy the assets.json file
      if (existsSync(`./node_modules/${args.name}/src/assets.json`)) {
        await fs.copyFile(
          `./node_modules/${args.name}/src/assets.json`,
          `./.kody/${args.name}/assets.json`
        );
      }

      //copy the schema.js file
      if (existsSync(`./node_modules/${args.name}/build/schema.js`)) {
        await fs.copyFile(
          `./node_modules/${args.name}/src/schema.ts`,
          `./.kody/${args.name}/schema.ts`
        );
      }
    } else {
      console.log('😞 Kody not found');
    }
  }
};

async function copyDir(src: any, dest: any) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDir(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
  }
}

module.exports = (program: typeof Command) => {
  program
    .command('publish')
    .requiredOption('-n,--name <kody>', 'kody name to publish')
    .description(
      'Publish the templates of the kody along with the assets.json and schema.ts files'
    )
    .action(async (_opt: any) => action(_opt));
};

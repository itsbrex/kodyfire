// import { $ } from "zx";
import { capitalize } from 'kodyfire-core';
import { join } from 'path';
import { fs } from 'zx';
import { Action as InitAction } from './../init/action';
const prompts = require('prompts');
const boxen = require('boxen');

export class Action {
  static kody: any;
  static concept: any;
  static properties: any;
  static isCanceled = false;

  static async onCancel(_prompt: any) {
    this.isCanceled = true;
    return true;
  }
  static async getDependencyConcepts(dependency: string) {
    const dep = await InitAction.getDependencyConcepts(dependency);
    return dep?.concepts;
  }
  // @todo: refactor into a Base Action class. used by init/action.ts
  static async getPackageDependencies(rootDir = process.cwd()): Promise<any> {
    const packageJsonFile = await fs.readFile(
      join(rootDir, 'package.json'),
      'utf8'
    );
    const packageJson = JSON.parse(packageJsonFile);
    const name = packageJson.name;
    let dependencies: string[] = [];
    if (
      packageJson.dependencies &&
      Object.keys(packageJson.dependencies).length > 0
    ) {
      dependencies = Object.keys(packageJson.dependencies);
    }

    if (
      packageJson.devDependencies &&
      Object.keys(packageJson.devDependencies).length > 0
    ) {
      dependencies = dependencies.concat(
        Object.keys(packageJson.devDependencies)
      );
    }

    dependencies = dependencies.filter(dep => dep.includes('-kodyfire'));
    return { name, dependencies };
  }

  static async prompter(): Promise<void | any> {
    (async () => {
      if (!this.kody) {
        const kodyQuestion = await this.getKodyQuestion();
        if (!kodyQuestion) {
          this.displayMessage(
            'No kodies installed. Please install at least a kody package first.'
          );
          process.exit(1);
        }
        const { kody } = await prompts(kodyQuestion);
        this.kody = kody;
      }
      if (!this.concept) {
        // set concept
        const conceptQuestion = await this.getConceptQuestion();
        if (!conceptQuestion) {
          this.displayMessage(
            'No concepts selected. Please select a concept to proceed.'
          );
          process.exit(1);
        }
        const { concept } = await prompts(conceptQuestion);
        this.concept = concept;
      }
      if (!this.properties) {
        // set properties
        const currentConcept = await this.getCurrentConcept();
        const answers = await this.getPropertiesAnswers(currentConcept);

        if (answers) {
          // @todo validate answers
          this.addConcept(this.kody, this.concept, answers);
        }
      }
    })();
  }
  static async getCurrentConcept() {
    const concepts = await this.getDependencyConcepts(this.kody);
    return concepts[this.concept];
  }

  static async getPropertiesAnswers(concept: any) {
    const schemaDefinition = this.getSchemaDefinition(this.kody);
    const conceptNames = Object.keys(concept || {});

    if (conceptNames.length == 0) {
      return [];
    }
    const answers: any = {};
    for (let i = 0; i < conceptNames.length; i++) {
      const currentConcept = concept[conceptNames[i]];
      if (
        currentConcept.type !== 'array' &&
        currentConcept.items?.type !== 'object'
      ) {
        const question = await this.conceptToQuestion(
          conceptNames[i],
          concept[conceptNames[i]],
          schemaDefinition,
          false,
          false,
          `${conceptNames[i]}`,
          true
        );
        if (typeof question.value != 'undefined') {
          answers[conceptNames[i]] = question.value;
        } else if (question) {
          const answer = await prompts(question);
          answers[conceptNames[i]] = answer.value;
        }
      }
      if (
        currentConcept.type === 'array'
        // && currentConcept.items?.type === 'object'
      ) {
        const question = {
          type: 'confirm',
          name: 'value',
          message: `Would you like to add ${conceptNames[i]}?`,
          initial: true,
        };
        const { value } = await prompts(question);
        if (value) {
          let addMore = true;
          while (addMore) {
            let childConcept;
            if (currentConcept.items?.type !== 'string') {
              childConcept = await this.getPropertiesAnswers(
                currentConcept.items.properties
              );
            } else {
              const conceptQuestion = await this.conceptToQuestion(
                conceptNames[i],
                currentConcept.items
              );
              const currentAnswer = await prompts(conceptQuestion);
              childConcept = currentAnswer[conceptNames[i]];
            }
            if (answers[conceptNames[i]]) {
              answers[conceptNames[i]].push(childConcept);
            } else {
              answers[conceptNames[i]] = [childConcept];
            }
            const question = {
              type: 'confirm',
              name: 'value',
              message: `Would you like to add more ${conceptNames[i]}?`,
              initial: true,
            };
            const { value } = await prompts(question);
            if (!value) {
              addMore = false;
            }
          }
        }
      }
    }
    return answers;
  }
  static async getConceptQuestion() {
    const concepts = await this.getDependencyConcepts(this.kody);
    const conceptNames = Object.keys(concepts || {});
    if (conceptNames.length == 0) {
      return false;
    }
    const question = {
      type: conceptNames.length < 4 ? 'select' : 'autocomplete',
      name: 'concept',
      message: `Select the concept you want to add?`,
      choices: conceptNames.map((concept: string) => ({
        title: capitalize(concept),
        value: concept,
      })),
    };
    return question;
  }
  static async getKodyQuestion() {
    const { dependencies } = await this.getPackageDependencies();
    if (dependencies.length == 0) {
      return false;
    }
    const question = {
      type: 'select',
      name: 'kody',
      message: `Select the kody package?`,
      choices: dependencies.map((dep: string) => ({
        title: capitalize(dep.replace('-kodyfire', '')),
        value: dep,
      })),
    };
    return question;
  }
  static displayMessage(message: string) {
    console.log(
      boxen(message, {
        padding: 1,
        margin: 1,
        align: 'center',
        borderColor: 'yellow',
        borderStyle: 'round',
      })
    );
  }
  static async execute() {
    try {
      await this.prompter();
    } catch (error: any) {
      this.displayMessage(error.message);
    }
  }

  static async addConcept(
    dependency: string,
    concept: string,
    data: any,
    rootDir: string = process.cwd()
  ) {
    try {
      let content = this.getSchemaDefinition(dependency, rootDir);
      if (content[concept]) {
        content[concept] = [...content[concept], data];
      } else {
        content[concept] = [data];
      }
      content = JSON.stringify(content, null, '\t');
      fs.writeFileSync(
        join(rootDir, `kody-${dependency.replace('-kodyfire', '')}.json`),
        content
      );
    } catch (error: any) {
      this.displayMessage(error.message);
    }
  }
  static async addConceptProperty(
    dependency: string,
    concept: string,
    property: string,
    data: any,
    rootDir: string = process.cwd()
  ) {
    try {
      let content = this.getSchemaDefinition(dependency, rootDir);
      const currentConcept = data['concept'];
      // tweak the data for array for now
      delete data['concept'];
      data = data[property] ? data[property] : data;
      if (typeof content[concept][currentConcept][property] !== 'undefined') {
        content[concept][currentConcept][property] = [
          ...content[concept][currentConcept][property],
          data,
        ];
      } else {
        content[concept][currentConcept][property] = [data];
      }
      content = JSON.stringify(content, null, '\t');
      fs.writeFileSync(
        join(rootDir, `kody-${dependency.replace('-kodyfire', '')}.json`),
        content
      );
    } catch (error: any) {
      this.displayMessage(error.message);
    }
  }
  static getSchemaDefinition(dependency: string, rootDir = process.cwd()) {
    const path = join(
      rootDir,
      `kody-${dependency.replace('-kodyfire', '')}.json`
    );
    if (!fs.existsSync(path)) {
      return false;
    }
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  }
  static async conceptToQuestion(
    name: string,
    concept: {
      description: string;
      default?: any;
      type?: string;
      enum?: any;
      items?: any;
    },
    _concepts: any = {},
    message: boolean | string = false,
    _useIndex = false,
    label = '',
    useValueAsName = false
  ): Promise<any | void> {
    message = concept.description || message;
    label = label || name;
    if (typeof concept.enum !== 'undefined') {
      if (concept.enum.length == 1) return { value: concept.enum[0] }; // if only one option, return it as default answer
      const choices = concept.enum.map((c: any) => ({ title: c, value: c }));
      return {
        type: choices.length < 5 ? 'select' : 'autocomplete',
        name: useValueAsName ? 'value' : name,
        message: message || `Select the value for ${label}?`,
        ...(concept.description && { description: concept.description }),
        choices: choices,
      };
    }
    if (concept.type === 'boolean') {
      return {
        type: 'toggle',
        name: useValueAsName ? 'value' : name,
        ...(concept.default && { initial: concept.default }),
        initial: concept.default,
        ...(concept.description && { description: concept.description }),
        message: message || `What is the value for ${label}?`,
        active: 'Yes',
        inactive: 'No',
      };
    }
    if (concept.type === 'string') {
      return {
        type: 'text',
        name: useValueAsName ? 'value' : name,
        ...(concept.default && { initial: concept.default }),
        ...(concept.description && { description: concept.description }),
        message: message || `What is the value for ${label}?`,
      };
    }
    if (concept.type === 'number') {
      return {
        type: 'number',
        name: useValueAsName ? 'value' : name,
        ...(concept.default && { initial: concept.default }),
        ...(concept.description && { description: concept.description }),
        message: message || `What is the value for ${label}?`,
      };
    }
    if (concept.type === 'array') {
      if (concept.items.type == 'string') {
        return {
          type: 'text',
          name: useValueAsName ? 'value' : name,
          ...(concept.description && { description: concept.description }),
          message: message || `What is the value for ${label}?`,
        };
      }
    }
    if (concept.type === 'boolean') {
      return {
        type: 'select',
        name: useValueAsName ? 'value' : name,
        ...(concept.description && { description: concept.description }),
        message: message || `What is the value for ${label}?`,
        ...(concept.default && { initial: concept.default }),
        choices: [
          { title: 'true', value: true },
          { title: 'false', value: false },
        ],
      };
    }
    return false;
  }
}

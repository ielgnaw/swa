/**
 * @file init 命令
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join, basename} from 'path';
import {readdirSync, existsSync, statSync} from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import rimraf from 'rimraf';
import user from '../git-user';
import meta from '../meta';
import generate, {setDefault} from '../generate';

/**
 * inquirer.prompt then function
 *
 * @param {string} projectName 项目名称
 * @param {string} registry npm registry url
 * @param {boolean} inCurrent 是否在当前目录直接创建项目
 */
const inquirerPromptDone = (projectName, registry, inCurrent) => {
    const curPrompts = Object.assign({}, meta.PROMPTS);
    setDefault(curPrompts, 'name', projectName);
    setDefault(curPrompts, 'author', user());
    generate(curPrompts, projectName, registry, inCurrent);
};

export default {
    command: ['init [directory]'],
    describe: 'Initialize project in the current directory or specified directory',
    builder: {
        // r: {
        //     desc: 'Set NPM Registry URL',
        //     alias: 'registry',
        //     default: 'http://registry.npmjs.org'
        // }
    },
    handler: argv => {
        const {registry, directory} = argv;
        if (!registry.trim()) {
            console.log(chalk.red('err: Please set a valid NPM Registry URL.'));
            process.exit(1);
        }
        if (!directory || directory === '.') {
            inquirer.prompt([{
                type: 'confirm',
                message: !readdirSync('.', 'utf8').length
                    ? 'Generate project in current directory'
                    : 'The current directory is not empty, do you want to overwrite',
                name: 'ok'
            }]).then(answers => {
                if (!answers.ok) {
                    return;
                }
                inquirerPromptDone(basename(process.cwd()), registry, true);
            });
        }
        else {
            if (existsSync(directory) && statSync(directory).isDirectory()) {
                inquirer.prompt([{
                    type: 'confirm',
                    message: 'Target directory exists. Continue?',
                    name: 'ok',
                }]).then(answers => {
                    if (!answers.ok) {
                        return;
                    }
                    rimraf.sync(join('.', directory));
                    inquirerPromptDone(directory, registry);
                });
                return;
            }
            else {
                inquirerPromptDone(directory, registry);
            }
        }
    }
};

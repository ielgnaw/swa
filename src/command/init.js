/**
 * @file init 命令
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join, basename} from 'path';
import {readdirSync, existsSync, statSync} from 'fs';
import inquirer from 'inquirer';
import BottomBar from 'inquirer/lib/ui/bottom-bar';
import async from 'async';
import Metalsmith from 'metalsmith';
import rimraf from 'rimraf';
import consolidate from 'consolidate';
import user from '../git-user';
import npmInstall from '../npm-install';

const RENDER = consolidate.handlebars.render;

/**
 * 提示问题
 *
 * @type {Object}
 */
const PROMPTS = {
    name: {
        type: 'input',
        message: 'Project name'
    },
    description: {
        type: 'input',
        message: 'Project description',
        default: 'Project description'
    },
    author: {
        type: 'input',
        message: 'Author'
    }
};

/**
 * 设置提示问题的默认值
 *
 * @param {Object} prompts 提示问题
 * @param {string} key 提示问题的 key
 * @param {string} val 提示问题的 value
 */
const setDefault = (prompts, key, val) => {
    if (!prompts[key] || typeof prompts[key] !== 'object') {
        prompts[key] = {
            type: 'input',
            default: val
        };
    }
    else {
        prompts[key]['default'] = val;
    }
};

/**
 * metalsmith plugin repl
 *
 * @param {Object} curPrompts 当前的提示问题
 */
const ask = curPrompts => {
    return (files, metalsmith, done) => {
        const metadata = metalsmith.metadata();

        async.eachSeries(Object.keys(curPrompts), (key, next) => {
            run(metadata, key, curPrompts[key], next);
        }, done);

        function run(data, key, prompt, done) {
            let promptDefault = prompt.default;
            if (typeof prompt.default === 'function') {
                promptDefault = () => prompt.default.bind(this)(data);
            }

            inquirer.prompt([{
                type: prompt.type,
                name: key,
                message: prompt.message || prompt.label || key,
                default: promptDefault,
                choices: prompt.choices || [],
                validate: prompt.validate || (() => true)
            }]).then(answers => {
                if (Array.isArray(answers[key])) {
                    data[key] = {};
                    answers[key].forEach(multiChoiceAnswer => {
                        data[key][multiChoiceAnswer] = true;
                    });
                }
                else if (typeof answers[key] === 'string') {
                    data[key] = answers[key].replace(/"/g, '\\"');
                }
                else {
                    data[key] = answers[key];
                }

                done();
            });
        }
    };
};

/**
 * metalsmith plugin 渲染模板
 *
 * @param {Object} files files 对象
 * @param {Object} metalsmith metalsmith 实例对象
 * @param {Function} done 完成回调函数
 */
const renderTemplate = (files, metalsmith, done) => {
    const keys = Object.keys(files);
    const metadata = metalsmith.metadata();

    async.each(keys, run, done);

    function run(file, done) {
        var str = files[file].contents.toString();
        RENDER(str, metadata, (err, res) => {
            if (err) {
                return done(err);
            }
            files[file].contents = new Buffer(res);
            done();
        });
    }
};

/**
 * generate project
 *
 * @param {Object} curPrompts 当前的提示问题
 * @param {string} projectName 项目名称
 * @param {boolean} inCurrent 是否在当前目录直接创建项目
 */
const generate = (curPrompts, projectName, inCurrent) => {
    const dest = inCurrent ? '.' : projectName;
    const metalsmith = new Metalsmith(join(__dirname, '../template')).source('.');
    metalsmith
        .use(ask(curPrompts))
        .use(renderTemplate)
        .clean(false)
        .destination(join(process.cwd(), dest))
        .build(err => {
            if (err) {
                throw err;
            }
            const DEV_DEPENDENCIES = [
                'mocha33', 'chai'
                /*'babel-cli', 'babel-core', 'babel-preset-es2015', 'babel-preset-stage-2',
                'babel-istanbul', 'babel-plugin-add-module-exports', 'fecs', 'chai', 'mocha'*/
            ];
            process.chdir(dest);
            npmInstall(DEV_DEPENDENCIES, {saveDev: true}, () => {
                console.log('all deps install done');
            });
        });
};

/**
 * inquirer.prompt then function
 *
 * @param {string} projectName 项目名称
 * @param {boolean} inCurrent 是否在当前目录直接创建项目
 */
const inquirerPromptDone = (projectName, inCurrent) => {
    const curPrompts = Object.assign({}, PROMPTS);
    setDefault(curPrompts, 'name', projectName);
    setDefault(curPrompts, 'author', user());
    generate(curPrompts, projectName, inCurrent);
};

export default {
    command: ['init [directory]'],
    describe: 'Initialize project in the current directory or specified directory',
    builder: {},
    handler: argv => {
        let directory = argv.directory;
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
                inquirerPromptDone(basename(process.cwd()), true);
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
                    inquirerPromptDone(directory);
                });
                return;
            }
            else {
                inquirerPromptDone(directory);
            }
        }
    }
};

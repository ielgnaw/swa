/**
 * @file Description
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join} from 'path';
import inquirer from 'inquirer';
import async from 'async';
import Metalsmith from 'metalsmith';
import consolidate from 'consolidate';
import npmInstall from './npm-install';
import meta from './meta';

const RENDER = consolidate.handlebars.render;

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
            if (key === 'separator') {
                console.log(`\n---- ${prompt.message} set (Now we only support MySQL) ----`);
                return done();
            }
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
        const str = files[file].contents.toString();
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
 * 设置提示问题的默认值
 *
 * @param {Object} prompts 提示问题
 * @param {string} key 提示问题的 key
 * @param {string} val 提示问题的 value
 */
export function setDefault(prompts, key, val) {
    if (!prompts[key] || typeof prompts[key] !== 'object') {
        prompts[key] = {
            type: 'input',
            default: val
        };
    }
    else {
        prompts[key]['default'] = val;
    }
}

function filterFiles(files, metalsmith, done) {
    const metadata = metalsmith.metadata();
    if (!metadata.redis) {
        delete files['server/conf/redis.js'];
    }
    done();
}

/**
 * generate project
 *
 * @param {Object} curPrompts 当前的提示问题
 * @param {string} projectName 项目名称
 * @param {boolean} inCurrent 是否在当前目录直接创建项目
 */
export default function(curPrompts, projectName, inCurrent) {
    const dest = inCurrent ? '.' : projectName;
    const metalsmith = new Metalsmith(join(__dirname, './template')).source('.');
    metalsmith
        .use(ask(curPrompts))
        .use(filterFiles)
        .use(renderTemplate)
        .clean(false)
        .destination(join(process.cwd(), dest))
        .build(err => {
            if (err) {
                throw err;
            }
            // console.log(metalsmith.metadata());

            process.chdir(dest);

            npmInstall(meta.ALL_DEPENDENCIES, () => {
                console.log('all deps install done');
            });
        });
}

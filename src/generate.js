/**
 * @file Description
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join, extname} from 'path';
import inquirer from 'inquirer';
import async from 'async';
import Metalsmith from 'metalsmith';
import metalsmithCopy from 'metalsmith-copy';
import consolidate from 'consolidate';
import npmInstall from './npm-install';
import yarnInstall from './yarn-install';
import meta from './meta';

const RENDER = consolidate.ejs.render;

// 不需要 RENDER 的文件后缀集合
const NOT_RENDER_SUFFIX = [
    '.eot', '.svg', '.ttf', '.woff', '.woff2',
    '.png', '.jpg', '.jpeg', '.gif', '.webp'
];

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
                validate: prompt.validate || (() => true),
                filter: prompt.filter
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
        const extName = extname(file);
        if (NOT_RENDER_SUFFIX.indexOf(extName) > -1) {
            done();
            return;
        }
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

/**
 * metalsmith plugin 过滤文件，把一些根据命令行选择项参数的文件过滤掉
 *
 * @param {Object} files files 对象
 * @param {Object} metalsmith metalsmith 实例对象
 * @param {Function} done 完成回调函数
 */
function filterFiles(files, metalsmith, done) {
    const metadata = metalsmith.metadata();
    if (!metadata.redis) {
        delete files['server/conf/redis.js'];
    }
    if (!metadata.uuap) {
        delete files['server/conf/uuap.js'];
    }
    done();
}

/**
 * generate project
 *
 * @param {Object} curPrompts 当前的提示问题
 * @param {string} projectName 项目名称
 * @param {string} registry npm registry url
 * @param {boolean} inCurrent 是否在当前目录直接创建项目
 */
export default function(curPrompts, projectName, registry, inCurrent) {
    const dest = inCurrent ? '.' : projectName;
    const metalsmith = new Metalsmith(join(__dirname, './template')).source('.');
    metalsmith
        .use(ask(curPrompts))
        .use(filterFiles)
        .use(metalsmithCopy({
            pattern: '*(babelrc|eslintrc|jshintrc|fecsrc|foreverignore|gitignore)',
            move: true,
            transform: file => {
                return `.${file}`;
            }
        }))
        .use(renderTemplate)
        .clean(false)
        .destination(join(process.cwd(), dest))
        .build(err => {
            if (err) {
                throw err;
            }

            const curDependencies = Object.assign({}, meta.ALL_DEPENDENCIES);

            const metadata = metalsmith.metadata();
            // console.log('metadata', metadata);

            process.chdir(dest);

            const depPkg = metadata.depPkg;

            if (depPkg === 'none') {
                console.log('\nStart:\n');
                console.log(`cd ${dest}`);
                console.log('npm intall');
                console.log('npm run dev');
                console.log(`\nFor more information, please see ${join(dest, 'README.md')}\n`);
            }
            else if (metadata.depPkg === 'npm') {
                npmInstall(meta.ALL_DEPENDENCIES, registry, () => {
                    console.log('all deps install done\n');
                    console.log(`cd ${dest}`);
                    console.log('npm run dev');
                    console.log(`\nFor more information, please see ${join(dest, 'README.md')}\n`);
                });
            }
            else {
                yarnInstall(meta.ALL_DEPENDENCIES, () => {
                    console.log('all deps install done\n');
                    console.log(`cd ${dest}`);
                    console.log('npm run dev');
                    console.log(`\nFor more information, please see ${join(dest, 'README.md')}\n`);
                });
            }
        });
}

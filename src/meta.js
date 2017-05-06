/**
 * @file meta 信息
 * @author ielgnaw(wuji0223@gmail.com)
 */

export default {
    /**
     * 提示问题
     *
     * @type {Object}
     */
    PROMPTS: {
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
        },
        redis: {
            type: 'confirm',
            message: 'Use Redis'
        },
        uuap: {
            type: 'confirm',
            message: 'Use UUAP'
        },
        depPkg: {
            type: 'list',
            message: 'Select dependencies pkg manager',
            choices: ['npm', 'yarn'],
        }
        // auth: {
        //     type: 'list',
        //     message: 'Auth',
        //     choices: ['UUAP', 'Passport', 'none'],
        //     filter: val => {
        //         return val.toLowerCase();
        //     }
        // }

        // separator: {
        //     message: 'Database'
        // },
    },

    /**
     * 依赖配置
     *
     * @type {Object}
     */
    ALL_DEPENDENCIES: {
        save: [
        ],
        saveDev: [
            'autoprefixer', 'babel-cli', 'babel-core', 'babel-loader', 'babel-plugin-import',
            'babel-plugin-transform-object-assign', 'babel-plugin-transform-runtime', 'babel-polyfill',
            'babel-preset-es2015', 'babel-preset-react', 'babel-preset-stage-2', 'babel-register', 'chalk',
            'cheerio', 'co', 'co-views', 'compression-webpack-plugin', 'cross-env', 'css-loader', 'debug', 'errno',
            'eslint-friendly-formatter', 'eventsource-polyfill', 'extract-text-webpack-plugin', 'fecs', 'file-loader',
            'file-size', 'forever-cluster', 'html-webpack-plugin', 'json-loader', 'jsonwebtoken', 'knex', 'koa',
            'koa-body', 'koa-bodyparser', 'koa-json', 'koa-ln', 'koa-onerror', 'koa-router', 'koa-static',
            'koa-webpack-middleware', 'less', 'less-loader', 'mkdirp', 'moment', 'moment-precise-range-plugin',
            'mysql', 'node-fetch', 'nodemon', 'ora', 'postcss-loader', 'redis', 'rider', 'shelljs',
            'style-loader', 'stylus', 'stylus-loader', 'swig', 'url-loader', 'webpack', 'webpack-dev-middleware',
            'webpack-hot-middleware', 'webpack-merge', 'xmlparser'
        ]
    }
};

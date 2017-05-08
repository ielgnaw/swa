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
            choices: ['none', 'npm', 'yarn'],
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
            'react', 'react-dom'
        ],
        // koa-webpack-middleware 1.0.4 有点问题，等待作者重新发包
        // koa-bodyparser > 2 版本需要 node 7.6+
        saveDev: [
            'autoprefixer', 'babel-cli', 'babel-core', 'babel-loader', 'babel-plugin-import',
            'babel-plugin-transform-object-assign', 'babel-plugin-transform-runtime', 'babel-polyfill',
            'babel-preset-es2015', 'babel-preset-react', 'babel-preset-stage-2', 'babel-register', 'chalk',
            'cheerio', 'co', 'co-views', 'compression-webpack-plugin', 'cross-env', 'css-loader', 'debug', 'errno',
            'eslint-friendly-formatter', 'eventsource-polyfill', 'extract-text-webpack-plugin', 'fecs', 'file-loader',
            'file-size', 'forever-cluster', 'html-webpack-plugin', 'json-loader', 'jsonwebtoken', 'knex', 'koa',
            'koa-body', 'koa-bodyparser@2', 'koa-json', 'koa-ln', 'koa-onerror', 'koa-router', 'koa-static',
            'koa-webpack-middleware@1.0.3', 'less', 'less-loader', 'mkdirp', 'moment', 'moment-precise-range-plugin',
            'mysql', 'node-fetch', 'nodemon', 'ora', 'postcss-loader', 'redis', 'rider', 'shelljs',
            'style-loader', 'stylus', 'stylus-loader', 'swig', 'url-loader', 'webpack', 'webpack-dev-middleware',
            'webpack-hot-middleware', 'webpack-merge', 'xmlparser'
        ]
    }
};

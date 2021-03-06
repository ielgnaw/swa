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
            'react@15.5.4', 'react-dom@15.5.4'
        ],
        // koa-webpack-middleware 1.0.4 有点问题，等待作者重新发包
        // koa-bodyparser > 2 版本需要 node 7.6+
        saveDev: [
            'autoprefixer@7.0.1', 'babel-cli@6.24.1', 'babel-core@6.24.1', 'babel-loader@7.0.0',
            'babel-plugin-import@1.1.1', 'babel-plugin-transform-object-assign@6.22.0',
            'babel-plugin-transform-runtime@6.23.0', 'babel-polyfill@6.23.0', 'babel-preset-es2015@6.24.1',
            'babel-preset-react@6.24.1', 'babel-preset-stage-2@6.24.1', 'babel-register@6.24.1', 'chalk@1.1.3',
            'cheerio@0.22.0', 'co@4.6.0', 'co-views@2.1.0', 'compression-webpack-plugin@0.4.0', 'cross-env@4.0.0',
            'css-loader@0.28.1', 'debug@2.6.6', 'errno@0.1.4', 'eslint-friendly-formatter@2.0.7',
            'eventsource-polyfill@0.9.6', 'extract-text-webpack-plugin@2.1.0', 'fecs@1.2.3', 'file-loader@0.11.1',
            'file-size@1.0.0', 'forever-cluster@0.16.4', 'html-webpack-plugin@2.28.0', 'json-loader@0.5.4',
            'jsonwebtoken@7.4.0', 'knex@0.13.0', 'koa@2.2.0', 'koa-body@2.0.1', 'koa-bodyparser@2.5.0',
            'koa-json@2.0.2', 'koa-ln@0.1.5', 'koa-onerror@3.1.0', 'koa-router@7.1.1', 'koa-static@3.0.0',
            'koa-webpack-middleware@1.0.3', 'less@2.7.2', 'less-loader@4.0.3', 'mkdirp@0.5.1', 'moment@2.18.1',
            'moment-precise-range-plugin@1.2.1', 'mysql@2.13.0', 'node-fetch@1.6.3', 'nodemon@1.11.0', 'ora@1.2.0',
            'postcss-loader@2.0.2', 'redis@2.7.1', 'rider@2.0.0', 'shelljs@0.7.7', 'style-loader@0.17.0',
            'stylus@0.54.5', 'stylus-loader@3.0.1', 'swig@1.4.2', 'url-loader@0.5.8', 'webpack@2.5.1',
            'webpack-dev-middleware@1.10.2', 'webpack-hot-middleware@2.18.0', 'webpack-merge@4.1.0', 'xmlparser@0.1.0'
        ]
    }
};

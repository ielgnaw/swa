/**
 * @file 数据库实例的封装
 * @author ielgnaw(wuji0223@gmail.com)
 */

import knex from 'knex';
import chalk from 'chalk';

import dbConf from './conf/db';

const dao = knex({
    client: 'mysql',
    connection: dbConf
});

let startTime = process.hrtime();

dao.on('query', data => {
    startTime = process.hrtime();
}).on('query-response', (response, obj, builder) => {
    const diff = process.hrtime(startTime);
    const ms = diff[0] * 1e3 + diff[1] * 1e-6;

    if (IS_DEV) {
        console.log('%s %s %s %s %s',
            chalk.gray('SQL'),
            chalk.gray(`(${obj.method.toUpperCase()})`),
            chalk.cyan(obj.sql),
            chalk.gray(`{${obj.bindings.join(', ')}}`),
            chalk.magenta(`${ms.toFixed(3)}ms`)
        );
    }

}).on('query-error', (e, obj) => {
    throw new Error(e);
});

export default dao;

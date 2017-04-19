/**
 * @file 数据库配置
 * @author ielgnaw(wuji0223@gmail.com)
 */

import knex from 'knex';
import chalk from 'chalk';

const IS_DEV = process.env.NODE_ENV === 'development';

const db = knex({
    client: 'mysql',
    connection: IS_DEV
        ? {
            host: '{{devDbHost}}',
            user: '{{devDbUser}}',
            password: '{{devDbPwd}}',
            database: '{{devDbName}}',
            port: {{devDbPort}}
        }
        : {
            host: '{{prodDbHost}}',
            user: '{{prodDbUser}}',
            password: '{{prodDbPwd}}',
            database: '{{prodDbName}}',
            port: {{prodDbPort}}
        }
});

let startTime = process.hrtime();

db.on('query', data => {
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

export default db;

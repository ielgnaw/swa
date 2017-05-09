
/**
 * @file 命令行入口
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join} from 'path';
import yargs from 'yargs';
import figlet from 'figlet';

import sys from '../package.json';

figlet('S W A', (err, data) => {
    if (err) {
        console.dir(err);
        return;
    }
    console.log(data);
    yargs
        .usage('Usage: $0 <command> [options]')
        .commandDir(join(__dirname, './command'))
        .option('r', {
            alias: 'registry',
            default: 'http://registry.npmjs.org',
            desc: 'Set NPM Registry URL',
            type: 'string'
        })
        .example(
            '$0 init',
            'Initialize Project in current directory.'
        )
        .example(
            '$0 init DIRECTORY_NAME',
            'Initialize the project in `directoryName` directory.'
        )
        .demand(1, 'Please specify one of the commands!')
        .strict()
        .help('h')
        .alias('h', 'help')
        .version(() => `${sys.name} ${sys.version}\n${sys.description}`)
        .alias('v', 'version')
        .wrap(null)
        .argv;
});


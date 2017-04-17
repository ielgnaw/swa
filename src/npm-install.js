/**
 * @file npm install 模块
 * @author ielgnaw(wuji0223@gmail.com)
 */

import spawn from 'cross-spawn';
import chalk from 'chalk';
import Ora from 'ora';

export default function (deps, opts, allDone) {
    if (!Array.isArray(deps)) {
        deps = [deps];
    }
    const len = deps.length;
    deps.forEach((dep, index) => {
        const spinner = new Ora({
            text: `Installing ${dep}...`
        });
        spinner.start();

        // 是 dependencies 还是 devDependencies，默认为 dependencies
        const depArgs = opts.saveDev ? '-D' : '-S';

        spawn('npm', ['install', depArgs, dep], {stdio: 'pipe'}).on('error', err => {
            spinner.fail(chalk.red(`err: install ${dep}`));
            throw err;
        }).on('close', () => {
            spinner.succeed(chalk.green(`installed ${dep}`));
            if (index === len - 1 && typeof allDone === 'function') {
                allDone();
            }
        });
    });
}

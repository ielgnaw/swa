/**
 * @file npm install 模块
 * @author ielgnaw(wuji0223@gmail.com)
 */

import spawn from 'cross-spawn';
import chalk from 'chalk';
import Ora from 'ora';

const install = (deps, opts, allDone) => {
    const len = deps.length;
    if (len) {
        const dep = deps.shift();

        const spinner = new Ora({
            text: `Installing ${dep}...`
        });
        spinner.start();

        // 是 dependencies 还是 devDependencies，默认为 dependencies
        const depArgs = opts.saveDev ? '-D' : '-S';

        let stderrData = '';
        const child = spawn('npm', ['install', depArgs, dep]);

        child.stderr.on('data', data => {
            stderrData += data.toString();
        });

        child.on('error', err => {
            spinner.fail(chalk.red(`err: Install ${dep}:\n${stderrData}`));
            throw err;
        })

        child.on('close', (code, s) => {
            if (code !== 0) {
                spinner.fail(chalk.red(`err: Install ${dep}:\n${stderrData}`));
                process.exit(code);
            }
            spinner.succeed(chalk.green(`Installed ${dep}`));
            install(deps, opts, allDone);
        });

        return;
    }

    allDone();
};

export default function (deps, opts, allDone) {
    if (!Array.isArray(deps)) {
        deps = [deps];
    }

    install(deps, opts, allDone);
}

/**
 * @file 获取 git user 信息
 * @author ielgnaw(wuji0223@gmail.com)
 */

import childProcess from 'child_process';

const exec = childProcess.execSync;

export default function() {
    let name;
    let email;
    try {
        name = exec('git config --get user.name');
        email = exec('git config --get user.email');
    }
    catch (e) {}

    name = name && JSON.stringify(name.toString().trim()).slice(1, -1);
    email = email && (' <' + email.toString().trim() + '>');

    return (name || '') + (email || '');
}

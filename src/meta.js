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
        separator: {
            message: 'Database'
        },
        devDbHost: {
            type: 'input',
            message: 'Local development environment database host',
            default: 'localhost'
        },
        devDbPort: {
            type: 'input',
            message: 'Local development environment database port',
            default: 3306
        },
        devDbName: {
            type: 'input',
            message: 'Local development environment database name'
        },
        devDbUser: {
            type: 'input',
            message: 'Local development environment database username'
        },
        devDbPwd: {
            type: 'input',
            message: 'Local development environment database password'
        },
        prodDbHost: {
            type: 'input',
            message: 'Online environment database host',
            default: '127.0.0.1'
        },
        prodDbPort: {
            type: 'input',
            message: 'Online environment database port',
            default: 3306
        },
        prodDbName: {
            type: 'input',
            message: 'Online environment database name'
        },
        prodDbUser: {
            type: 'input',
            message: 'Online environment database username'
        },
        prodDbPwd: {
            type: 'input',
            message: 'Online environment database password'
        }
    },

    /**
     * 依赖配置
     *
     * @type {Object}
     */
    ALL_DEPENDENCIES: {
        save: [
            'knex', 'mysql'
        ],
        saveDev: [
            // 'chai'
        ]
    }
};

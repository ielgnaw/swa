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
        auth: {
            type: 'list',
            message: 'Auth',
            choices: ['UUAP', 'Passport', 'none'],
            filter: val => {
                return val.toLowerCase();
            }
        }
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
            'mysql'
        ],
        saveDev: [
            'chai'
        ]
    }
};

/**
 * @file uuap 配置
 * @author ielgnaw(wuji0223@gmail.com)
 */

import os from 'os';

const IS_DEV = process.env.NODE_ENV === 'development';

export default IS_DEV
    ? {
        appKey: '{Your development APPKey}',
        service: '{uuap callback url for development}',
        serviceConf: {
            protocol: 'http',
            hostname: '{offline uuap host}',
            port: '8100',
            validateMethod: '/serviceValidate'
        }
    }
    : {
        appKey: 'Your online APPKey',
        service: '{uuap callback url for online}',
        serviceConf: {
            protocol: 'https',
            hostname: '{online uuap host}',
            validateMethod: '/serviceValidate'
        }
    };

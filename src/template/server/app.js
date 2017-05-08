/**
 * @file 入口
 * @author ielgnaw(wuji0223@gmail.com)
 */

import 'babel-polyfill';
import 'babel-register';
import http from 'http';
import {join} from 'path';
import {existsSync} from 'fs';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import json from 'koa-json';
import convert from 'koa-convert';
import koaStatic from 'koa-static';
import onerror from 'koa-onerror';
import webpack from 'webpack';
import webpackMiddleware from 'koa-webpack-middleware';
import logger from 'koa-ln';
import debugPackage from 'debug';
import mkdirp from 'mkdirp';

import {routes, allowedMethods} from './router/config';

import webpackDevConfig from '../build/webpack.dev.conf';
import webpackProdConfig from '../build/webpack.prod.conf';
import {setCtxRenderPath, getIP} from '../build/util';
import config from '../build/config';
import {logDir/*, clicksLogDir*/} from './util';
// import {setCtx} from './conf/db';

if (!existsSync(logDir)) {
    mkdirp.sync(logDir);
}

// if (!existsSync(clicksLogDir)) {
//     mkdirp.sync(clicksLogDir);
// }

const debug = debugPackage('dev-server');
const IS_DEV = process.env.NODE_ENV === 'development';
const webpackConf = IS_DEV ? webpackDevConfig : webpackProdConfig;

const app = new Koa();

const {devMiddleware, hotMiddleware} = webpackMiddleware;

const PORT = IS_DEV ? config.dev.port : config.build.port;

app.use(convert(bodyparser()));
app.use(convert(json()));
app.use(convert(koaStatic(join(__dirname, '..', '/client'))));

app.use(logger.access({type: 'file', path: './logs/'}));
app.use(logger.app({type: 'file', path: './logs/'}));


///////////////////////////////////////

// import redisConf from './conf/redis';
// console.log('redisConf',redisConf);

// var redis = require('redis');
// var client = redis.createClient(redisConf);

// client.on('error', function (err) {
//     console.log('error event - ' + client.host + ':' + client.port + ' - ' + err);
// });

// client.set('string key', 'string val', redis.print);
// client.hset('hash key', 'hashtest 1', 'some value', redis.print);
// client.hset(['hash key', 'hashtest 2', 'some other value'], redis.print);
// client.hkeys('hash key', function (err, replies) {
//     if (err) {
//         return console.error('error response - ' + err);
//     }

//     console.log(replies.length + ' replies:');
//     replies.forEach(function (reply, i) {
//         console.log('    ' + i + ': ' + reply);
//     });
// });

// client.quit(function (err, res) {
// });

///////////////////////////////////////



/**
 * 把 ctx 设置到 db 中，便于在 db 操作时，使用 ctx.logger
 */
/* jshint ignore:start */
// app.use(async (ctx, next) => {
//     setCtx(ctx);
//     await next();
// });
/* jshint ignore:end */

setCtxRenderPath(app, join(__dirname, '..', IS_DEV ? '/server/view' : '/client/output'));

app.use(convert.compose(routes));
app.use(convert.compose(allowedMethods));

// console.log(JSON.stringify(webpackConf.module.rules, null, 4));
// console.log();
if (IS_DEV) {
    const compiler = webpack(webpackConf);
    app.use(convert(devMiddleware(compiler, {
        stats: {
            colors: true
        },
        noInfo: true
    })));

    app.use(convert(hotMiddleware(compiler)));
}
else {
    app.use(async (ctx, next) => {
        if (ctx.status === 404) {
            ctx.body = `${ctx.url} is Not Found`;
        }
        else {
            await next();
        }
    });
}

onerror(app);
app.on('error', (err, ctx) => {
    ctx.logger.error(err);
});

const server = http.createServer(app.callback());
server.listen(PORT);

server.on('error', error => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof PORT === 'string' ? ('Pipe ' + PORT) : 'Port ' + PORT;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
});

server.on('listening', () => {
    const addr = server.address();
    // const bind = typeof addr === 'string' ? ('pipe ' + addr) : 'port ' + addr.port;
    // console.log('Listening at http://localhost:' + addr.port + ' or http://' + getIP() + ':' + addr.port + '\n');
    debug('Listening at http://localhost:' + addr.port + ' or http://' + getIP() + ':' + addr.port + '\n');
});

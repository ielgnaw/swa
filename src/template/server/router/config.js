/**
 * @file router config
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';
import login from './login';
import account from './account';
import logout from './logout';
import segment from './segment';
import personal from './personal';
import log from './log';

const pageRouter = new KoaRouter();

// 把所有前端的页面路由都指向 index，为了方便前端 react router 使用 browserHistory
// 其实也可以配置多个 view 实现，但是改动太大，先就这样了
['/', '/generalModel', '/fastCustom', '/completeCustom', '/customManage', '/document', '/check'].forEach(item => {
    pageRouter.get(item, async (ctx, next) => {
        if (item === '/check') {
            ctx.body = 'ok';
            return;
        }
        ctx.body = await ctx.render('index');
    });
});

const routes = [];
const allowedMethods = [];

[pageRouter, login, account, logout, segment, personal, log].forEach(router => {
    routes.push(router.routes());
    allowedMethods.push(router.allowedMethods());
});

export {routes, allowedMethods};

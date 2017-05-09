/**
 * @file router config
 * @author <%- author %>
 */

import KoaRouter from 'koa-router';

const pageRouter = new KoaRouter();

// 把所有前端的页面路由都指向 index，为了方便前端 react router 使用 browserHistory
// 其实也可以配置多个 view 实现，但是改动太大，先就这样了
['/'].forEach(item => {
    pageRouter.get(item, async (ctx, next) => {
        ctx.body = await ctx.render('index');
    });
});

const routes = [];
const allowedMethods = [];

[pageRouter].forEach(router => {
    routes.push(router.routes());
    allowedMethods.push(router.allowedMethods());
});

export {routes, allowedMethods};

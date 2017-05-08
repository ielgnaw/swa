/**
 * @file 退出登录路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';

const router = new KoaRouter();

router.get('/logout', async (ctx, next) => {
    const now = new Date();
    now.setFullYear(now.getFullYear() - 1);

    ctx.status = 200;
    ctx.cookies.set('token', ctx.cookies.get('token'), {
        expires: now,
        path: '/',
        httpOnly: false
    });

    ctx.redirect('/');
});

export default router;

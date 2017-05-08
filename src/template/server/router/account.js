/**
 * @file account ajax 请求路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';
import auth from '../middleware/auth';

const router = new KoaRouter();

router.use('/account', auth);

router.get('/account', async (ctx, next) => {
    ctx.status = 200;
    ctx.body = {
        status: 0,
        data: {
            username: ctx.state.user ? ctx.state.user.user : null
        }
    };
});

export default router;

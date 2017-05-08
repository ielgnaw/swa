/**
 * @file 登录路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';
import jwt from 'jsonwebtoken';

import uuapConf from '../conf/uuap';
import uuap from '../uuap';
import auth from '../middleware/auth';
import userModel from '../model/user';

const router = new KoaRouter();
const u = uuap(uuapConf);

router.use('/login', auth);

router.get('/login', async (ctx, next) => {

    try {
        const ticket = ctx.query.ticket;
        if (ticket) {
            const user = await u.validate(ticket);
            const userInDb = await userModel.findByUsername(user.user);

            if (!userInDb.length) {
                await userModel.insert(user.user);
            }

            const token = jwt.sign(user, 'secret', {});
            const now = new Date();

            now.setFullYear(now.getFullYear() + 1);

            ctx.status = 201;
            ctx.cookies.set('token', token, {
                expires: now,
                path: '/',
                httpOnly: false
            });
            ctx.redirect('/');
        }
        else {
            ctx.redirect(u.getLoginUrl());
        }
    }
    catch (e) {
        if (e.code === 'INVALID_TICKET') {
            ctx.status = 401;
            ctx.body = {
                error: '错误的登录凭证',
                loginPageURL: u.getLoginUrl()
            };
            return;
        }

        ctx.logger.warn(JSON.stringify({message: e.message, stack: e.stack}));
        ctx.status = 500;
        ctx.body = {error: '系统异常，请候再试'};
    }
});

export default router;

/**
 * @file personal ajax 路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';
import moment from 'moment';
import jwt from 'jsonwebtoken';
import ln from 'ln';

const router = new KoaRouter({
    prefix: '/log'
});

const logger = new ln({
    name: 'name',
    level: 'info',
    appenders: [{
        type: 'file',
        path: `[./clicks/]YYYY-MM-DD[.log]`,
    }],
    formatter: json => JSON.stringify({
        // time: moment(json.t).format('YYYY-MM-DD HH:mm:ss'),
        time: moment(json.t).unix(),
        msg: json.j
    })
});

// log
router.get('/', async (ctx, next) => {
    const TYPE = 'log/';

    try {
        const {cate, page, url, txt} = ctx.query;
        const token = ctx.cookies.get('token');
        let user = {
            user: 'anonymous'
        }
        try {
            user = jwt.verify(token, 'secret', {});
        }
        catch (e) {}

        logger.info({
            cate: cate,
            page: page,
            url: url,
            txt: txt,
            user: user.user
        });

        ctx.body = {};
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
    }
});

export default router;

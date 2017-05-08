/**
 * @file personal ajax 路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import KoaRouter from 'koa-router';
import {join, dirname, basename} from 'path';
import {renameSync, statSync, createReadStream} from 'fs';
import moment from 'moment';
import fileSize from 'file-size';
import 'moment-precise-range-plugin';

import {getErrorMsg} from '../util';
import auth from '../middleware/auth';
import modelModel from '../model/model';
import corpusModel from '../model/corpus';
import dictModel from '../model/dict';
import userModel from '../model/user';
import shareModelModel from '../model/shareModel';
import {stopNLPC, shareModel} from '../service';

import {updateDict, deleteDict, downloadDict} from '../action/dict';
import {updateCorpus, deleteCorpus, downloadCorpus} from '../action/corpus';

const router = new KoaRouter({
    prefix: '/personal'
});

// 下载模型
router.use('/download-model', auth);
router.get('/download-model', async (ctx, next) => {
    const TYPE = 'personal/download-model';

    try {
        const modelId = ctx.query.model_id;
        const isValid = ctx.query.isValid;
        const isShareModel = ctx.query.is_share;
        const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

        // 找 model
        const curModel = await execModel.findById(modelId);

        if (isValid) {
            try {
                const filePath = curModel[0].local_path;
                // stats.isFile: 是否为文件
                // stats.isDictionary: 是否为目录
                // stats.mode: 读写权限是
                // stats.size: 文件大小是
                // stats.atime: 访问时间是
                // stats.mtime: 修改时间是
                // stats.ctime: 创建时间是
                const stat = statSync(filePath);
                const src = createReadStream(filePath);
                ctx.response.set('Content-Description', 'File Transfer');
                ctx.response.set('Content-disposition', 'attachment; filename=' + basename(encodeURI(decodeURI(filePath))));
                ctx.response.set('Content-type', 'application/octet-stream');
                ctx.response.set('Content-Transfer-Encoding', 'binary');
                ctx.response.set('Cache-Control', 'must-revalidate');
                ctx.response.set('Expires', '0');
                ctx.response.set('Pragma', 'public');
                ctx.response.set('Content-Length', stat.size);
                ctx.status = 200;
                ctx.body = src;
                return;
            }
            catch (e) {
                ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
                ctx.status = 500;
                ctx.body = {
                    type: ctx.request.url,
                    msg: 'server error',
                    info: {
                        desc: getErrorMsg(e)
                    }
                };
                if (e.errno === -2 && e.code === 'ENOENT') {
                    ctx.status = 404;
                }
                return;
            }
        }

        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `not find model [${modelId}]`
            };
            return;
        }

        // 验证当前用户是否有此 model 的权限
        // common 的 model user_name 为空
        if (curModel[0].user_name && curModel[0].user_name !== ctx.state.user.user) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'no permission on this model'
            };
            return;
        }

        // 验证 model
        if (curModel[0].status !== 4) {
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: `model [${modelId}] is not prepared, be patient please`
            };
            return;
        }

        if (!curModel[0].local_path) {
            ctx.body = {
                type: TYPE,
                status: 5,
                statusInfo: 'model local_path is not set'
            };
            return;
        }

        ctx.body = {
            type: TYPE,
            status: 0,
            data: {}
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});

// 获取用户的模型列表
// router.use('/my-models', auth);
// router.get('/my-models', async (ctx, next) => {
//     const TYPE = 'personal/my-models';
//     try {
//         const userModels = await modelModel.findAllByUsername(ctx.state.user.user);
//         // if (!userModels.length) {
//         //     ctx.body = {
//         //         type: TYPE,
//         //         status: 1,
//         //         statusInfo: 'did not find your model'
//         //     };
//         //     return;
//         // }

//         const cur = moment();
//         let dateDiff = {};
//         let createTime = '';
//         const resData = {
//             intervene: [],
//             retrain: []
//         };

//         userModels.forEach(model => {
//             dateDiff = moment.preciseDiff(moment(model.create_time), cur, true);

//             if (dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 1) {
//                 createTime = '1天以前';
//             }
//             else if (dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 0) {
//                 if (dateDiff.hours === 0) {
//                     createTime = `${dateDiff.minutes}分钟以前`;
//                 }
//                 else {
//                     createTime = `${dateDiff.hours}小时以前`;
//                 }
//             }
//             else {
//                 createTime = moment(model.create_time).format('YYYY-MM-DD HH:mm');
//             }

//             model.modelName = model.name ? model.name : `ID${model.id}`;
//             model.createTime = createTime;
//             model.timestamp = moment(model.create_time).unix();

//             if (model.train_type === 'quick_train') {
//                 resData.intervene.push(model);
//             }
//             else if (model.train_type === 'train') {
//                 resData.retrain.push(model);
//             }
//         });

//         resData.intervene.sort((a, b) => b.timestamp - a.timestamp);

//         resData.retrain.sort((a, b) => b.timestamp - a.timestamp);

//         ctx.body = {
//             type: TYPE,
//             status: 0,
//             data: resData
//         };
//     }
//     catch (e) {
//         ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
//         ctx.body = {
//             type: TYPE,
//             status: 1,
//             statusInfo: '系统异常，请稍候再试'
//         };
//     }
// });

// 获取用户上传的词典和语料数据
router.use('/user-files', auth);
router.get('/user-files', async (ctx, next) => {
    const TYPE = 'personal/user-files';

    try {
        /* eslint-disable fecs-prefer-async-await */
        const userCorpus = await corpusModel.findByUsername(ctx.state.user.user);
        const userDict = await dictModel.findByUsername(ctx.state.user.user);
        /* eslint-enable fecs-prefer-async-await */

        // if (!userModels.length) {
        //     ctx.body = {
        //         type: TYPE,
        //         status: 1,
        //         statusInfo: 'did not find your model'
        //     };
        //     return;
        // }

        const date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        const cur = moment(date);

        let dateDiff = {};
        let createTime = '';
        const resData = {
            dict: [],
            corpus: []
        };

        userCorpus.forEach(corpus => {
            dateDiff = moment.preciseDiff(moment(corpus.create_time), cur, true);

            if (
                dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 0
                    && dateDiff.firstDateWasLater
                ) {
                createTime = moment(corpus.create_time).format('HH:mm');
            }
            else {
                createTime = moment(corpus.create_time).format('YYYY年MM月DD日 HH:mm');
            }

            corpus.fileName = `${corpus.name}-${corpus.id}`;
            corpus.fileSize =  fileSize(corpus.file_size, {fixed: 1}).human('jedec');
            corpus.createTime = createTime;
            corpus.timestamp = moment(corpus.create_time).unix();
            resData.corpus.push(corpus);
        });

        userDict.forEach(dict => {
            dateDiff = moment.preciseDiff(moment(dict.create_time), cur, true);

            if (
                dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 0
                    && dateDiff.firstDateWasLater
                ) {
                createTime = moment(dict.create_time).format('HH:mm');
            }
            else {
                createTime = moment(dict.create_time).format('YYYY年MM月DD日 HH:mm');
            }

            dict.fileName = `${dict.name}-${dict.id}`;
            dict.fileSize =  fileSize(dict.file_size, {fixed: 1}).human('jedec');
            dict.createTime = createTime;
            dict.timestamp = moment(dict.create_time).unix();
            resData.dict.push(dict);
        });

        resData.corpus.sort((a, b) => b.timestamp - a.timestamp);

        resData.dict.sort((a, b) => b.timestamp - a.timestamp);

        ctx.body = {
            type: TYPE,
            status: 0,
            data: resData
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});

// 下载词典
router.use('/download-dict', auth);
router.get('/download-dict', downloadDict);

// 修改 dict 名称
router.use('/update-dict', auth);
router.get('/update-dict', updateDict);

// 删除 dict
router.use('/delete-dict', auth);
router.get('/delete-dict', deleteDict);

// 下载语料
router.use('/download-corpus', auth);
router.get('/download-corpus', downloadCorpus);

// 修改 corpus 名称
router.use('/update-corpus', auth);
router.get('/update-corpus', updateCorpus);

// 删除 corpus
router.use('/delete-corpus', auth);
router.get('/delete-corpus', deleteCorpus);

// 远程调用下载
router.use('/download-remote-model', auth);
router.get('/download-remote-model', async (ctx, next) => {
    const TYPE = 'personal/download-remote-model';

    const modelId = ctx.query.model_id;
    const isShareModel = ctx.query.is_share;
    const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

    // 找 model
    const curModel = await execModel.findById(modelId);
    if (!curModel.length) {
        ctx.body = {
            type: TYPE,
            status: 2,
            statusInfo: `not find model [${modelId}]`
        };
        return;
    }

    // 验证当前用户是否有此 model 的权限
    // common 的 model user_name 为空
    if (curModel[0].user_name && curModel[0].user_name !== ctx.state.user.user) {
        ctx.body = {
            type: TYPE,
            status: 2,
            statusInfo: 'no permission on this model'
        };
        return;
    }

    // 验证 model
    if (curModel[0].status !== 4) {
        ctx.body = {
            type: TYPE,
            status: 4,
            statusInfo: `model [${modelId}] is not prepared, be patient please`
        };
        return;
    }

    if (!curModel[0].local_api_path) {
        ctx.body = {
            type: TYPE,
            status: 5,
            statusInfo: 'model local_api_path is not set'
        };
        return;
    }

    try {
        const filePath = curModel[0].local_api_path;
        // stats.isFile: 是否为文件
        // stats.isDictionary: 是否为目录
        // stats.mode: 读写权限是
        // stats.size: 文件大小是
        // stats.atime: 访问时间是
        // stats.mtime: 修改时间是
        // stats.ctime: 创建时间是
        const stat = statSync(filePath);
        const src = createReadStream(filePath);
        ctx.response.set('Content-Description', 'File Transfer');
        ctx.response.set('Content-disposition', 'attachment; filename=' + basename(filePath));
        ctx.response.set('Content-type', 'application/octet-stream');
        ctx.response.set('Content-Transfer-Encoding', 'binary');
        ctx.response.set('Cache-Control', 'must-revalidate');
        ctx.response.set('Expires', '0');
        ctx.response.set('Pragma', 'public');
        ctx.response.set('Content-Length', stat.size);
        ctx.status = 200;
        ctx.body = src;
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.status = 500;
        ctx.body = {
            type: TYPE,
            msg: 'server error',
            info: {
                desc: getErrorMsg(e)
            }
        };
        if (e.errno === -2 && e.code === 'ENOENT') {
            ctx.status = 404;
        }
        return;
    }
});

// 关闭远程调用
router.use('/close-remote', auth);
router.get('/close-remote', async (ctx, next) => {
    const TYPE = 'personal/close-remote';

    try {
        const modelId = ctx.query.modelId;
        const isShareModel = ctx.query.isShareModel;
        const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

        // 找 model
        const curModel = await execModel.findById(modelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `not find model [${modelId}]`
            };
            return;
        }

        // 验证当前用户是否有此 model 的权限
        // common 的 model user_name 为空
        if (curModel[0].user_name && curModel[0].user_name !== ctx.state.user.user) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'no permission on this model'
            };
            return;
        }

        // 验证 model
        if (curModel[0].status !== 4) {
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: `model [${modelId}] is not prepared, be patient please`
            };
            return;
        }

        /* eslint-disable fecs-prefer-async-await */
        const stopRet = await stopNLPC(modelId);
        /* eslint-enable fecs-prefer-async-await */
        if (String(stopRet.status) !== '0') {
            ctx.logger.error(`stop remote failed, message: ${stopRet.result.msg}`);
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: '系统异常，请稍候再试'
            };
            return;
        }

        const localApiPath = curModel[0].local_api_path;

        /* eslint-disable fecs-prefer-async-await */
        await execModel.instance().where({
            id: modelId
        }).update({
            nlpc_status: 0,
            remote_api_path: '',
            local_api_path: '',
            remote_http_api: ''
        });
        /* eslint-enable fecs-prefer-async-await */

        rm('-rf', localApiPath);

        ctx.body = {
            type: TYPE,
            status: 0,
            data: {}
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});


// 查询所有用户
router.use('/all-user', auth);
router.get('/all-user', async (ctx, next) => {
    const TYPE = 'personal/all-user';
    try {
        const allUsers = await userModel.findAll();
        ctx.body = {
            type: TYPE,
            status: 0,
            data: {
                list: allUsers
            }
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});

// 分享模型
router.use('/share-model', auth);
router.post('/share-model', async (ctx, next) => {
    const TYPE = 'personal/share-model';

    try {
        const {shareToUsers, curShareModel} = ctx.request.body;
        // console.log(shareToUsers);
        // console.log(curShareModel);
        // console.log(ctx.state.user.user);
        // shareToUsers => user_name
        // ctx.state.user => share_user_name

        for (let i = 0, len = shareToUsers.length; i < len; i++) {
            const shareModelRet = await shareModel(curShareModel.id, shareToUsers[i]);
            const shareModelRetStatus = String(shareModelRet.status);
            if (shareModelRetStatus !== '0') {
                ctx.logger.error(`share-model failed, message: ${shareModelRet.result.msg}`);
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: `error occurs in share-model, message: [${shareModelRet.result.msg}]`
                };
                return;
            }
            await shareModelModel.insert({
                id: shareModelRet.result.model_id,
                modelName: curShareModel.name,
                baseModelId: curShareModel.base_model_id,
                username: shareToUsers[i],
                shareUsername: ctx.state.user.user,
                grade: curShareModel.grade,
                trainType: curShareModel.train_type,
                createTime: moment().format('YYYY-MM-DD HH:mm:ss')
            });
        }

        ctx.body = {
            type: TYPE,
            status: 0,
            data: {}
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});

// 获取用户的模型列表以及分享给用户的模型
router.use('/my-all-models', auth);
router.get('/my-all-models', async (ctx, next) => {
    const TYPE = 'personal/my-all-models';
    try {
        const userModels = await modelModel.findAllByUsername(ctx.state.user.user);
        const shareModels = await shareModelModel.findAllByUsername(ctx.state.user.user);

        const date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        const cur = moment(date);
        let dateDiff = {};
        let createTime = '';
        const resData = {
            userModels: [],
            shareModels: []
        };

        userModels.concat(shareModels).forEach(model => {
            dateDiff = moment.preciseDiff(moment(model.create_time), cur, true);

            if (
                dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 0
                    && dateDiff.firstDateWasLater
                ) {
                createTime = moment(model.create_time).format('HH:mm');
            }
            else {
                createTime = moment(model.create_time).format('YYYY年MM月DD日 HH:mm');
            }

            model.modelName = model.name ? model.name : `ID${model.id}`;
            model.createTime = createTime;
            model.timestamp = moment(model.create_time).unix();
            model.trainType = model.train_type === 'quick_train' ? 1 : 2;

            if (model.share_user_name) {
                model.from = model.share_user_name;
                resData.shareModels.push(model);
            }
            else {
                resData.userModels.push(model);
            }
        });

        resData.userModels.sort((a, b) => b.timestamp - a.timestamp);
        resData.shareModels.sort((a, b) => b.timestamp - a.timestamp);

        ctx.body = {
            type: TYPE,
            status: 0,
            data: resData
        };
    }
    catch (e) {
        ctx.logger.error(`${TYPE}: \n${e.stack ? e.stack : e}\n`);
        ctx.body = {
            type: TYPE,
            status: 1,
            statusInfo: '系统异常，请稍候再试'
        };
    }
});

export default router;

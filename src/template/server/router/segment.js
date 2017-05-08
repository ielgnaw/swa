/**
 * @file segment ajax 请求路由
 * @author ielgnaw(wuji0223@gmail.com)
 */

import {join, dirname, basename, extname} from 'path';
import {existsSync, statSync} from 'fs';
import KoaRouter from 'koa-router';
import moment from 'moment';
import fileSize from 'file-size';
import koaBodyPackage from 'koa-body';
import 'moment-precise-range-plugin';
import 'shelljs/global';
import uuid from 'uuid';

import modelModel from '../model/model';
import modifySetModel from '../model/modifySet';
import modifyQueryModel from '../model/modifyQuery';
import corpusModel from '../model/corpus';
import dictModel from '../model/dict';
import shareModelModel from '../model/shareModel';

import {uniqueArray} from '../util';

import auth from '../middleware/auth';
import {loadModel, segment, checkLoadModel, modifyTrain, train, deleteModel, deployNLPC} from '../service';

const koaBody = koaBodyPackage({
    multipart: true,
    formidable: {
        uploadDir: join(__dirname, '../..', '/data'),
        onFileBegin(name, file) {
            // 重新设置 file.path，相当于改名
            const folder = dirname(file.path);
            file.path = join(folder, file.name);
            if (existsSync(file.path)) {
                const extName = extname(file.path);
                file.path = join(
                    folder,
                    basename(file.path, extName)
                        + '-'
                        + moment().format('XSSS')
                        + extName
                );
            }
        }
    }
});

const router = new KoaRouter({
    prefix: '/segment'
});

// 获取用户的模型列表
router.use('/model-list', auth);
router.get('/model-list', async (ctx, next) => {
    const TYPE = 'segment/model-list';

    try {
        const commonModels = await modelModel.findCommon();
        /* eslint-disable fecs-prefer-async-await */
        const userModels = await modelModel.findByUsername(ctx.state.user.user);
        const shareModels = await shareModelModel.findByUsername(ctx.state.user.user);
        /* eslint-enable fecs-prefer-async-await */
        // const models = commonModels.concat(userModels).concat(shareModels);
        const models = commonModels.concat(userModels).concat([]);
        // 如果选择别人分享给我的模型，那么要注意快速干预和完整重训最终的提交 这块有点问题要改改

        const date = new Date();
        date.setHours(0);
        date.setMinutes(0);
        date.setSeconds(0);
        date.setMilliseconds(0);
        const cur = moment(date);

        let dateDiff = {};
        let createTime = '';
        const resData = {};

        models.forEach(model => {
            const {id, type} = model;
            const modelName = model.name ? model.name : `ID${id}`;
            if (type === 'common') {
                if (!resData[type]) {
                    resData[type] = {};
                }
                resData[type][id] = {
                    name: modelName,
                    size: fileSize(statSync(model.local_path).size, {fixed: 1}).human('jedec')
                };
            }
            else if (type === 'personal') {
                if (!resData[type]) {
                    resData[type] = [];
                }
                dateDiff = moment.preciseDiff(moment(model.create_time), cur, true);
                // console.log(moment(model.create_time).format('YYYY年MM月DD日 HH:mm'));
                // console.log(dateDiff);
                // console.log();

                if (
                    dateDiff.years === 0 && dateDiff.months === 0 && dateDiff.days === 0
                        && dateDiff.firstDateWasLater
                    ) {
                    if (dateDiff.hours === 0) {
                        createTime = `${dateDiff.minutes}分钟前`;
                    }
                    else {
                        createTime = `${dateDiff.hours}小时前`;
                    }
                    createTime = moment(model.create_time).format('HH:mm');
                }
                else {
                    createTime = moment(model.create_time).format('YYYY年MM月DD日 HH:mm');
                }

                resData[type].push({
                    modelId: id,
                    trainMethod: model.train_method,
                    trainType: model.train_type === 'quick_train' ? 1 : 2,
                    modelName: modelName,
                    createTime: createTime,
                    timestamp: moment(model.create_time).unix(),
                    shareUsername: model.share_user_name || null
                });
            }
        });

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

// 试用切词
router.use('/trail', auth);
router.post('/trail', async (ctx, next) => {
    const TYPE = 'segment/trail';

    try {
        const modelId = ctx.request.body.modelId;

        // common_basic, common_phrase 时不需要 check_load_model_status
        if (modelId !== '1' && modelId !== '2') {
            const checkLoadModelRet = await checkLoadModel(modelId);
            if (String(checkLoadModelRet.status) !== '0') {
                ctx.logger.error(`error in check_load_model_status, message: ${checkLoadModelRet.result.msg}`);
                ctx.body = {
                    type: 'segment/trail',
                    status: 4,
                    statusInfo: '系统异常，请稍候再试'
                };
                return;
            }

            // check_status 0: 未加载. 1: 加载中. 2: 加载成功. 3: 失败
            const checkStatus = String(checkLoadModelRet.result.check_status);

            if (checkStatus === '3') {
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: '系统异常，请稍候再试'
                };
                return;
            }

            // 0 这个状态暂时取消
            // if (checkStatus === '0') {
            //     ctx.body = {
            //         type: TYPE,
            //         status: 0,
            //         data: 'unloaded'
            //     };
            //     return;
            // }

            if (checkStatus === '1') {
                ctx.body = {
                    type: TYPE,
                    status: 0,
                    data: 'loading'
                };
                return;
            }
        }

        const wordList = ctx.request.body.wordList;

        const segmentRet = await segment(modelId, wordList);
        if (String(segmentRet.status) !== '0') {
            ctx.logger.error(`error in segment words, message: ${segmentRet.result.msg}`);
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: '系统异常，请稍候再试'
            };
            return;
        }

        ctx.body = {
            type: TYPE,
            status: 0,
            data: segmentRet.result.gold
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

// 从前端加载模型
router.use('/load-model', auth);
router.get('/load-model', async (ctx, next) => {
    const TYPE = 'segment/load-model';

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

        // 验证 model
        if (curModel[0].status !== 4) {
            ctx.body = {
                type: TYPE,
                status: 3,
                statusInfo: `model [${modelId}] not prepared yet`
            };
            return;
        }

        /* eslint-disable fecs-prefer-async-await */
        const loadModelRet = await loadModel(modelId);
        /* eslint-enable fecs-prefer-async-await */
        if (String(loadModelRet.status) !== '0') {
            ctx.logger.error(`${TYPE}: \nerror in load model, message: ${loadModelRet.result.msg}\n`);
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: '系统异常，请稍候再试'
            };
            return;
        }

        ctx.body = {
            type: TYPE,
            status: 0,
            data: loadModelRet
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

// 检测 modelname 是否被使用
router.use('/check-modelname', auth);
router.get('/check-modelname', async (ctx, next) => {
    const TYPE = 'segment/check-modelname';

    try {
        const modelName = ctx.query.modelName;
        const ret = await modelModel.findByNameAndUsername(modelName, ctx.state.user.user);
        ctx.body = {
            type: TYPE,
            status: 0,
            data: ret
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

// 保存用户编辑后的切分结果，发起快速修改定制训练。快速修改定制训练
router.use('/modify-seg-train', auth);
router.post('/modify-seg-train', async (ctx, next) => {
    const TYPE = 'segment/modify-seg-train';

    try {
        const {modelName, baseModelId, modifySetId, queryList} = ctx.request.body;

        // modifySetId 不为 0 那么就从数据库中查找到引用的这个 modifySet
        // 这里如果 modifySet 存在，最终也是要新增一个 modifySet，这里只是检查这个引用是否存在而已
        if (String(modifySetId) !== '0') {
            const curModifySet = await modifySetModel.findById(modifySetId);
            if (!curModifySet.length) {
                ctx.body = {
                    type: TYPE,
                    status: 2,
                    statusInfo: `not find modify_set of id [${modifySetId}]`
                };
                return;
            }
        }

        // 待插入的 modifySet 对象
        const candidateInsertModifySet = {
            username: ctx.state.user.user,
            queryIds: '',
            baseModelId: baseModelId
        };

        // 后面发起训练时需要
        const golds = [];

        /* eslint-disable fecs-use-for-of */
        for (let i in queryList) {
            if (!queryList.hasOwnProperty(i)) {
                continue;
            }
            golds.push(queryList[i]);
            const insertModifyQueryRet = await modifyQueryModel.insert({
                username: ctx.state.user.user,
                baseModelId: baseModelId,
                query: i,
                gold: queryList[i]
            });
            candidateInsertModifySet.queryIds += `${insertModifyQueryRet[0]},`;
        }
        /* eslint-enable fecs-use-for-of */
        candidateInsertModifySet.queryIds = candidateInsertModifySet.queryIds.replace(/,$/, '');

        // const insertModifySet = await modifySetModel.insert(candidateInsertModifySet);

        /* eslint-disable fecs-prefer-async-await */
        await modifySetModel.insert(candidateInsertModifySet);

        // 插入到 modify_set 表后，原系统是根据这条 modify_set 记录的 query_ids 去查询 modify_query 表对应的 gold
        // 在这里，因为可以直接获取到 gold 了，所以就省略了这一步
        // const newModifySetId = insertModifySet[0];

        // 找 model
        const curModel = await modelModel.findById(baseModelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `not find model [${baseModelId}]`
            };
            return;
        }

        const modifyTrainRet = await modifyTrain(ctx.state.user.user, curModel[0].grade, curModel[0].id, golds);
        const modifyTrainRetStatus = String(modifyTrainRet.status);
        if (modifyTrainRetStatus !== '0') {
            if (modifyTrainRetStatus === '2') {
                ctx.body = {
                    type: TYPE,
                    status: 3,
                    statusInfo: '快速干预模型数量超过上限'
                };
            }
            else {
                ctx.logger.error(`quick_train failed, message: ${modifyTrainRet.result.msg}`);
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: `error occurs in quick_train, message: [${modifyTrainRet.result.msg}]`
                };
            }
            return;
        }

        await modelModel.insert({
            id: modifyTrainRet.result.model_id,
            modelName: modelName,
            baseModelId: baseModelId,
            username: ctx.state.user.user,
            grade: curModel[0].grade,
            trainType: 'quick_train',
            createTime: moment().format('YYYY-MM-DD HH:mm:ss')
        });
        /* eslint-enable fecs-prefer-async-await */

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

// 干预模型生成失败后，重新生成干预模型
// 先获取出当前失败的这个 model 的信息，然后从数据库中删除这条记录，然后调用 quick_train，之后根据返回的 modelId 重新插入一条新的 model
router.use('/re-quick-train', auth);
router.post('/re-quick-train', async (ctx, next) => {
    const TYPE = 'segment/modify-seg-train';
    try {
        // 待删除的那个 model
        const candidateModel = ctx.request.body;
        const execModel = candidateModel.share_user_name ? shareModelModel : modelModel;

        /* eslint-disable fecs-prefer-async-await */
        await execModel.instance().where({
            id: candidateModel.id
        }).del();

        const baseModelId = candidateModel.base_model_id;
        const golds = [];
        const modifyQueryRet = await modifyQueryModel.findByBaseModelId(baseModelId);
        modifyQueryRet.forEach(item => {
            golds.push(item.gold);
        });

        const modifyTrainRet = await modifyTrain(ctx.state.user.user, candidateModel.grade, candidateModel.id, golds);
        const modifyTrainRetStatus = String(modifyTrainRet.status);
        if (modifyTrainRetStatus !== '0') {
            if (modifyTrainRetStatus === '2') {
                ctx.body = {
                    type: TYPE,
                    status: 3,
                    statusInfo: '快速干预模型数量超过上限'
                };
            }
            else {
                ctx.logger.error(`quick_train failed, message: ${modifyTrainRet.result.msg}`);
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: `error occurs in quick_train, message: [${modifyTrainRet.result.msg}]`
                };
            }
            return;
        }

        const insertArgs = {
            id: modifyTrainRet.result.model_id,
            modelName: candidateModel.name,
            baseModelId: baseModelId,
            username: ctx.state.user.user,
            grade: candidateModel.grade,
            trainType: 'quick_train',
            createTime: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        if (candidateModel.share_user_name) {
            insertArgs.shareUsername = candidateModel.share_user_name;
        }

        await execModel.insert(insertArgs);
        /* eslint-enable fecs-prefer-async-await */

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

// 按应用完整定制
router.use('/train', auth);
/* eslint-disable fecs-max-statements */
// router.post('/train', koaBody, async (ctx, next) => {
//     const TYPE = 'segment/train';

//     try {
//         const {fields, files} = ctx.request.body;

//         const {baseModelId, method, modelName} = fields || {};
//         if (!baseModelId) {
//             ctx.body = {
//                 type: TYPE,
//                 status: 2,
//                 statusInfo: 'param [baseModelId] is required'
//             };
//             return;
//         }
//         if (!method) {
//             ctx.body = {
//                 type: TYPE,
//                 status: 2,
//                 statusInfo: 'param [method] is required'
//             };
//             return;
//         }
//         if (!modelName) {
//             ctx.body = {
//                 type: TYPE,
//                 status: 2,
//                 statusInfo: 'param [modelName] is required'
//             };
//             return;
//         }

//         // const {dict, corpus} = files || {};
//         // 上传文件过来的或者是从已上传的文件夹选择过来的
//         let dict = files.dict || (fields.dict === 'null' ? null : fields.dict);
//         // 上传文件过来的或者是从已上传的文件夹选择过来的
//         let corpus = files.corpus || (fields.corpus === 'null' ? null : fields.corpus);

//         if (!dict && !corpus) {
//             ctx.body = {
//                 type: TYPE,
//                 status: 2,
//                 statusInfo: 'get upload file failed'
//             };
//             return;
//         }

//         // 找 model
//         const curModel = await modelModel.findById(baseModelId);
//         if (!curModel.length) {
//             ctx.body = {
//                 type: TYPE,
//                 status: 2,
//                 statusInfo: `not find model [${baseModelId}]`
//             };
//             return;
//         }

//         // const corpusPath = corpus ? corpus.path : '';
//         // const dictPath = dict ? dict.path : '';
//         let corpusPath;
//         let corpusSize;
//         if (corpus) {
//             // 说明是点击上传来的，需要创建新的上传文件，如果重名了，则新上传的文件名添加时间戳
//             if (typeof corpus === 'object') {
//                 corpusPath = corpus.path;
//                 corpusSize = corpus.size;

//                 // 记录传过来的路径中是否有 username，即路径是否是 /xxx/yyy/zzz/username
//                 const isPathHasUsername = (dirname(corpusPath).split(/(\\|\/)/g).pop() === ctx.state.user.user);

//                 const userDir = isPathHasUsername
//                     ? join(dirname(corpusPath), 'corpus')
//                     : join(dirname(corpusPath), ctx.state.user.user, 'corpus');

//                 if (!existsSync(userDir)) {
//                     mkdir('-p', userDir);
//                 }

//                 let newCorpusPath = join(userDir, corpusPath.split(/(\\|\/)/g).pop());
//                 if (existsSync(newCorpusPath)) {
//                     const extName = extname(newCorpusPath);
//                     newCorpusPath = join(
//                         userDir,
//                         basename(newCorpusPath, extName) + '-' + moment().format('XSSS') + extName
//                     );
//                 }
//                 if (isPathHasUsername) {
//                     cp('-n', corpusPath, newCorpusPath);
//                 }
//                 else {
//                     mv('-n', corpusPath, newCorpusPath);
//                 }
//                 corpusPath = newCorpusPath;
//             }
//             // 说明是从已上传的文件夹选择来的，不需要创建新文件了
//             else {
//                 const extName = extname(corpus);
//                 corpusPath = join(
//                     dirname(corpus),
//                     basename(corpus, extName) + '-' + moment().format('XSSS') + extName
//                 );
//                 cp('-n', corpus, corpusPath);
//                 corpusSize = statSync(corpusPath).size;
//             }
//         }

//         let dictPath;
//         let dictSize;
//         if (dict) {
//             // 说明是点击上传来的，需要创建新的上传文件，如果重名了，则新上传的文件名添加时间戳
//             if (typeof dict === 'object') {
//                 dictPath = dict.path;
//                 dictSize = dict.size;

//                 // 记录传过来的路径中是否有 username，即路径是否是 /xxx/yyy/zzz/username
//                 const isPathHasUsername = (dirname(dictPath).split(/(\\|\/)/g).pop() === ctx.state.user.user);

//                 const userDir = isPathHasUsername
//                     ? join(dirname(dictPath), 'dict')
//                     : join(dirname(dictPath), ctx.state.user.user, 'dict');

//                 if (!existsSync(userDir)) {
//                     mkdir('-p', userDir);
//                 }

//                 let newDictPath = join(userDir, dictPath.split(/(\\|\/)/g).pop());
//                 if (existsSync(newDictPath)) {
//                     const extName = extname(newDictPath);
//                     newDictPath = join(
//                         userDir,
//                         basename(newDictPath, extName) + '-' + moment().format('XSSS') + extName
//                     );
//                 }
//                 if (isPathHasUsername) {
//                     cp('-n', dictPath, newDictPath);
//                 }
//                 else {
//                     mv('-n', dictPath, newDictPath);
//                 }
//                 dictPath = newDictPath;
//             }
//             // 说明是从已上传的文件夹选择来的，不需要创建新文件了
//             else {
//                 const extName = extname(dict);
//                 console.log('dict', dict);
//                 console.log('dirname(dict)', dirname(dict));
//                 console.log('basename(dict, extName)', basename(dict, extName));
//                 console.log('dictPath.split(/(\\|\/)/g).pop()', dict.split(/(\\|\/)/g).pop());
//                 console.log('extName', extName);
//                 dictPath = join(
//                     dirname(dict),
//                     basename(dict, extName) + '-' + moment().format('XSSS') + extName
//                 );
//                 cp('-n', dict, dictPath);
//                 dictSize = statSync(dictPath).size;
//             }
//         }

//         ctx.body = {
//             status: 0
//         };
//         return;

//         /* eslint-disable fecs-prefer-async-await */
//         const trainRet = await train(
//             ctx.state.user.user,
//             method,
//             curModel[0].grade,
//             baseModelId,
//             corpusPath,
//             dictPath
//         );

//         const trainRetStatus = String(trainRet.status);
//         if (trainRetStatus !== '0') {
//             if (trainRetStatus === '2') {
//                 ctx.body = {
//                     type: TYPE,
//                     status: 3,
//                     statusInfo: '完整定制模型数量超过上限'
//                 };
//             }
//             else {
//                 ctx.logger.error(`train failed, message: ${trainRetStatus.result.msg}`);
//                 ctx.body = {
//                     type: TYPE,
//                     status: 4,
//                     statusInfo: `error occurs in train, message: [${trainRetStatus.result.msg}]`
//                 };
//             }
//             return;
//         }

//         let newCorpusId = 0;
//         if (corpusPath) {
//             const insertCorpusRet = await corpusModel.insert({
//                 username: ctx.state.user.user,
//                 localPath: corpusPath,
//                 fileSize: corpusSize
//             });
//             newCorpusId = insertCorpusRet[0];
//         }

//         let newDictId = 0;
//         if (dictPath) {
//             const insertDictRet = await dictModel.insert({
//                 username: ctx.state.user.user,
//                 localPath: dictPath,
//                 fileSize: dictSize
//             });
//             newDictId = insertDictRet[0];
//         }

//         // 这里插入 model 的时候不插入 corpus_id 了，
//         // 因为新版除了 corpus 以外还增加了 dict，而 model 里只有 corpus_id，
//         // 暂时先不在 model 表中增加 dict_id 了
//         // new_corpus 和 new_dict 表中的 model_id 已经和 model 表对应上了
//         await modelModel.insert({
//             id: trainRet.result.model_id,
//             modelName: modelName,
//             baseModelId: baseModelId,
//             username: ctx.state.user.user,
//             grade: curModel[0].grade,
//             trainMethod: method,
//             dictId: newDictId,
//             corpusId: newCorpusId,
//             trainType: 'train',
//             createTime: moment().format('YYYY-MM-DD HH:mm:ss')
//         });

//         /* eslint-enable fecs-prefer-async-await */

//         ctx.body = {
//             type: TYPE,
//             status: 0,
//             data: {}
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
router.post('/train', koaBody, async (ctx, next) => {
    const TYPE = 'segment/train';

    try {
        const {fields, files} = ctx.request.body;

        const {baseModelId, method, modelName} = fields || {};
        if (!baseModelId) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'param [baseModelId] is required'
            };
            return;
        }
        if (!method) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'param [method] is required'
            };
            return;
        }
        if (!modelName) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'param [modelName] is required'
            };
            return;
        }
        // 找 model
        const curModel = await modelModel.findById(baseModelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `not find model [${baseModelId}]`
            };
            return;
        }

        // 上传文件过来的或者是从已上传的文件夹选择过来的
        let dict = files.dict || (fields.dict === 'null' ? null : fields.dict);
        // 上传文件过来的或者是从已上传的文件夹选择过来的
        let corpus = files.corpus || (fields.corpus === 'null' ? null : fields.corpus);

        if (!dict && !corpus) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: 'get upload file failed'
            };
            return;
        }

        let dictPath;
        let dictSize;
        let dictName;
        if (dict) {
            // 说明是点击上传来的，需要创建新的上传文件，如果重名了，则新上传的文件名添加时间戳
            if (typeof dict === 'object') {
                dictPath = dict.path;
                dictSize = dict.size;
                const fileDir = join(dirname(dictPath), ctx.state.user.user, 'dict');
                if (!existsSync(fileDir)) {
                    mkdir('-p', fileDir);
                }

                const extName = extname(dict.name);
                dictName = dict.name.replace(extName, '');

                const newDictPath = join(fileDir, uuid() + extName);
                mv('-n', dictPath, newDictPath);

                dictPath = newDictPath;
            }
            else {
                // 通过 dictName 截取 dictId
                /.*-(\d*)$/g.test(dict);
                const dictId = RegExp.$1;
                // 通过 id 找 dict
                const curDict = await dictModel.findById(dictId);
                if (!curDict.length) {
                    ctx.body = {
                        type: TYPE,
                        status: 2,
                        statusInfo: `not find dict [${dictId}]`
                    };
                    return;
                }

                dictPath = curDict[0].local_path;
                dictSize = curDict[0].file_size;
                dictName = curDict[0].name;

                const newDictPath = join(dirname(curDict[0].local_path), uuid() + extname(curDict[0].local_path));
                cp('-n', dictPath, newDictPath);

                dictPath = newDictPath;
            }
        }

        let corpusPath;
        let corpusSize;
        let corpusName;
        if (corpus) {
            // 说明是点击上传来的，需要创建新的上传文件，如果重名了，则新上传的文件名添加时间戳
            if (typeof corpus === 'object') {
                corpusPath = corpus.path;
                corpusSize = corpus.size;
                const fileDir = join(dirname(corpusPath), ctx.state.user.user, 'corpus');
                if (!existsSync(fileDir)) {
                    mkdir('-p', fileDir);
                }

                const extName = extname(corpus.name);
                corpusName = corpus.name.replace(extName, '');

                const newCorpusPath = join(fileDir, uuid() + extName);
                mv('-n', corpusPath, newCorpusPath);

                corpusPath = newCorpusPath;
            }
            else {
                // 通过 corpusName 截取 corpusId
                /.*-(\d*)$/g.test(corpus);
                const corpusId = RegExp.$1;
                // 通过 id 找 corpus
                const curCorpus = await corpusModel.findById(corpusId);
                if (!curCorpus.length) {
                    ctx.body = {
                        type: TYPE,
                        status: 2,
                        statusInfo: `not find corpus [${corpusId}]`
                    };
                    return;
                }

                corpusPath = curCorpus[0].local_path;
                corpusSize = curCorpus[0].file_size;
                corpusName = curCorpus[0].name;

                const newCorpusPath = join(dirname(curCorpus[0].local_path), uuid() + extname(curCorpus[0].local_path));
                cp('-n', corpusPath, newCorpusPath);

                corpusPath = newCorpusPath;
            }
        }

        /* eslint-disable fecs-prefer-async-await */
        const trainRet = await train(
            ctx.state.user.user,
            method,
            curModel[0].grade,
            baseModelId,
            corpusPath,
            dictPath
        );

        const trainRetStatus = String(trainRet.status);
        if (trainRetStatus !== '0') {
            if (trainRetStatus === '2') {
                ctx.body = {
                    type: TYPE,
                    status: 3,
                    statusInfo: '完整定制模型数量超过上限'
                };
            }
            else {
                ctx.logger.error(`train failed, message: ${trainRetStatus.result.msg}`);
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: `error occurs in train, message: [${trainRetStatus.result.msg}]`
                };
            }
            return;
        }

        let newCorpusId = 0;
        if (corpusPath) {
            const insertCorpusRet = await corpusModel.insert({
                username: ctx.state.user.user,
                localPath: corpusPath,
                fileSize: corpusSize,
                name: corpusName
            });
            newCorpusId = insertCorpusRet[0];
        }

        let newDictId = 0;
        if (dictPath) {
            const insertDictRet = await dictModel.insert({
                username: ctx.state.user.user,
                localPath: dictPath,
                fileSize: dictSize,
                name: dictName
            });
            newDictId = insertDictRet[0];
        }

        // 这里插入 model 的时候不插入 corpus_id 了，
        // 因为新版除了 corpus 以外还增加了 dict，而 model 里只有 corpus_id，
        // 暂时先不在 model 表中增加 dict_id 了
        // new_corpus 和 new_dict 表中的 model_id 已经和 model 表对应上了
        await modelModel.insert({
            id: trainRet.result.model_id,
            modelName: modelName,
            baseModelId: baseModelId,
            username: ctx.state.user.user,
            grade: curModel[0].grade,
            trainMethod: method,
            dictId: newDictId,
            corpusId: newCorpusId,
            trainType: 'train',
            createTime: moment().format('YYYY-MM-DD HH:mm:ss')
        });

        /* eslint-enable fecs-prefer-async-await */

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

/* eslint-enable fecs-max-statements */

// 获取用户上传的词典列表
router.use('/dict-list', auth);
router.get('/dict-list', async (ctx, next) => {
    const TYPE = 'segment/dict-list';

    try {
        let userDicts = await dictModel.findByUsername(ctx.state.user.user);

        const cur = moment();
        let dateDiff = {};
        let createTime = '';
        const resData = {
            list: []
        };

        // userDicts = uniqueArray(userDicts, 'local_path');
        userDicts.forEach(dict => {
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

            resData.list.push({
                id: dict.id,
                name: `${dict.name}-${dict.id}`,
                fileSize: dict.file_size,
                showFileSize: fileSize(dict.file_size, {fixed: 1}).human('jedec'),
                createTime: createTime,
                timestamp: moment(dict.create_time).unix(),
                realPath: dict.local_path
            });
        });

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

// 获取用户上传的切分语料
router.use('/corpus-list', auth);
router.get('/corpus-list', async (ctx, next) => {
    const TYPE = 'segment/corpus-list';

    try {
        let userCorpus = await corpusModel.findByUsername(ctx.state.user.user);

        const cur = moment();
        let dateDiff = {};
        let createTime = '';
        const resData = {
            list: []
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

            resData.list.push({
                id: corpus.id,
                name: `${corpus.name}-${corpus.id}`,
                fileSize: corpus.file_size,
                showFileSize: fileSize(corpus.file_size, {fixed: 1}).human('jedec'),
                createTime: createTime,
                timestamp: moment(corpus.create_time).unix(),
                realPath: corpus.local_path
            });
        });

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

// 删除模型
router.use('/delete-model', auth);
router.get('/delete-model', async (ctx, next) => {
    const TYPE = 'segment/delete-model';

    try {
        const modelId = ctx.query.modelId;
        const isShareModel = ctx.query.isShareModel;
        const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

        // 检查模型是否存在
        const curModel = await execModel.findById(modelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `model [${modelId}] not exist`
            };
            return;
        }

        // 检测模型是否属于用户
        if (curModel[0].user_name !== ctx.state.user.user) {
            ctx.body = {
                type: TYPE,
                status: 3,
                statusInfo: `this model belongs to ${curModel[0].user_name}`
            };
            return;
        }

        // 检测是否作为其他模型的 base model，并且正在训练
        /* eslint-disable fecs-prefer-async-await */
        const successor = await execModel.instance().where({
            base_model_id: modelId
        }).andWhere('status', '<', 4).select();

        if (successor.length) {
            ctx.body = {
                type: TYPE,
                status: 4,
                statusInfo: `model ${successor[0].id} is based on ${modelId} and is training.`
            };
            return;
        }

        // const deleteModelRet = await deleteModel(modelId);
        await deleteModel(modelId);

        // if (String(deleteModelRet.status) !== '0') {
        //     ctx.logger.error(`request model training failed, message: ${deleteModelRet.result.msg}`);
        //     ctx.body = {
        //         type: TYPE,
        //         status: 4,
        //         statusInfo: '系统异常，请稍候再试'
        //     };
        //     return;
        // }

        // 删除本地文件
        const localPath = curModel[0].local_path;
        if (localPath) {
            rm('-rf', localPath);
        }

        await execModel.instance().where({
            id: modelId
        }).del();

        /* eslint-enable fecs-prefer-async-await */

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

// 修改模型名称
router.use('/update-model', auth);
router.get('/update-model', async (ctx, next) => {
    const TYPE = 'segment/update-model';

    try {
        const modelId = ctx.query.modelId;
        const newModelName = ctx.query.newModelName;
        const isShareModel = ctx.query.isShareModel;
        const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

        // 检查模型是否存在
        const curModel = await execModel.findById(modelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `model [${modelId}] not exist`
            };
            return;
        }

        // 检测模型是否属于用户
        if (curModel[0].user_name !== ctx.state.user.user) {
            ctx.body = {
                type: TYPE,
                status: 3,
                statusInfo: `this model belongs to ${curModel[0].user_name}`
            };
            return;
        }

        /* eslint-disable fecs-prefer-async-await */
        await execModel.instance().where({
            id: modelId
        }).update({
            name: newModelName
        });
        /* eslint-enable fecs-prefer-async-await */

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

// 远程调用部署到 nlpc
router.use('/deploy-nlpc', auth);
router.get('/deploy-nlpc', async (ctx, next) => {
    const TYPE = 'segment/deploy-nlpc';

    try {
        const modelId = ctx.query.modelId;
        const isShareModel = ctx.query.isShareModel;
        const execModel = (isShareModel === '1' ? shareModelModel : modelModel);

        // 检查模型是否存在
        const curModel = await execModel.findById(modelId);
        if (!curModel.length) {
            ctx.body = {
                type: TYPE,
                status: 2,
                statusInfo: `model [${modelId}] not exist`
            };
            return;
        }

        // 检测模型是否属于用户
        if (curModel[0].user_name !== ctx.state.user.user) {
            ctx.body = {
                type: TYPE,
                status: 3,
                statusInfo: `this model belongs to ${curModel[0].user_name}`
            };
            return;
        }

        /* eslint-disable fecs-prefer-async-await */
        const deployRet = await deployNLPC(modelId);

        const deployRetStatus = String(deployRet.status);
        if (deployRetStatus !== '0') {
            if (deployRetStatus === '2') {
                ctx.body = {
                    type: TYPE,
                    status: 2,
                    statusInfo: '每个用户最多同时部署三个模型'
                };
            }
            else {
                ctx.logger.error(`deployNLPC failed, message: ${deployRet.result.msg}`);
                ctx.body = {
                    type: TYPE,
                    status: 4,
                    statusInfo: '系统异常，请稍候再试'
                };
            }
            return;
        }

        // 这里把 nlpc_status 改变为 6，作为表格中已经点击了远程调用部署按钮的一个标识
        await execModel.instance().where({
            id: modelId
        }).update({
            nlpc_status: 6
        });

        /* eslint-enable fecs-prefer-async-await */

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

export default router;

/**
 * @file webpack prod config
 * @author <%- author %>
 */

import fs from 'fs';
import {join, resolve, extname, basename, relative} from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CompressionWebpackPlugin from 'compression-webpack-plugin';

import RemoveScriptTagPlugin from './remove-script-tag-plugin';
import config from './config';
import devEnv from './dev.env';
import {assetsPath, styleLoaders} from './util';
import baseWebpackConfig from './webpack.base.conf';


/**
 * entry 下所有的 tpl 文件集合
 *
 * @type {Array}
 */
const entryTplList = [];

/**
 * 遍历 entry 下的 tpl 文件
 *
 * @param {string} filePath 遍历的目录
 */
(function walkTpl(filePath) {
    const dirList = fs.readdirSync(filePath);
    dirList.forEach(item => {
        if (fs.statSync(filePath + '/' + item).isDirectory()) {
            walkTpl(filePath + '/' + item);
        }
        else {
            const extName = extname(item);
            if (extName === '.tpl' || extName === '.html') {
                entryTplList.push({
                    chunksName: basename(item).replace(extName, ''),
                    filename: relative('.', filePath + '/' + item)
                });
            }
        }
    });
})(join(__dirname, '..', 'server/view'));

const env = process.env.NODE_ENV === 'development' ? devEnv : config.build.env;

/**
 * webpack plugin 集合
 *
 * @type {Array}
 */
const webpackPluginList = [
    new webpack.DefinePlugin({
        'process.env': env
    }),
    new webpack.optimize.UglifyJsPlugin({
        // 最紧凑的输出
        beautify: false,
        compress: {
            // 在 UglifyJs 删除没有用到的代码时不输出警告
            warnings: false,
            // 删除所有的 console，可以兼容 ie 浏览器
            drop_console: true,
            // 内嵌定义了但是只用到一次的变量
            collapse_vars: true,
            // 提取出出现多次但是没有定义成变量去引用的静态值
            reduce_vars: true,
        },
        output: {
            comments: false
        }
    }),
    // extract css into its own file
    new ExtractTextPlugin(assetsPath('css/[name].[contenthash].css'))
];

entryTplList.forEach(item => {
    webpackPluginList.push(
        new HtmlWebpackPlugin({
            // 最终生成的 html 文件名称，其中可以带上路径名
            filename: resolve(__dirname, `../client/output/${item.chunksName}.html`),
            // 页面模板的地址, 支持一些特殊的模板, 比如 jade, ejs, handlebar 等
            template: `../server/view/${item.chunksName}.html`,
            inject: 'body',
            minify: {
                removeComments: true,
                collapseWhitespace: true
            },
            // 文件中插入的 entry 名称，注意必须在 entry 中有对应的申明
            // 或者是使用 CommonsChunkPlugin 提取出来的 chunk. 简单理解即页面需要读取的 js 文件模块
            chunks: [item.chunksName, 'vendor', 'manifest'],
            // 如果打开 vendor 和 manifest 那么需要配置 chunksSortMode 保证引入 script 的顺序
            chunksSortMode: 'dependency',
            // 是否给页面的资源文件后面增加 hash, 防止读取缓存
            hash: false
        })
    );
});

Array.prototype.push.apply(webpackPluginList, [
    // split vendor js into its own file
    /* eslint-disable fecs-use-method-definition */
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: (module, count) => module.resource
            && /\.js$/.test(module.resource)
            && module.resource.indexOf(
                join(__dirname, '../node_modules')
            ) === 0
    }),
    /* eslint-enable fecs-use-method-definition */

    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        chunks: ['vendor']
    })
]);

const webpackConfig = merge(baseWebpackConfig, {
    module: {
        rules: styleLoaders({sourceMap: config.build.productionSourceMap, extract: true})
    },
    devtool: config.build.productionSourceMap ? '#eval-source-map' : false,
    output: {
        path: config.build.assetsRoot,
        filename: assetsPath('js/[name].[chunkhash].js'),
        chunkFilename: assetsPath('js/[id].[chunkhash].js')
    },
    plugins: webpackPluginList.concat(new RemoveScriptTagPlugin())
});

if (config.build.productionGzip) {
    webpackConfig.plugins.push(
        new CompressionWebpackPlugin({
            asset: '[path].gz[query]',
            algorithm: 'gzip',
            test: new RegExp('\\.(' + config.build.productionGzipExtensions.join('|') + ')$'),
            threshold: 10240,
            minRatio: 0.8
        })
    );
}

export default webpackConfig;

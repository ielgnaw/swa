import {resolve} from 'path';
import eslintFriendlyFormatter from 'eslint-friendly-formatter';
import config from './config';
import {assetsPath} from './util';

const PROJECT_ROOT = resolve(__dirname, '../client');
const NODE_MODULES_DIR = resolve(__dirname, '../node_modules');

export default {
    context: PROJECT_ROOT,
    entry: {
        // 这里的 key 要和 server/view 中 html 的名字一样，方便 build product 时遍历文件时获取到 chunksName
        index: ['./App.js']
    },
    output: {
        path: config.build.assetsRoot,
        publicPath: process.env.NODE_ENV === 'development'
            ? config.dev.assetsPublicPath
            : config.build.assetsPublicPath,
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
            NODE_MODULES_DIR,
            'node_modules'
        ],
        alias: {
            'src': resolve(__dirname, '../client'),
            'react': 'react/dist/react.js',
            'react-dom': 'react-dom/dist/react-dom.js'
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: 'babel-loader?cacheDirectory',
                include: PROJECT_ROOT,
                exclude: /(node_modules|bower_components)/,
                options: {
                    presets: ['react', 'es2015', 'stage-2']
                }
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 1000,
                    name: assetsPath('img/[name].[hash:7].[ext]')
                }
            },
            {
                test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
                loader: 'url-loader',
                options: {
                    limit: 1000,
                    name: assetsPath('font/[name].[hash:7].[ext]')
                }
            }
        ]
    },
    // eslint: {
    //     formatter: eslintFriendlyFormatter
    // }
};

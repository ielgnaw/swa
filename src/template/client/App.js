/**
 * @file 入口
 * @author <%- author %>
 */

import React, {Component} from 'react';
import {render} from 'react-dom';

import './css/common.styl';

render(
    <div>
        <ul>
            <li>11</li>
            <li>22</li>
            <li>33</li>
            <li>44</li>
        </ul>
        <span className="ccc"></span>
        <img src="https://www.baidu.com/img/baidu_jgylogo3.gif" />
        <img src={require('./css/img/react-logo.png')} style={{width: 50, height: 50}}/>
        <br/>
        <i className="icon-mute iconfont"></i>
        <br/>
    </div>,
    document.getElementById('root')
);

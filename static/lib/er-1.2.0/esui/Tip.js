/*
 * esui (ECOM Simple UI)
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Tip.js
 * desc:    提示控件
 * author:  linzhifeng, erik
 * date:    $Date: 2011-02-23 16:27:18 +0800 (Wed, 23 Feb 2011) $
 */

/**
 * 提示控件
 */
ui.Tip = function() {
    var LAYER_ID = '__TipLayer',
        TITLE_ID = '__TipLayerTitle',
        CLOSE_ID = '__TipLayerClose',
        ARROW_ID = '__TipLayerArrow',
        BODY_ID  = '__TipLayerBody',
        
        TITLE_CLASS = 'ui-tip-title',
        BODY_CLASS  = 'ui-tip-body',
        ARROW_CLASS = 'ui-tip-arrow',
        
        _layer,
        _isShow,
        _hideTimeout,
        _isInit;

    /**
     * 隐藏提示区
     *
     * @inner
     */
    function _hide() {
        _layer.hide();
        _isShow = false;
        
        var layerMain = _layer.getMain();
        layerMain.onmouseover = null;
        layerMain.onmouseout = null;
    }
    
    /**
     * 阻止提示区隐藏
     *
     * @inner
     */
    function _preventHide() {
        if (_hideTimeout) {
            clearTimeout(_hideTimeout);
            _hideTimeout = null;
        }
    }
    
    /**
     * 声明Tip的Class
     *
     * @class
     * @public
     */
    function Control(options) {
        this.__initOptions(options);
        this._type = 'tip-entrance';
        
        
        // 提示层的行为模式，over|click|auto
        this.mode = this.mode || 'over';

        if (this.hideDelay) {
            this.hideDelay = parseInt(this.hideDelay, 10);
        }
        if (this.disabled) {
            this.setState('disabled', 1);
        }
    }
    
    Control.prototype = {
        /**
         * 渲染控件
         *
         * @public
         * @param {HTMLElement} main 入口元素
         */
        render: function (main) {
            var me = this;
            var mode = me.mode;
            var showFunc = me._getDoShow();

            if (!me._isRender) {
                ui.Base.render.call(me, main);
                
                switch (mode)
                {
                case 'over':
                case 'click':
                    if (mode == 'over') {
                        main.onmouseover = showFunc;
                    } else {
                        main.onclick = showFunc;
                        main.style.cursor = 'pointer';
                    }
                    main.onmouseout = me._getOutHandler();
                    break;
                case 'auto':
                    showFunc();
                    break;
                }
                
                me._isRender = 1;
            }
        },
        
        /**
         * 获取显示提示区域的handler
         *
         * @private
         */
        _getDoShow: function () {
            var me = this;

            return function () {
                // 判断tip的可用性
                if (me.getState('disabled')) {
                    return;
                }
                
                // 构造提示的title和content
                var title = me.title;
                var content = me.content;
                if (typeof title == 'function') {
                    title = title.call(me);
                }
                if (typeof content == 'function') {
                    content = content.call(me);
                }
                
                // 显示tip
                _show(me._main, {
                    title       : title,
                    content     : content,
                    arrow       : me.arrow,
                    hideDelay   : me.hideDelay,
                    mode        : me.mode
                });
            };
        },
        
        /**
         * 获取鼠标移出的handler
         *
         * @private
         */
        _getOutHandler: function () {
            var me = this;

            return function () {
                Control.hide(me.hideDelay);
            };
        },
        
        /**
         * 释放控件
         *
         * @public
         */
        dispose: function () {
            if (this._main) {
                var main = this._main;
                main.onmouseover = null;
                main.onmouseout = null;
                this._main = null;
            }
        }
    };
    
    // 从控件基类派生
    ui.Base.derive(Control);
    
    /**
     * 显示提示
     *
     * @inner
     * @param {HTMLElement} entrance 入口元素
     * @param {Object}      tipInfo 提示信息
     */
    function _show(entrance, tipInfo) {
        if (!tipInfo || !entrance) {
            return;
        }

        !_isInit && Control._init();
        
        // 阻止浮动层的隐藏
        if (_isShow) {
            _preventHide();
        }
        
        // 填入标题与内容
        baidu.g(BODY_ID).innerHTML = tipInfo.content;
        var title = tipInfo.title;
        if (title) {
            baidu.g(TITLE_ID).innerHTML = title;
            baidu.show(TITLE_ID);
        } else {
            baidu.hide(TITLE_ID);
        }
        
        // 预初始化各种变量
        var arrow       = tipInfo.arrow, // 1|tr|rt|rb|br|bl|lb|lt|tl
            pos         = baidu.dom.getPosition(entrance),
            mainLeft    = pos.left,
            mainTop     = pos.top,
            mainWidth   = entrance.offsetWidth,
            mainHeight  = entrance.offsetHeight,
            bodyWidth   = baidu.page.getWidth(),
            bodyHeight  = baidu.page.getHeight(),
            layerMain   = _layer.getMain(),
            layerWidth  = layerMain.offsetWidth,
            layerHeight = layerMain.offsetHeight,
            offsetX     = 5,
            offsetY     = 0,
            temp        = 0,
            arrowClass  = ARROW_CLASS,
            layerLeft,
            layerTop,
            tLeft,
            tRight,
            tTop,
            tBottom,
            lLeft,
            lRight,
            lTop,
            lBottom;
        
        if (arrow) {
            temp = 1;
            arrow = String(arrow).toLowerCase();
            offsetX = 20;
            offsetY = 14;
            tLeft   = mainLeft + mainWidth - offsetX;
            tRight  = mainLeft + offsetX - layerWidth;
            tTop    = mainTop + mainHeight + offsetY;
            tBottom = mainTop - offsetY - layerHeight;
            lLeft   = mainLeft + mainWidth + offsetX;
            lTop    = mainTop + mainHeight - offsetY;
            lBottom = mainTop + offsetY - layerHeight;
            lRight  = mainLeft - offsetX - layerWidth;

            // 计算手工设置arrow时的位置
            switch (arrow) {
            case 'tr':
                layerLeft = tRight;
                layerTop = tTop;
                break;
            case 'tl':
                layerLeft = tLeft;
                layerTop = tTop;
                break;
            case 'bl':
                layerLeft = tLeft;
                layerTop = tBottom;
                break;
            case 'br':
                layerLeft = tRight;
                layerTop = tBottom;
                break;
            case 'lt':
                layerLeft = lLeft;
                layerTop = lTop;
                break;
            case 'lb':
                layerLeft = lLeft;
                layerTop = lBottom;
                break;
            case 'rb':
                layerLeft = lRight;
                layerTop = lBottom;
                break;
            case 'rt':
                layerLeft = lRight;
                layerTop = lTop;
                break;
            default:
                temp = 0;
                offsetX = - offsetX;
                break;
            }
        } 
        
        // 计算自适应的位置
        if (!temp) {
            layerTop = mainTop + mainHeight + offsetY;
            arrow && (arrow = 't');
            if (layerTop + layerHeight > bodyHeight) {
                if ((temp = mainTop - offsetY - layerHeight) > 0) {
                    layerTop = temp;
                    arrow && (arrow = 'b');
                }
            }

            layerLeft = mainLeft + mainWidth + offsetX;
            arrow && (arrow += 'l');
            if (layerLeft + layerWidth > bodyWidth) {
                if ((temp = mainLeft - offsetX - layerWidth) > 0) {
                    layerLeft = temp;
                    arrow && (arrow = arrow.substr(0,1) + 'r');
                }
            }
        }
    
        arrow && (arrowClass += ' ' + ARROW_CLASS + '-' + arrow);
        baidu.g(ARROW_ID).className = arrowClass;
        
        // 绑定浮出层行为
        if (tipInfo.mode != 'auto') {
            layerMain.onmouseover = _preventHide;
            layerMain.onmouseout = _getHider(tipInfo.hideDelay);
        }

        // 显示提示层
        _isShow = true;
        _layer.show(layerLeft, layerTop);
    };
    
    /**
     * 隐藏提示
     *
     * @static
     * @public
     * @param {number} delay 延迟隐藏时间
     */
    Control.hide = function (delay) {
        delay = delay || Control.HIDE_DELAY;
        _hideTimeout = setTimeout(_hide, delay);
    };
    
    Control.HIDE_DELAY = 300;

    /**
     * 获取隐藏提示的函数
     *
     * @inner
     * @param {number} delay 延迟隐藏时间
     */
    function _getHider(delay) {
        return function () {
            Control.hide(delay);
        };
    }
    
    /**
     * 初始化提示层
     *
     * @static
     * @private
     */
    Control._init = function () {
        if (_isInit) {
            return;
        }

        _isInit = 1;
        _layer = ui.util.create('Layer', {
                id      : LAYER_ID,
                retype  : 'tip',
                width   : 300
            });
        _layer.appendTo();

        var layerMain = _layer.getMain(),
            title = document.createElement('h3'),
            body  = document.createElement('div'),
            arrow = document.createElement('div'),
            close = ui.util.create('Button', {
                id: CLOSE_ID,
                skin: 'layerclose'
            });

        // 初始化提示标题
        title.id = TITLE_ID;
        title.className = TITLE_CLASS;
        layerMain.appendChild(title);
        
        // 初始化提示体
        body.id = BODY_ID;
        body.className = BODY_CLASS;
        layerMain.appendChild(body);
        
        // 初始化箭头
        arrow.id = ARROW_ID;
        arrow.className = ARROW_CLASS;
        layerMain.appendChild(arrow);
        
        // 初始化关闭按钮
        close.appendTo(layerMain);
        close.onclick = _hide;
    };

    return Control;
}();

baidu.on(window, 'load', ui.Tip._init);

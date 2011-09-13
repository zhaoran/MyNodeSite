/*
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * path:    ui/Table.js
 * desc:    表格控件
 * author:  erik, wanghuijun, linzhifeng
 * date:    $Date: 2010/12/16 13:04:00 $
 * 
 * 表格级属性：
 * 1.    dragable：‘true’ or ‘false’，默认为false，为true则开启列宽拖拽改变功能（计划、单元、关键词、创意中已修改为打开状态）
 * 2.    viewColumnCount：‘all’ or  ‘number’，默认为all，该值设置表格默认显示列数，all为全部显示，数字代表显示列数。表格会自动计算屏幕宽度和需要显示的列总宽，屏宽和表格显示列总宽的差值将被平均伸缩到指定的显示列中可被拉伸的列里。
 * 3.    followHead：‘true’ or ‘false’，默认为false，为true则开启纵向滚动表头悬停功能，如需添加表格外部元素与表头悬浮同时锁定，可在该元素上添加class：scroll_y_top_fixed，如目前表格上方的操作和总计区域，（计划、单元、关键词、创意中已修改为打开状态）
 * 4.    lockable：：‘true’ or ‘false’，默认为false，暂不开放使用，该属性开启表格自由锁定功能
 * 
 * 列级属性：
 * 1.    stable： true’ or ‘false’，默认为false，该值代表该列是否可伸缩，进入页面或屏宽改变时表格将自动计算用户可视区域宽度，并自动伸缩各列，当某列带stable为true时该列则别伸缩。这个值尽量少用，保存整个表格是灵活可伸缩效果最好，大家担心的列宽太窄影响显示的问题可以通过minWidth属性解决。
 * 2.    locked： true’ or ‘false’，默认为false，该值指定列锁定，锁定列在出现横向滚动条时不被滚动。
 * 3.    minWidth：number，默认自动计算为表头宽度（文字+排序图标），可设定该列被拖拽或被自适应拉伸时的最小宽度
 * 4.    dragable： true’ or ‘false’，默认为true，当表格属性dragable为true时该值才生效，代表该列是否开启拖拽改变列宽功能
 */

/**
 * 表格框控件
 * 
 * @param {Object} options 控件初始化参数
 */
ui.Table = function (options) {
    this.__initOptions(options);
    this._type = 'table';
    
    // 初始化可显示的最大列数
    var viewColumnCount = this.viewColumnCount;
    if (viewColumnCount) {
        this.viewColumnCount = parseInt(viewColumnCount, 10);
    }
    
    this.__initOption('noDataHtml', null, 'NODATA_HTML');
    this.__initOption('followHead', null, 'FOLLOW_HEAD');
    this.__initOption('sortable', null, 'SORTABLE');
    this.__initOption('dragable', null, 'DRAGABLE');
    this.__initOption('lockable', null, 'LOCKABLE');
    this.__initOption('rowWidthOffset', null, 'ROW_WIDTH_OFFSET');
    this.__initOption('subEntryOpenTip', null, 'SUBENTRY_OPEN_TIP');
    this.__initOption('subEntryCloseTip', null, 'SUBENTRY_CLOSE_TIP');
    this.__initOption('subEntryWidth', null, 'SUBENTRY_WIDTH');
    
    // 诡异的webkit
    // 表格的单元格不需要考虑边框宽度，直接加齐就行
    // 而且即使table-layout:fixed，单元格宽度也不会从前向后分配
    // 而会以未知策略将剩余宽度分配给单元格
    if (baidu.browser.isWebkit) {
        this.rowWidthOffset = 0;
    }

    this._followHeightArr = [0, 0];
    this._followWidthArr = [];
};

ui.Table.NODATA_HTML = '';
ui.Table.FOLLOW_HEAD = 0;
ui.Table.SORTABLE = 0;
ui.Table.DRAGABLE = 0;
ui.Table.LOCKABLE = 0;
ui.Table.ROW_WIDTH_OFFSET = -1;
ui.Table.SUBENTRY_OPEN_TIP = '点击展开';
ui.Table.SUBENTRY_CLOSE_TIP = '点击收起';
ui.Table.SUBENTRY_WIDTH = 18;

ui.Table.prototype = {
    /**
     * 初始化表格的字段
     * 
     * @private
     */
    _initFields: function () {
        if ( !this.fields ) {
            return;
        }
        
        // 避免刷新时重新注入
        var fields = this.fields,
            _fields = fields.slice(0),
            len = _fields.length;

        while (len--) {
            if (!_fields[len]) {
                _fields.splice(len, 1);
            }
        }
        this._fields = _fields;
        if ( !this.select ) {
            return;
        }
        
        switch (this.select.toLowerCase()) {
            case 'multi':
                _fields.unshift(this.FIELD_MULTI_SELECT);
                break;
            case 'single':
                _fields.unshift(this.FIELD_SINGLE_SELECT);
                break;
        }
    },
    
    /**
     * 获取列表体容器素
     * 
     * @public
     * @return {HTMLElement}
     */
    getBody: function () {
        return baidu.g(this.__getId('body'));
    },
    
    /**
     * 获取列表头容器元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getHead: function () {
        return baidu.g(this.__getId('head'));
    },

    /**
     * 获取列表尾容器元素
     * 
     * @public
     * @return {HTMLElement}
     */
    getFoot: function () {
        return baidu.g(this.__getId('foot'));
    },
    
    /**
     * 获取表格内容行的dom元素
     * 
     * @private
     * @param {number} index 行号
     * @return {HTMLElement}
     */
    _getRow: function (index) {
        return baidu.g(this.__getId('row') + index);
    },
    
    /**
     * 获取checkbox选择列表格头部的checkbox表单
     * 
     * @private
     * @return {HTMLElement}
     */
    _getHeadCheckbox: function () {
        return baidu.g(this.__getId('selectAll'));
    },
    
    /**
     * 获取表格所在区域宽度
     * 
     * @private
     * @return {number}
     */
    _getWidth: function () {  
        // 如果手工设置宽度，不动态计算
        if (this.width) {
            return this.width;
        }  
        
        var me = this,
            width,
            rulerDiv = document.createElement('div'),
            parent = me._main.parentNode;
        
        parent.appendChild(rulerDiv);    
        width = rulerDiv.offsetWidth;
        parent.removeChild(rulerDiv);
        
        return width;
    },
    
    /**
     * dom表格起始的html模板
     * 
     * @private
     */
    _tplTablePrefix: '<table cellpadding="0" cellspacing="0" width="{0}" controlTable="{1}">',
    
    /**
     * 将控件填充到容器元素
     * 
     * @public
     * @param {HTMLElement} wrap 容器元素
     */
    appendTo: function (wrap) {
        var div = document.createElement('div');
        wrap.appendChild(div);
        this.render(div);
    },
    
    /**
     * 缓存控件的核心数据
     *
     * @private
     */
    _caching: function () {
        if ( this.followHead ) {
            this._cachingFollowHead();
        }
    },
    
    /**
     * 缓存表头跟随所用的数据
     *
     * @private
     */
    _cachingFollowHead: function () {
        var me = this;
        var followDoms = me._followDoms;

        if ( !followDoms ) {
            followDoms = [];
            me._followDoms = followDoms;

            var walker = me._main.parentNode.firstChild;
            var dom;
            var i, len;
            var followWidths = me._followWidthArr;
            var followHeights = me._followHeightArr;
            var sxHandleHeight = me._sxHandle ? me._sxHandle.offsetHeight : 0;

            // 缓存表格跟随的dom元素
            while (walker) {
                if (walker.nodeType == 1 
                    && walker.getAttribute('followThead')
                ) {
                    followDoms.push(walker);
                }
                walker = walker.nextSibling;
            }

            function getStyleNum(dom, styleName) {
                var result = baidu.dom.getStyle(dom, styleName);
                return (result == '' ? 0 : +(result.replace('px','')));
            }

            // 读取height和width的值缓存
            followHeights[0] = 0;
            for (i = 0, len = followDoms.length; i < len; i++) {
                dom = followDoms[i];
                followWidths[i] = getStyleNum(dom, 'padding-left') + getStyleNum(dom, 'padding-right');             
                followHeights[i + 1] = followHeights[i] + dom.offsetHeight;
            }
            followHeights[i + 1] = followHeights[i] + sxHandleHeight;
            followHeights.lenght = i + 2;
        }

        // 读取跟随的高度，缓存
        me._followTop = baidu.dom.getPosition(
                         followDoms[0] 
                         || me._main
                      ).top;
    },

    /**
     * 绘制表格
     * 
     * @public
     */
    render: function (main) {
        var me = this,
            i,
            len;
        
        me._initFields();
        if ( !me._fields ) {
            return;
        }
        
        ui.Base.render.call(me, main);

        // 如果未绘制过，初始化main元素
        if ( !me._isRender ) {
            me._initMinColsWidth();
        }  
        main = me._main;

        me._subrowIndex = null;
        me._width = me._getWidth();
        main.style.width = me._width + 'px';
        
        if ( me._rawColsWidth 
            && (len = me._rawColsWidth.length) > 0
        ) {
            //计算表格总宽度
            for (i = 0; i < len; i++) {
                me._colsWidth[i] = me._rawColsWidth[i];
            }
        } else {
            me._initColsWidth();
        }
        
        // 停止编辑功能
        me.stopEdit();

        me._renderXScroll();
        me._renderHead();   // 绘制表格头
        me._renderBody();   // 绘制列表
        me._renderFoot();   // 绘制表格尾
        
        // 如果未绘制过，初始化resize处理
        if ( !me._isRender ) {
            me._caching();
            me._initResizeHandler();
            me._initTopResetHandler();   
            me._isRender = 1;
        } else {
            // 重绘时触发onselect事件
            switch (me.select) {
            case 'multi':
                me.onselect([]);
                break;
            }
        }
        
        // 如果表格的绘制导致浏览器出现纵向滚动条
        // 需要重新计算各列宽度
        // 妈的，又多一次reflow
        if (me._width != me._getWidth()) {
            me._handleResize();
        }
    },
    
    onselect: new Function (),
    
    /**
     * 初始最小列宽
     *
     * @private
     */
    _initMinColsWidth: function() {
        var me      = this,
            fields  = me._fields,
            len     = fields.length,
            result  = [],
            field,
            width,
            i;

        if (!me.noHead) {
            for (i = 0; i < len; i++) {
                field = fields[i];
                width = field.minWidth;
                if (!width && !field.breakLine) {
                    //20包括排序和外层padding
                    width = fields[i].title.length * 13 + 20;
                }

                result[i] = width;
            }
        } else {
            for (i = 0; i < len; i++) {
                result[i] = 40;
            }
        }

        me._minColsWidth = result;
    },
    
    /**
     * 初始化列宽
     * 
     * @private
     */
    _initColsWidth: function () {
        var me          = this,
            fields      = me._fields,
            len         = fields.length,
            rawWidths   = me._rawColsWidth,
            rawLen      = rawWidths instanceof Array && rawWidths.length,
            canExpand   = [],
            leaveAverage,
            leftWidth,
            field,
            offset,
            width,
            index,
            maxCanExpandIdx = 0,
            minWidth;
        
        me._colsWidth = [];
        
        // 减去边框的宽度
        leftWidth = me._width - 1;
        
        //初始可显示的最大列数
        if (me.viewColumnCount) {
            maxCanExpandIdx = Math.min(me.viewColumnCount, len);
        } else {
            maxCanExpandIdx = len;
        }
        
        // 读取列宽并保存
        for (i = 0; i < len; i++) {
            field = fields[i];
            width = field.width;
            
            if (rawWidths && rawLen > i) {
                width = rawWidths[i];
            } else {
                width = (width ? parseInt(width, 10) : 0);
            }
            
            me._colsWidth.push(width);
            if (i < maxCanExpandIdx){
                leftWidth -= width;
                if (!field.stable) {
                    canExpand.push(i);
                }
            }
        }
        
        // 根据当前容器的宽度，计算可拉伸的每列宽度
        len = canExpand.length;                 
        leaveAverage = Math.round(leftWidth / len);
        
        for (i = 0; i < len; i++) {
            index = canExpand[i];
            offset = Math.abs(leftWidth) < Math.abs(leaveAverage) ? leftWidth : leaveAverage; 
            leftWidth -= offset;
            me._colsWidth[index] += offset;

            //计算最小宽度
            minWidth = me._minColsWidth[index];
            if (minWidth > me._colsWidth[index]) {
                leftWidth += me._colsWidth[index] - minWidth;
                me._colsWidth[index] = minWidth;
            }
        }
        
        if (leftWidth < 0) {// 如果空间不够分配，需要重新从富裕的列调配空间
            i = 0;
            while (i < len && leftWidth != 0) {
                index = canExpand[i];
                minWidth = me._minColsWidth[index];
                if (minWidth < me._colsWidth[index]) {
                    offset = me._colsWidth[canExpand[i]] - minWidth;
                    offset = offset > Math.abs(leftWidth) ? leftWidth : -offset;
                    leftWidth += Math.abs(offset);
                    me._colsWidth[index] += offset;
                }
                i++;
            }
        } else if (leftWidth > 0) {// 如果空间富裕，则分配给第一个可调整的列
            me._colsWidth[canExpand[0]] += leftWidth;
        }
        
        // 记录列原始宽度
        me._rawColsWidth = [];    
        
        width = 0;
        for (i = 0, len = me._colsWidth.length;
             i < len; 
             i++
        ) {
            width += me._colsWidth[i];
            me._rawColsWidth[i] = me._colsWidth[i];

            // 将可视区域外的列隐藏
            if ( i >= me.viewColumnCount ) {
                me._colsWidth[i] = 0;
            }
        }
        me._totalWidth = width;
    },
    
    /**
     * 绘制横向滚动条
     *
     * @private
     * @author linzhifeng@baidu.com
     */    
    _renderXScroll : function() {
        var me = this;

        if ( !me.allowXScroll ) {
            return;
        }

        if ( !me._sxHandle ) {
            me._sxHandle = document.createElement('div');
            me._sxHandle.className = me.__getClass('scroll-x');
            me._sxContent = document.createElement('div');
            me._sxContent.style.fontSize = '1px';  
            me._sxContent.innerHTML = '&nbsp;';
            me._sxHandle.appendChild(me._sxContent);
            me._main.appendChild(me._sxHandle);    
            me._sxHandle.onscroll = me._getXScrollHandler();
        }
        
        me._sxContent.style.width = me._totalWidth + 'px';
        me._repaintXScroll();
    },
    
    /**
     * 重绘横向滚动条
     *
     * @private
     */  
    _repaintXScroll: function () {
        if ( this.allowXScroll ) {
            var sxHandle = this._sxHandle;
            var sxContent = this._sxContent;
            var fhArr = this._followHeightArr;
            var fhLen = fhArr.length;
            var lastHeight = fhArr[fhLen - 2];

            sxHandle.style.width = this._width + 'px';
            sxContent.style.width = this._totalWidth + 'px'

            if ( this._width >= this._totalWidth ) {
                baidu.dom.hide(sxHandle);
            } else {
                baidu.dom.show(sxHandle);
                lastHeight += sxHandle.offsetHeight;
            }
            
            fhArr[fhLen - 1] = lastHeight;
            sxHandle.scrollLeft = 0;
        }
    },

    /**
     * 获取横向滚动的handler
     *
     * @private
     * @return {Function}
     */
    _getXScrollHandler : function(){
        var me = this;

        return function () {
            var fields      = me._fields,
                sWidth      = me._sxHandle.scrollLeft,
                sWidthBak   = sWidth,
                len         = fields.length,
                rawWidths   = me._rawColsWidth,
                colsWidth   = me._colsWidth = rawWidths.slice(0),
                width,
                i,
                j;

            // 查找第一个未locked的列
            for (i = len - 1; i >= 0; i--) {
                if (fields[i].locked) {
                    break;
                }
            }

            // 计算列宽：先处理需要根据滚动位置减少列宽的列
            for (i += 1; i < len; i++) {
                width = rawWidths[i];
                
                if ( width > sWidth ) {
                    colsWidth[i] = width - sWidth;
                    break;
                } else {
                    sWidth -= width;
                    colsWidth[i] = 0;
                }
            }

            // 计算列宽：处理需要根据滚动位置增加列宽的列
            i = Math.max( i + 1, me.viewColumnCount );
            for (; i < len; i++) {
                width = rawWidths[i];

                if ( width >= sWidthBak ) {
                    colsWidth[i] = sWidthBak;
                    sWidthBak = 0;
                    break;
                } else {
                    colsWidth[i] = width;
                    sWidthBak -= width;
                }
            }
            
            // 处理剩余宽度
            if (sWidthBak > 0) {
                colsWidth[i] += sWidthBak;
            }
            
            // 将显示区域外的列宽度置0
            for (i += 1; i < len; i++) {
                colsWidth[i] = 0;
            }

            me._resetColumns();
        };
    },
    
    /**
     * 绘制表格尾
     * 
     * @private
     */
    _renderFoot: function () {
        var me = this,
            type = 'foot',
            id = me.__getId(type),
            foot = baidu.g(id);

        if ( !( me.foot instanceof Array ) ) {
            foot && (foot.style.display = 'none');
        } else {
            if (!foot) {
                foot = document.createElement('div');
                foot.id = id;
                foot.className = me.__getClass(type);
                foot.setAttribute('controlTable', me.id);
                
                // 绑定拖拽的事件处理
                me._main.appendChild(foot);
            }    
            
            foot.style.display = '';
            foot.style.width = me._width + 'px';
            foot.innerHTML = me._getFootHtml();
        }
    },
    
    /**
     * 获取表格尾的html
     * 
     * @private
     * @return {string}
     */
    _getFootHtml: function () {
        var html        = [];
        var footArray   = this.foot;
        var len         = footArray.length;
        var fieldIndex  = 0;
        var colsWidth   = this._colsWidth;
        var thCellClass = this.__getClass('fcell');
        var thTextClass = this.__getClass('fcell-text');
        var i, colWidth, j, footInfo, 
            colspan, thClass, contentHtml;
        
        html.push(ui._format(this._tplTablePrefix, '100%', this.id));
        for (i = 0; i < len; i++) {
            footInfo = footArray[i];
            colWidth = colsWidth[fieldIndex];
            colspan = footInfo.colspan || 1;
            thClass = [thCellClass];
            contentHtml = footInfo.content;

            if ('function' == typeof contentHtml) {
                contentHtml = contentHtml.call(this);
            }

            for (j = 1; j < colspan; j++) {
                colWidth += colsWidth[fieldIndex + j];
            }
            
            fieldIndex += colspan;
            if (footInfo.align) {
                thClass.push(this.__getClass('cell-align-' + footInfo.align));
            }
            
            colWidth += this.rowWidthOffset; 
            (colWidth < 0) && (colWidth = 0);
            html.push('<th id="' + this._getFootCellId(i) + '" class="' + thClass.join(' ') + '"',
                        ' style="width:' + colWidth + 'px;',
                        (colWidth ? '' : 'display:none;') + '">',
                        '<div class="' + thTextClass + '">',
                        contentHtml,
                        '</div></th>');
        }

        html.push('</tr></table>');
        return html.join('');
    },

    /**
     * 绘制表格头
     * 
     * @private
     */
    _renderHead: function () {
        var me = this,
            type = 'head',
            id = me.__getId(type),
            head = baidu.g(id);
            
        if (me.noHead) {
            return;
        }

        if (!head) {
            head = document.createElement('div');
            head.id = id;
            head.className = me.__getClass(type);
            head.setAttribute('controlTable', me.id);
            
            // 绑定拖拽的事件处理
            if (me.dragable) {
                head.onmousemove = me._getHeadMoveHandler();
                head.onmousedown = me._getDragStartHandler();
            }
            me._main.appendChild(head);
        }    
        
        head.style.width = me._width + 'px';
        head.innerHTML = me._getHeadHtml();
    },
    
    /**
     * 获取表格头的html
     * 
     * @private
     * @return {string}
     */
    _getHeadHtml: function () {
        // TODO: 使用format性能很低的哈
        var me = this,
            fields = this._fields,
            len = fields.length,
            html = [],
            i, field, title, canDragBegin, canDragEnd,
            thCellClass = me.__getClass('hcell'),
            thTextClass = me.__getClass('hcell-text'),
            breakClass  = me.__getClass('cell-break'),
            sortClass   = me.__getClass('hsort'),
            selClass    = me.__getClass('hcell-sel'),
            tipClass    = me.__getClass('hhelp'),
            contentHtml,
            orderClass,
            alignClass,
            sortIconHtml,
            sortable,
            tipHtml;
        
        // 计算最开始可拖拽的单元格
        for (i = 0; i < len; i++) {
            if (!fields[i].stable) {
                canDragBegin = i;
                break;
            }
        }
        
        // 计算最后可拖拽的单元格
        for (i = len - 1; i >= 0; i--) {
            if (!fields[i].stable) {
                canDragEnd = i;
                break;
            }
        }
        
        // 拼装html
        html.push(ui._format(me._tplTablePrefix, '100%', me.id));//me._totalWidth - 2
        html.push('<tr>'); 
        for (i = 0; i < len; i++) {
            thClass = [thCellClass];
            field = fields[i];
            title = field.title;
            sortable = (me.sortable && field.sortable);
            currentSort = (sortable 
                            && field.field 
                            && field.field == me.orderBy);
            
            // 小提示图标html
            /*
            tipHtml = '';
            if (!me.noTip && field.tip) {
                tipHtml = ui._format(me._tplTipIcon,
                                    tipClass,
                                    ui.ToolTip.getEventString(field.tip));
            }
            */

            // 计算排序图标样式
            sortIconHtml = '';
            orderClass = '';
            if (sortable) {
                thClass.push(me.__getClass('hcell-sort'));
                if (currentSort) {
                    thClass.push(me.__getClass('hcell-' + me.order));
                }             
                sortIconHtml = ui._format(me._tplSortIcon, sortClass);
            }
            
            // 计算表格对齐样式
            if (field.align) {
                thClass.push(me.__getClass('cell-align-' + field.align));
            }

            // 判断是否breakline模式
            if (ui.Table.BREAK_LINE
                || me.breakLine
                || field.breakLine
            ) {
                thClass.push(breakClass);
            }
            
            // 计算内容html
            // 如果通过function制定title，则不绘制排序小图标
            if (typeof title == 'function') {
                contentHtml = title.call(me);
                sortIconHtml = '';
            } else {
                contentHtml = title || '';
            }
            
                                        
            html.push('<th id="' + this._getTitleCellId(i) + '" index="' + i + '"',
                        ' class="' + thClass.join(' ') + '"',
                        sortAction(field, i),
                        (i >= canDragBegin && i < canDragEnd ? ' dragright="1"' : ''),
                        (i <= canDragEnd && i > canDragBegin ? ' dragleft="1"' : ''),
                        ' style="width:' + (me._colsWidth[i] + me.rowWidthOffset) + 'px;',
                        (me._colsWidth[i] ? '' : 'display:none') + '">',
                        '<div class="' + thTextClass +
                        (field.select ? ' ' + selClass : '') + '">',
                        contentHtml,
                        sortIconHtml,
                        tipHtml,
                        '</div></th>');
        }
        html.push('</tr></table>');
        return html.join('');
        
        /**
         * 获取表格排序的单元格预定义属性html
         * 
         * @inner
         * @return {string}
         */
        function sortAction(field, index) {
            if (me.sortable && field.sortable) {
                return ui._format(
                            ' onmouseover="{0}" onmouseout="{1}" onclick="{2}" sortable="1"',
                            me.__getStrRef() + '._titleOverHandler(this)',
                            me.__getStrRef() + '._titleOutHandler(this)',
                            me.__getStrRef() + '._titleClickHandler(this)');
            }
            
            return '';
        }
    },
    
    _tplSortIcon: '<div class="{0}"></div>',

    // 提示模板，此处还未定实现方式
    _tplTipIcon: '<div class="{0}" {1}></div>', 
    
    /**
     * 获取表格头单元格的id
     * 
     * @private
     * @param {number} index 单元格的序号
     * @return {string}
     */
    _getTitleCellId: function (index) {
        return this.__getId('titleCell') + index;
    },

    /**
     * 获取表格尾单元格的id
     * 
     * @private
     * @param {number} index 单元格的序号
     * @return {string}
     */
    _getFootCellId: function (index) {
        return this.__getId('footCell') + index;
    },
    
    /**
     * 表格头单元格鼠标移入的事件handler
     * 
     * @private
     * @param {HTMLElement} cell 移出的单元格
     */
    _titleOverHandler: function (cell) {
        if (this._isDraging || this._dragReady) {
            return;
        }
        
        this._sortReady = 1;
        baidu.addClass(cell.firstChild, this.__getClass('hcell-hover'));
    },
    
    /**
     * 表格头单元格鼠标移出的事件handler
     * 
     * @private
     * @param {HTMLElement} cell 移出的单元格
     */
    _titleOutHandler: function (cell) {
        this._sortReady = 0;
        baidu.removeClass(cell.firstChild, this.__getClass('hcell-hover'));
    },
    
    onsort: new Function(),
    
    /**
     * 表格头单元格点击的事件handler
     * 
     * @private
     * @param {HTMLElement} cell 点击的单元格
     */
    _titleClickHandler: function (cell) {
        if (this._sortReady) { // 避免拖拽触发排序行为
            var me = this,
                field = me._fields[cell.getAttribute('index')],
                orderBy = me.orderBy,
                order = me.order;
            
            if (orderBy == field.field) {
                order = (!order || order == 'asc') ? 'desc' : 'asc';
            } else {
                order = 'desc';
            }
            me.onsort(field, order);
            me.order = order;
            me.orderBy = field.field;
            me._renderHead();
        }
    },
    
    /**
     * 获取表格头鼠标移动的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getHeadMoveHandler: function () {
        var me = this,
            dragClass = me.__getClass('startdrag'),
            range = 8; // 可拖拽的单元格边界范围
            
        return function (e) {
            if (me._isDraging) {
                return;
            }
            
            e = e || window.event;
            var tar = e.srcElement || e.target,
                page = baidu.page,
                pageX = e.pageX || e.clientX + page.getScrollLeft(),
                pos, 
                index,
                sortable;
            
            // 寻找th节点。如果查找不到，退出
            tar = me._findDragCell(tar);
            if (!tar) {
                return;
            }
            
            // 获取位置与序号
            pos = baidu.dom.getPosition(tar);
            index = tar.getAttribute('index');
            sortable = tar.getAttribute('sortable');
            
            // 如果允许拖拽，设置鼠标手型样式与当前拖拽点
            if (tar.getAttribute('dragleft') 
                && pageX - pos.left < range
            ) {
                sortable && (me._titleOutHandler(tar)); // 清除可排序列的over样式
                baidu.addClass(this, dragClass);
                me._dragPoint = 'left';
                me._dragReady = 1;
            } else if (tar.getAttribute('dragright') 
                       && pos.left + tar.offsetWidth - pageX < range
            ) {
                sortable && (me._titleOutHandler(tar)); // 清除可排序列的over样式
                baidu.addClass(this, dragClass);
                me._dragPoint = 'right';
                me._dragReady = 1;
            } else {
                baidu.removeClass(this, dragClass);
                sortable && (me._titleOverHandler(tar)); // 附加可排序列的over样式
                me._dragPoint = '';
                me._dragReady = 0;
            }
        };
    },
    
    /**
     * 查询拖拽相关的表格头单元格
     * 
     * @private
     * @param {HTMLElement} target 触发事件的元素
     * @return {HTMLTHElement}
     */
    _findDragCell: function (target) {    
        while (target.nodeType == 1) {
            if (target.tagName == 'TH') {
                return target;
            }
            target = target.parentNode;
        }
        
        return null;
    },
 
    /**
     * 获取表格头鼠标点击拖拽起始的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getDragStartHandler: function () {
        var me = this,
            dragClass = me.__getClass('startdrag');
            
        return function (e) {
            e = e || window.event;
            var tar = e.target || e.srcElement;
            
            // 寻找th节点，如果查找不到，退出
            tar = me._findDragCell(tar);
            if (!tar) {
                return;
            }
            
            if (baidu.g(me.__getId('head')).className.indexOf(dragClass) < 0) {
                return;
            }            
                        
            // 获取显示区域高度
            me._htmlHeight = document.documentElement.clientHeight;
            
            // 记忆起始拖拽的状态
            me._isDraging = true;
            me._dragIndex = tar.getAttribute('index');
            me._dragStart = e.pageX || e.clientX + baidu.page.getScrollLeft();
            
            // 绑定拖拽事件
            document.onmousemove = me._getDragingHandler();
            document.onmouseup = me._getDragEndHandler();
            
            // 显示拖拽基准线
            me._showDragMark(me._dragStart);
            
            // 阻止默认行为
            baidu.event.preventDefault(e);
            return false;
        };
    },
    
    /**
     * 获取拖拽中的事件handler
     * 
     * @private
     * @desc 移动拖拽基准线
     * @return {Function}
     */
    _getDragingHandler: function () {
        var me = this;
        return function (e) {
            e = e || window.event;
            me._showDragMark(e.pageX || e.clientX + baidu.page.getScrollLeft());
            baidu.event.preventDefault(e);
            return false;
        };
    },
    
    /**
     * 显示基准线
     * 
     * @private
     */
    _showDragMark: function (left) {
        var me = this,
            mark = me._getDragMark();
        
        if (!me.top) {
            me.top = baidu.dom.getPosition(me._main).top;
        }    
        
        if (!mark) {
            mark = me._createDragMark();
        }
        
        mark.style.top = me.top + 'px';
        mark.style.left = left + 'px';
        mark.style.height = me._htmlHeight - me.top + baidu.page.getScrollTop() + 'px';
    },
    
    /**
     * 隐藏基准线
     * 
     * @private
     */
    _hideDragMark: function () {
        var mark = this._getDragMark();
        mark.style.left = '-10000px';
        mark.style.top = '-10000px';
    },
    
    /**
     * 创建拖拽基准线
     * 
     * @private
     * @return {HTMLElement}
     */
    _createDragMark: function () {
        var mark = document.createElement('div');
        mark.id = this.__getId('dragMark');
        mark.className = this.__getClass('mark');
        mark.style.top = '-10000px';
        mark.style.left = '-10000px';
        document.body.appendChild(mark);
        
        return mark;
    },
    
    /**
     * 获取基准线的dom元素
     * 
     * @private
     * @return {HTMLElement}
     */
    _getDragMark: function () {
        return baidu.g(this.__getId('dragMark'));
    },
    
    /**
     * 获取拖拽结束的事件handler
     * 
     * @private
     * @return {Function}
     */
    _getDragEndHandler: function () {
        var me = this;
        return function (e) {
            e = e || window.event;
            var minWidth,
                index = parseInt(me._dragIndex, 10),
                pageX = e.pageX || e.clientX + baidu.page.getScrollLeft(),
                offsetX,
                field,
                fields      = me._fields, 
                fieldLen    = fields.length,
                alters      = [], 
                alterWidths = [], 
                alter, 
                alterLen, 
                alterWidth, 
                alterSum    = 0,
                colsWidth   = me._colsWidth,
                leave, i, 
                revise      = 0, 
                totalWidth,
                offsetWidth, 
                currentWidth, 
                roughWidth;

            // 校正拖拽元素
            // 如果是从左边缘拖动的话，拖拽元素应该上一列
            if (me._dragPoint == 'left') {
                index--;
            }
            
            // 校正拖拽列的宽度
            // 不允许小于最小宽度
            minWidth = me._minColsWidth[index];
            offsetX = pageX - me._dragStart;
            currentWidth = colsWidth[index] + offsetX;
            if (currentWidth < minWidth) {
                offsetX += (minWidth - currentWidth);
                currentWidth = minWidth;
            }
            
            //查找宽度允许改变的列
            for (i = index + 1; i < fieldLen; i++) {
                if (!fields[i].stable && colsWidth[i] > 0) {
                    alters.push(i);
                    alterWidth = colsWidth[i];
                    alterWidths.push(alterWidth);
                    alterSum += alterWidth;
                }
            }

            // 计算允许改变的列每列的宽度
            leave = offsetX;
            alterLen = alters.length;
            for (i = 0; i < alterLen; i++) {
                alter = alters[i];
                alterWidth = alterWidths[i];    //当前列宽
                roughWidth = offsetX * alterWidth / alterSum; // 变更的列宽
                
                // 校正变更的列宽
                // roughWidth可能存在小数点
                if (leave > 0) {
                    offsetWidth = Math.ceil(roughWidth);
                } else {
                    offsetWidth = Math.floor(roughWidth);
                }
                offsetWidth = (Math.abs(offsetWidth) < Math.abs(leave) ? offsetWidth : leave);

                // 校正变更后的列宽
                // 不允许小于最小宽度
                alterWidth -= offsetWidth;
                leave -= offsetWidth;
                minWidth = me._minColsWidth[alter];
                if (alterWidth < minWidth) {
                    revise += minWidth - alterWidth;
                    alterWidth = minWidth;
                }
                
                colsWidth[alter] = alterWidth;
            }

            // 校正拖拽列的宽度
            // 当影响的列如果宽度小于最小宽度，会自动设置成最小宽度
            // 相应地，拖拽列的宽度也会相应减小
            currentWidth -= revise;

            colsWidth[index] = currentWidth;

            // 重新绘制每一列
            me._resetColumns();
            
            // 清除拖拽向全局绑定的事件
            document.onmousemove = null;
            document.onmouseup = null;
            
            me._isDraging = false;
            me._hideDragMark();
            
            baidu.event.preventDefault(e);
            return false;
        };
    },
    
    /**
     * 绘制表格主体
     * 
     * @private
     */
    _renderBody: function () {
        var me = this,
            type = 'body',
            id = me.__getId(type),
            list = baidu.g(id),
            style;
            
        if (!list) {
            list = document.createElement('div');
            list.id = id;
            list.className = me.__getClass(type);
            
            // 如果设置了表格体高度
            // 表格需要出现横向滚动条
            if (me.bodyHeight) {
                style = list.style;
                style.height = me.bodyHeight + 'px';
                style.overflowX = 'hidden';
                style.overflowY = 'auto';
            }
            me._main.appendChild(list);
        }

        list.style.width = me._width + 'px';
        list.innerHTML = me._getBodyHtml();
    },
    
    /**
     * 获取表格主体的html
     * 
     * @private
     * @return {string}
     */
    _getBodyHtml: function () {
        var data = this.datasource || [],
            dataLen = data.length,
            html = [],
            i, j, item, field;
        
        if (!dataLen) {
            return this.noDataHtml;
        }
        
        for (i = 0; i < dataLen; i++) {
            item = data[i];
            html[i] = this._getRowHtml(item, i);
        }
        
        return html.join('');
    },
    
    _tplRowPrefix: '<div id="{0}" class="{1}" onmouseover="{2}" onmouseout="{3}" onclick="{4}">',
    
    /**
     * 获取表格体的单元格id
     * 
     * @private
     * @param {number} rowIndex 当前行序号
     * @param {number} fieldIndex 当前字段序号
     * @return {string}
     */
    _getBodyCellId: function (rowIndex, fieldIndex) {
        return this.__getId('cell') + rowIndex + "_" + fieldIndex;
    },
    
    /**
     * 获取表格行的html
     * 
     * @private
     * @param {Object} data 当前行的数据
     * @param {number} index 当前行的序号
     * @return {string}
     */
    _getRowHtml: function (data, index) {
        var me = this,
            html = [],
            tdCellClass     = me.__getClass('cell'),
            tdBreakClass    = me.__getClass('cell-break'),
            tdTextClass     = me.__getClass('cell-text'),
            fields          = me._fields,
            fieldLen        = fields.length,
            cellClass,
            colWidth,
            content,
            tdClass,
            textClass,
            alignClass,
            sortClass,
            subrow = me.subrow && me.subrow != 'false',
            subentry,
            subentryHtml,
            contentHtml,
            editable,
            i;
            
        html.push(ui._format(me._tplRowPrefix,
                            me.__getId('row') + index,
                            me.__getClass('row'),
                            me.__getStrCall('_rowOverHandler', index),
                            me.__getStrCall('_rowOutHandler', index),
                            me.__getStrCall('_rowClickHandler', index)),
                  ui._format(me._tplTablePrefix, '100%', me.id));//me._totalWidth - 2

        for (i = 0; i < fieldLen; i++) {
            tdClass = [tdCellClass];
            textClass = [tdTextClass];
            field = fields[i];
            content = field.content;
            colWidth = me._colsWidth[i];
            subentry = subrow && field.subEntry;
            editable = me.editable && field.editable && field.edittype;
            
            // 生成可换行列的样式
            if (ui.Table.BREAK_LINE 
                || me.breakLine 
                || field.breakLine
            ) {
                tdClass.push(tdBreakClass);
            }
            
            // 表格可编辑的样式
            if (editable) {
                textClass.push(me.__getClass('cell-editable'));
            }

            // 生成选择列的样式
            if (field.select) {
                textClass.push(me.__getClass('cell-sel'));
            }
            
            // 计算表格对齐样式
            if (field.align) {
                tdClass.push(me.__getClass('cell-align-' + field.align));
            }
            
            // 计算表格排序样式
            sortClass = ''
            if (field.field && field.field == me.orderBy) {
                tdClass.push(me.__getClass('cell-sorted'));
            }


            // 构造内容html
            contentHtml = '<div class="' + textClass.join(' ') + '">'
                            + ('function' == typeof content 
                                ? content.call(me, data, index, i) 
                                : data[content])
                            + me._getEditEntryHtml(field, index, i)
                            + '</div>';

            subentryHtml = '&nbsp;';
            if (subentry) {
                if (typeof field.isSubEntryShow != 'function'
                    || field.isSubEntryShow.call(me, data, index, i) !== false
                ) {
                    subentryHtml = me._getSubEntryHtml(index);
                }
                
                tdClass.push(me.__getClass('subentryfield'));
                contentHtml = '<table width="100%" collpadding="0" collspacing="0">'
                                + '<tr><td width="' + me.subEntryWidth + '" align="right">' + subentryHtml
                                + '</td><td>' + contentHtml + '</td></tr></table>';
            }
            html.push('<td id="' + me._getBodyCellId(index, i) + '"',
                    'class="' + tdClass.join(' ')  + '"',
                    ' style="width:' + (colWidth + me.rowWidthOffset) + 'px;',
                    (colWidth ? '' : 'display:none'),
                    '" controlTable="' + me.id,
                    '" row="' + index + '" col="' + i + '">',
                    contentHtml,
                    '</td>');
        }
        html.push('</tr></table></div>');
        
        // 子行html
        if (subrow) {
            html.push(me._getSubrowHtml(index));
        }
        
        return html.join('');
    },
    
    /**
     * 获取编辑入口元素的html
     *
     * @private
     * @param {Object} field 列配置信息
     * @param {number} rowIndex 行序号
     * @param {number} columnIndex 列序号
     * @return {string}
     */
    _getEditEntryHtml: function (field, rowIndex, columnIndex) {
        var edittype = field.edittype;
        if (this.editable && field.editable && edittype) {
            return '<div class="' + this.__getClass('cell-editentry') + '" onclick="' 
                        + this.__getStrCall('startEdit', edittype, rowIndex, columnIndex) 
                        + '"></div>'
        }
        return '';
    },

    /**
     * 表格行鼠标移上的事件handler
     * 
     * @private
     * @param {number} index 表格行序号
     */
    _rowOverHandler: function (index) {
        if (this._isDraging) {
            return;
        }
        
        var row = this._getRow(index);
        if (row) {
            baidu.addClass(row, this.__getClass('row-hover'));
        }
    },
    
    /**
     * 表格行鼠标移出的事件handler
     * 
     * @private
     * @param {number} index 表格行序号
     */
    _rowOutHandler: function (index) {
        var row = this._getRow(index);
        if (row) {
            baidu.removeClass(row, this.__getClass('row-hover'));
        }
    },
    
    /**
     * 阻止行选，用于点击在行的其他元素，不希望被行选时。
     * 
     * @public
     */
    preventLineSelect: function () {
        this._dontSelectLine = 1;
    },
    
    /**
     * 表格行鼠标点击的事件handler
     * 
     * @private
     * @param {number} index 表格行序号
     */
    _rowClickHandler: function (index) {
        if (this.selectMode == 'line') {
            if (this._dontSelectLine) {
                this._dontSelectLine = false;
                return;
            }
            
            var input;
            
            switch (this.select) {
            case 'multi':
                input = baidu.g(this.__getId('multiSelect') + index);
                // 如果点击的是checkbox，则不做checkbox反向处理
                if (!ui._hasValue(this._preSelectIndex)) {
                    input.checked = !input.checked;
                }
                this._selectMulti(index);
                this._preSelectIndex = null;
                break;

            case 'single':
                input = baidu.g(this.__getId('singleSelect') + index);
                input.checked = true;
                this._selectSingle(index);
                break;
            }
        }
    },
    
    /**
     * subrow入口的html模板
     * 
     * @private
     */
    tplSubEntry: '<div class="{0}" onmouseover="{2}" onmouseout="{3}" onclick="{4}" id="{1}" title="{5}"></div>',
    
    /**
     * 获取子内容区域入口的html
     *
     * @private
     * @return {string}
     */
    _getSubEntryHtml: function(index) {
        var me = this;
        return ui._format(me.tplSubEntry,
                         me.__getClass('subentry'),
                         me._getSubentryId(index),
                         me.__getStrCall('_entryOver', index),
                         me.__getStrCall('_entryOut', index),
                         me.__getStrCall('fireSubrow', index),
                         me.subEntryOpenTip);
    },
    
    /**
     * 获取子内容区域的html
     *
     * @private
     * @return {string}
     */
    _getSubrowHtml: function (index) {
        return '<div id="' + this._getSubrowId(index)
                    + '" class="' + this.__getClass('subrow') + '"'
                    + ' style="display:none"></div>';
    },
    
    /**
     * 获取表格子行的元素
     *
     * @public
     * @param {number} index 行序号
     * @return {HTMLElement}
     */
    getSubrow: function (index) {
        return baidu.g(this._getSubrowId(index));    
    },
    
    /**
     * 获取表格子行的元素id
     *
     * @private
     * @param {number} index 行序号
     * @return {string}
     */
    _getSubrowId: function (index) {
        return this.__getId('subrow') + index;
    },
    
    /**
     * 获取表格子行入口元素的id
     *
     * @private
     * @param {number} index 行序号
     * @return {string}
     */
    _getSubentryId: function (index) {
        return this.__getId('subentry') + index;
    },
    
    /**
     * 处理子行入口元素鼠标移入的行为
     *
     * @private
     * @param {number} index 入口元素的序号
     */
    _entryOver: function (index) {
        var el = baidu.g(this._getSubentryId(index)),
            opened = /subentry-opened/.test(el.className),
            classBase = 'subentry-hover';
            
        if (opened) {
            classBase = 'subentry-opened-hover';
        }    
        
        baidu.addClass(el, this.__getClass(classBase));
    },
    
    /**
     * 处理子行入口元素鼠标移出的行为
     *
     * @private
     * @param {number} index 入口元素的序号
     */
    _entryOut: function (index) {
        var id = this._getSubentryId(index);
        baidu.removeClass(id, this.__getClass('subentry-hover'));
        baidu.removeClass(id, this.__getClass('subentry-opened-hover'));
    },
    
    /**
     * 触发subrow的打开|关闭
     *
     * @public
     * @param {number} index 入口元素的序号
     */
    fireSubrow: function (index) {
        var me = this,
            currentIndex = me._subrowIndex,
            datasource = me.datasource,
            dataLen = (datasource instanceof Array && datasource.length),
            dataItem;
        
        if (!dataLen || index >= dataLen) {
            return;
        }
        
        if (currentIndex !== index) {
            dataItem = datasource[index];
            if (me.onsubrowopen(index, dataItem) !== false) {
                me.openSubrow(index);
            }
        } else {
            me._closeSubrow(currentIndex);
        }
        
        me._entryOver(index);
    },
    
    /**
     * 关闭子行
     *
     * @private
     * @param {number} index 子行的序号
     */
    _closeSubrow: function (index) {
        var me = this,
            subrowId = me._getSubrowId(index),
            entryId = me._getSubentryId(index);

        me._entryOut(index);
        me._subrowIndex = null;
        baidu.removeClass(entryId, me.__getClass('subentry-opened'));
        baidu.removeClass(me._getRow(index), me.__getClass('row-unfolded'));
        baidu.hide(subrowId);
        baidu.setAttr(entryId, 'title', me.subEntryOpenTip);
        
        return true;
    },
    
    onsubrowopen: new Function(),
    
    /**
     * 打开子行
     *
     * @private
     * @param {number} index 子行的序号
     */
    openSubrow: function (index) {
        var me = this,
            currentIndex = me._subrowIndex,
            entry = baidu.g(me._getSubentryId(index));
        
        if (ui._hasValue(currentIndex)) {
            me._closeSubrow(currentIndex);
        }
        
        baidu.addClass(entry, me.__getClass('subentry-opened'));
        baidu.addClass(me._getRow(index), me.__getClass('row-unfolded'));
        entry.setAttribute('title', me.subEntryCloseTip);
        baidu.show(me._getSubrowId(index));
        me._subrowIndex = index;
    },
    
    /**
     * 初始化resize的event handler
     * 
     * @private
     */
    _initResizeHandler: function () {
        var me = this;
        me.viewWidth = baidu.page.getViewWidth();
        me.viewHeight = baidu.page.getViewHeight();
        
        me._resizeHandler = function () {
            var viewWidth = baidu.page.getViewWidth(),
                viewHeight = baidu.page.getViewHeight();
                
            if (viewWidth == me.viewWidth
                && viewHeight == me.viewHeight) {
                return;
            }
            
            me.viewWidth = viewWidth;
            me.viewHeight = viewHeight;
            me._handleResize();
        };

        // 在dispose的时候会释放的哈
        baidu.on(window, 'resize', me._resizeHandler);
    },
    
    /**
     * 浏览器resize的处理
     *
     * @private
     */
    _handleResize: function () {
        var me = this,
            head = me.getHead(),
            foot = me.getFoot(),
            walker,
            widthStr,
            i;

        me._width = me._getWidth();
        widthStr = me._width + 'px';
        
        // 设置主区域宽度
        me._main.style.width = widthStr;
        me.getBody().style.width = widthStr;
        head && (head.style.width = widthStr);
        foot && (foot.style.width = widthStr);
        
        // 重新绘制每一列  
        me._initColsWidth();
        me._resetColumns();    
        if ( me.followHead ) {
            walker = me._main.parentNode.firstChild;
            i = 0;
            while (walker) {
                if (walker.nodeType == 1
                    && walker.getAttribute('followThead')
                ) {
                    walker.style.width = me._width - me._followWidthArr[i++] + 'px';
                }

                walker = walker.nextSibling;
            }
        }    

        me._repaintXScroll();
        me._topReseter && me._topReseter();
    },
    
    /**
     * 纵向锁定初始化
     *
     * @private
     */
    _initTopResetHandler : function(){
        if (!this.followHead){
            return;
        }

        var me = this,
            walker           = me._main.parentNode.firstChild,
            sxHandle         = me._sxHandle,
            domHead          = me.getHead(),
            followWidths     = me._followWidthArr,
            placeHolderId    = me.__getId('TopPlaceholder'),
            domPlaceholder   = document.createElement('div'),
            i, len, fWidth, temp;
        
        // 占位元素
        // 否则元素浮动后原位置空了将导致页面高度减少，影响滚动条  
        domPlaceholder.id = placeHolderId;
        domPlaceholder.style.width = '100%';
        baidu.dom.insertBefore(domPlaceholder, (sxHandle || me._main));
        domPlaceholder = null;
        
        // 写入表头跟随元素的宽度样式
        for (i = 0, len = me._followDoms.length; i < len; i++) {
            me._followDoms[i].style.width = me._width - followWidths[i] + 'px';
        }
        sxHandle && (sxHandle.style.width = me._width + 'px');
        domHead && (domHead.style.width = me._width + 'px');
                
        me._topReseter = function () {
            var scrollTop   = baidu.page.getScrollTop(), 
                fhArr       = me._followHeightArr,
                fhLen       = fhArr.length, 
                posStyle    = '',
                followDoms  = me._followDoms,
                len         = followDoms.length,
                placeHolder = baidu.g(placeHolderId),
                i = 0, 
                posTop;
            
            function setPos(dom, pos, top) {
                if (dom) {
                    dom.style.top = top + 'px';
                    dom.style.position = pos;
                }
            }

            // 2x2的判断，真恶心
            if (baidu.ie && baidu.ie < 7) {
                if (scrollTop > me._followTop) {
                    posStyle = 'absolute';
                    placeHolder.style.height = fhArr[fhLen - 1] + domHead.offsetHeight + 'px';
                    for ( ; i < len; i++) {
                        setPos(followDoms[i], posStyle, fhArr[i] + scrollTop);
                    }

                    setPos (sxHandle, posStyle, fhArr[fhLen - 2] + scrollTop);
                    setPos(domHead, posStyle, fhArr[fhLen - 1] + scrollTop);
                } else {
                    placeHolder.style.height = 0;
                    posStyle = '';
                    
                    for ( ; i < len; i++) {
                        setPos(followDoms[i], posStyle, 0);
                    }
                    
                    setPos(sxHandle, posStyle, 0);
                    setPos(domHead, posStyle, 0);
                }
            } else {
                if (scrollTop > me._followTop) {
                    placeHolder.style.height = fhArr[fhLen - 1] + domHead.offsetHeight + 'px';
                    posStyle = 'fixed';
                        
                    for ( ; i < len; i++) {
                        setPos(followDoms[i], posStyle, fhArr[i]);
                    }
                    
                    setPos(sxHandle, posStyle, fhArr[fhLen - 2]);
                    setPos(domHead, posStyle, fhArr[fhLen - 1]);
                } else {
                    placeHolder.style.height = 0;
                    posStyle = '';
                    
                    for ( ; i < len; i++) {
                        setPos(followDoms[i], posStyle, 0);
                    }
                    
                    setPos(sxHandle, posStyle, 0);
                    setPos(domHead, posStyle, 0);
                }
            }
            
        };
        baidu.on(window, 'scroll', me._topReseter);    
    },
    
    /**
     * 重新设置表格每个单元格的宽度
     * 
     * @private
     */
    _resetColumns: function () {
        var me = this,
            datasource = me.datasource || [],
            colsWidth = me._colsWidth,
            foot = me.foot,
            id = me.id,
            len = foot instanceof Array && foot.length,
            dLen = datasource.length,
            tds = me.getBody().getElementsByTagName('td'),
            tables = me._main.getElementsByTagName('table'),
            tdsLen = tds.length,
            index = 0,
            td,
            width, 
            i, 
            j,
            colIndex,
            item,
            colspan;
        
        // 重新设置表格尾的每列宽度
        if ( len ) {
            colIndex = 0;
            for ( i = 0; i < len; i++ ) {
                item = foot[i];
                width = colsWidth[colIndex];
                colspan = item.colspan || 1;
                for ( j = 1; j < colspan; j++ ) {
                    width += colsWidth[colIndex + j];
                }
                colIndex += colspan;

                td = baidu.g(me._getFootCellId(i));
                width = width + me.rowWidthOffset;
                
                (width < 0) && (width = 0);
                td.style.width = width + 'px';
                td.style.display = width ? '' : 'none';
            }
        }

        // 重新设置表格头的每列宽度
        len = colsWidth.length;
        if ( !me.noHead ) {
            for (i = 0; i < len; i++) {
                width = colsWidth[i] + me.rowWidthOffset;
                (width < 0) && (width = 0);

                td = baidu.g(me._getTitleCellId(i));
                td.style.width = width + 'px';
                td.style.display = width ? '' : 'none';
            }
        }

        // 重新设置表格体的每列宽度
        j = 0;
        for (i = 0; i < tdsLen; i++) {
            td = tds[i];
            if (td.getAttribute('controlTable') == id) {
                width = colsWidth[j % len] + me.rowWidthOffset;
                (width < 0) && (width = 0);
                td.style.width = width + 'px';
                td.style.display = width ? '' : 'none';
                j++;
            }
        }
    },
    
    /**
     * 第一列的多选框
     * 
     * @private
     */
    FIELD_MULTI_SELECT: {
        width: 30,
        stable: true,
        select: true,
        locked: true,
        dragable : false,
        title: function () {
            return '<input type="checkbox" id="' 
                    + this.__getId('selectAll') 
                    + '" onclick="' 
                    + this.__getStrCall('_toggleSelectAll') 
                    + '">';
        },
        
        content: function (item, index) {
            return '<input type="checkbox" id="' 
                    + this.__getId('multiSelect') + index
                    + '" onclick="' + this.__getStrCall('_rowCheckboxClick', index) + '">';
        }
    },
    
    /**
     * 第一列的单选框
     * 
     * @private
     */
    FIELD_SINGLE_SELECT: {
        width: 30,
        stable: true,
        title: '&nbsp;',
        select: true,
        locked: true,
        content: function (item, index) {
            var id = this.__getId('singleSelect');
            return '<input type="radio" id="' 
                    + id + index
                    + '" name=' + id + ' onclick="' 
                    + this.__getStrCall('_selectSingle', index) 
                    + '">';
        }
    },
    
    /**
     * 行的checkbox点击处理函数
     * 
     * @private
     */
    _rowCheckboxClick: function (index) {
        if (this.selectMode != 'line') {
            this._selectMulti(index);
        } else {
            this._preSelectIndex = index;
        }
    },
    
    /**
     * 根据checkbox是否全部选中，更新头部以及body的checkbox状态
     * 
     * @private
     * @param {number} index 需要更新的body中checkbox行，不传则更新全部
     */
    _selectMulti: function (index) {
        var me = this,
            inputs          = me.getBody().getElementsByTagName('input'),
            i               = 0,
            currentIndex    = 0,
            allChecked      = true,
            len             = inputs.length,
            selectAll       = me._getHeadCheckbox(),
            selected        = [],
            selectedClass   = me.__getClass('row-selected'),
            cbIdPrefix      = me.__getId('multiSelect'),
            updateAll       = !ui._hasValue(index),
            input, inputId, row;
           
        for (; i < len; i++) {
            input = inputs[i];
            inputId = input.id;
            if (input.getAttribute('type') == 'checkbox' 
                && inputId 
                && inputId.indexOf(cbIdPrefix) >= 0
            ) {
                // row = me.getRow(currentIndex); // faster
                if (updateAll) {
                    row = input.parentNode;
                    while (1) {
                        if (row.tagName == 'DIV' // faster
                            && /^ui-table-row/.test(row.className)
                        ) {
                            break;
                        }
                        row = row.parentNode;
                    }
                }

                if (!input.checked) {
                    allChecked = false;
                    // faster
                    updateAll && baidu.removeClass(row, selectedClass); 
                } else {
                    selected.push(currentIndex);
                    // faster
                    updateAll && baidu.addClass(row, selectedClass);
                }
                currentIndex++;
            }
        }
        

        this.onselect(selected);
        if (!updateAll) {
            row = me._getRow(index);
            input = baidu.g(cbIdPrefix + index);
            if (input.checked) {
                baidu.addClass(row, selectedClass);
            } else {
                baidu.removeClass(row, selectedClass);
            }
        }
        selectAll.checked = allChecked;
    },
    
    /**
     * 全选/不选 所有的checkbox表单
     * 
     * @private
     */
    _toggleSelectAll: function () {
        this._selectAll(this._getHeadCheckbox().checked);
    },
    
    /**
     * 更新所有checkbox的选择状态
     * 
     * @private
     * @param {boolean} checked 是否选中
     */
    _selectAll: function (checked) {
        var inputs          = this.getBody().getElementsByTagName('input'),
            len             = inputs.length,
            i               = 0,
            index           = 0,
            selected        = [],
            selectedClass   = this.__getClass('row-selected'),
            cbIdPrefix      = this.__getId('multiSelect'),
            input, inputId;
            
        for (; i < len; i++) {
            input = inputs[i];
            inputId = input.id;
            if (input.getAttribute('type') == 'checkbox' 
                && inputId 
                && inputId.indexOf(cbIdPrefix) >= 0
            ) {
                inputs[i].checked = checked;
                
                if (checked) {
                    selected.push(index);
                    baidu.addClass(this._getRow(index), selectedClass);
                } else {
                    baidu.removeClass(this._getRow(index), selectedClass);
                }
                
                index ++;
            }
        }
        
        this.onselect(selected);
    },
    
    /**
     * 单选选取
     * 
     * @private
     * @param {number} index 选取的序号
     */
    _selectSingle: function (index) {
        var selectedClass = this.__getClass('row-selected'),
            selectedIndex = this._selectedIndex;
        
        if (this.onselect(index)) {
            if ('number' == typeof selectedIndex) {
                baidu.removeClass(this._getRow(selectedIndex), selectedClass);
            }
            
            this._selectedIndex = index;
            baidu.addClass(this._getRow(index), selectedClass);
        }
    },
    
    /**
     * 重置表头样式
     * 
     * @private
     */
    resetHeadStyle: function () {
        var ths = this.getHead().getElementsByTagName('th'),
            len = ths.length,
            th;
            
        while (len--) {
            th = ths[len];
            baidu.removeClass(th.firstChild, this.__getClass('thcell_sort'));
        }    
    },
    
    /**
     * 更新视图
     *
     * @public
     */
    refreshView: function () {
        this._caching();
        this._handleResize();
    },
    
    onedit: new Function(),

    /**
     * 启动编辑功能
     * 
     * @public
     * @param {string}      type        编辑器类型
     * @param {number}      rowIndex    行序号
     * @param {number}      columnIndex 列序号
     */
    startEdit: function (type, rowIndex, columnIndex) {
        if ( this.editable ) {
            var entrance    = baidu.g(this._getBodyCellId(rowIndex, columnIndex));
            var tlOffset    = -5;
            var pos         = baidu.dom.getPosition(entrance);
            var field       = this._fields[columnIndex];
            
            this._currentEditor = ui.Table.EditorManager.startEdit(this, type, {
                left        : pos.left + tlOffset,
                top         : pos.top + tlOffset,
                rowIndex    : rowIndex,
                columnIndex : columnIndex,
                field       : field,
                value       : this.datasource[rowIndex][field.field]
            });
        }
    },
    
    /**
     * 停止编辑功能
     * 
     * @public
     */
    stopEdit: function () {
        if ( this._currentEditor ) {
            this._currentEditor.stop();
            this._currentEditor = null;
        }
    },

    /**
     * 设置单元格的文字
     *
     * @public
     * @param {string} text 要设置的文字
     * @param {string} rowIndex 行序号
     * @param {string} columnIndex 列序号
     * @param {boolean} opt_isEncodeHtml 是否需要进行html转义
     */
    setCellText: function (text, rowIndex, columnIndex, opt_isEncodeHtml) {
        if (opt_isEncodeHtml) {
            text = baidu.encodeHTML(text);
        }

        text += this._getEditEntryHtml(this._fields[columnIndex], rowIndex, columnIndex);
        baidu.g(this._getBodyCellId(rowIndex, columnIndex)).firstChild.innerHTML = text;
    },

    /**
     * 释放控件
     * 
     * @public
     */
    dispose: function () {
        var head = baidu.g(this.__getId('head')),
            mark = baidu.g(this.__getId('dragMark'));

        if (head) {
            head.onmousemove = null;
            head.onmousedown = null;
        }
        
        // 释放表头跟随的元素引用
        this._followDoms = null;

        // 释放自定义的横向滚动条
        if (this._sxHandle) {
            this._sxHandle.onscroll = null;
            this._sxHandle.removeChild(this._sxContent);
            this._main.removeChild(this._sxHandle);
            this._sxHandle = null;
            this._sxContent = null;
        }
        
        // 停止编辑功能
        this.stopEdit();

        // 移除拖拽基准线
        if (mark) {
            document.body.removeChild(mark);
        }

        ui.Base.dispose.call(this);
        
        // remove resize事件listener
        if (this._resizeHandler) {
            baidu.un(window, 'resize', this._resizeHandler);
            this._resizeHandler = null;
        }

        // remove scroll事件listener
        if (this._topReseter) {
            baidu.un(window, 'scroll', this._topReseter);
            this._topReseter = null;
        }
        
    }
};

ui.Base.derive(ui.Table);

/**
 * 表格内容编辑功能的管理器
 *
 * @class
 */
ui.Table.EditorManager = function () {
    var editorMap = {};
    var currentEditor;

    return {
        /**
         * 添加编辑器
         *
         * @public
         * @param {string} type 编辑器类型
         * @param {Object} editor 编辑器对象
         */
        add: function (type, editor) {
            editorMap[type] = editor;
        },
        
        /**
         * 移除编辑器
         *
         * @public
         * @param {string} type 编辑器类型
         */
        remove: function (type) {
            delete editorMap[type];
        },
        
        /**
         * 启动编辑功能
         *
         * @public
         * @param {Object} control 控件对象
         * @param {string} type 编辑器类型
         * @param {Object} options 启动参数表
         */
        startEdit: function (control, type, options) {
            var editor = editorMap[type];
            if (editor) {
                editor.start(control, options);
            }

            return editor;
        },
    };
}();

/**
 * 表格内容编辑器
 *
 * @public
 * @class
 */
ui.Table.Editor = function (options) {
    this.type = 'null';

    for ( var key in options ) {
        this[key] = options[key];
    }

    this.okId = '_ctrlTableEditorOk' + this.type;
    this.cancelId = '_ctrlTableEditorCancel' + this.type;
    this.errorId = '_ctrlTableEditorError' + this.type;
};

ui.Table.Editor.OK_TEXT = '确定';
ui.Table.Editor.CANCEL_TEXT = '取消';
ui.Table.Editor.prototype = {
    _idPrefix: '__table_editor__',
    
    /**
     * 浮层内容的模板
     *
     * @public
     */
    tpl: '<div ui="id:{0};type:Button;skin:em">{2}</div><div ui="id:{1};type:Button;">{3}</div>',
    
    /**
     * 初始化表格内容编辑器
     *
     * @public
     */
    init: function () {
        if ( !this._isInit ) {
            var layer = ui.util.create('Layer', {
                id: this._idPrefix + this.type,
                retype: 'table-editor ui-table-editor-' + this.type
            });
            layer.appendTo();
            this.layer = layer;
            
            this.initLayer();
            this._isInit = 1;
        }
    },
    
    /**
     * 初始化编辑器浮层
     *
     * @public
     */
    initLayer: function () {
        this.fillLayer();
        var controlMap = this.initLayerControl();
        this.initButton(controlMap);
    },
    
    /**
     * 初始化浮层的控件
     *
     * @public
     * @return {Object} 初始化的控件集合
     */
    initLayerControl: function () {
        return ui.util.init(this.layer.getMain());
    },
    
    /**
     * 填充浮层的内容
     *
     * @public
     * @param {Array} extraArgs 浮层模板附加参数
     */
    fillLayer: function (extraArgs) {
        extraArgs = extraArgs || [];

        var layerMain = this.layer.getMain();
        var tpl = this.tpl;

        extraArgs.unshift(
            tpl, 
            this.okId,
            this.cancelId, 
            ui.Table.Editor.OK_TEXT, 
            ui.Table.Editor.CANCEL_TEXT,
            this.errorId);

        layerMain.innerHTML = ui._format.apply(window, extraArgs);
    },
    
    /**
     * 初始化浮层的确定和取消按钮行为
     *
     * @public
     * @param {Object} controlMap 初始化的控件集合
     */
    initButton: function (controlMap) {
        var okButton = controlMap[this.okId];
        var cancelButton = controlMap[this.cancelId];

        okButton.onclick = this.getOkHandler();
        cancelButton.onclick = this.getCancelHandler();

        this.okButton = okButton;
        this.cancelButton = cancelButton;

        this.disableButton(1);
    },
    
    /**
     * 设置按钮的disabled状态
     *
     * @public
     * @param {boolean} disabled 按钮的disabled状态
     */
    disableButton: function (disabled) {
        this.okButton.disable(disabled);
        this.cancelButton.disable(disabled);
    },

    /**
     * 获取当前编辑器所编辑的值
     *
     * @public
     * @return {Any} 
     */
    getValue: function () {return null;},
    
    /**
     * 获取确定按钮的点击行为handler
     *
     * @private
     * @return {Function} 
     */
    getOkHandler: function () {
        var me = this;
        return function () {
            me.doOk();
        };
    },

    doOk: function () {
        if ( this.currentTable.onedit(
                this.getValue(), 
                this.currentOptions, 
                this) !== false 
        ) {
            this.stop();
        }
    },
    
    /**
     * 获取取消按钮的点击行为handler
     *
     * @private
     * @return {Function} 
     */
    getCancelHandler: function () {
        var me = this;
        return function () {
            me.stop();
        };
    },
    
    /**
     * 停止编辑功能
     *
     * @public
     */
    stop: function () {
        this.layer.hide();
        this.disableButton(1);
    },
    
    /**
     * 启动编辑功能
     *
     * @public
     * @param {Object} table 表格控件实例
     * @param {Object} options 启动参数表
     */
    start: function (table, options) {
        this.init();
        this.currentTable = table;
        this.currentOptions = options;
        
        var left = options.left || 0;
        var top = options.top || 0;
        
        this.unsetError();
        this.disableButton(0);
        this.layer.show(left, top);
        this.setValue && this.setValue(options.value, options);
    },
    
    /**
     * 暂停编辑功能
     *
     * @public
     */
    wait: function () {
        this.disableButton(1);
    },
    
    /**
     * 重启编辑功能
     *
     * @public
     */
    restart: function () {
        this.disableButton(0);
    },

    setError: function (error) {
        var errorEl = baidu.g(this.errorId);
        errorEl.innerHTML = error;
        baidu.show(errorEl);
    },

    unsetError: function () {
        baidu.hide(this.errorId);
    }
};

// 初始化内建表格编辑部件 - string类型
ui.Table.EditorManager.add('string', 
    new ui.Table.Editor({
        /**
         * 编辑器类型
         *
         * @public
         */
        type:'string',

        /**
         * 编辑器层内容模板
         *
         * @public
         */
        tpl: '<input type="text" ui="type:TextInput;id:{5}" />'
            + '<div ui="id:{0};type:Button;skin:em">{2}</div>'
            + '<div ui="id:{1};type:Button;">{3}</div>'
            + '<div id="{4}" class="ui-table-editor-error"></div>',
        inputId: '_ctrlTableEditorStringInput',

        /**
         * 初始化编辑器浮层
         *
         * @public
         */
        initLayer: function () {
            this.fillLayer([this.inputId]);
            var controlMap = this.initLayerControl();
            this.inputCtrl = controlMap[this.inputId];
            this.inputCtrl.onenter = this.getOkHandler();
            this.initButton(controlMap);
        },
        
        /**
         * 设置当前编辑器的值
         *
         * @public
         * @param {string} value 值内容
         */
        setValue: function (value) {
            this.inputCtrl.setValue(value);
        },
        
        /**
         * 获取当前编辑器所编辑的值
         *
         * @public
         * @return {string}
         */
        getValue: function () {
            return this.inputCtrl.getValue();
        }
    }));

// 初始化内建表格编辑部件 - int类型
ui.Table.EditorManager.add('int', 
    new ui.Table.Editor({
        /**
         * 编辑器类型
         *
         * @public
         */
        type:'int',

        /**
         * 编辑器层内容模板
         *
         * @public
         */
        tpl: '<input type="text" ui="type:TextInput;id:{5}" />'
            + '<div ui="id:{0};type:Button;skin:em">{2}</div>'
            + '<div ui="id:{1};type:Button;">{3}</div>'
            + '<div id="{4}" class="ui-table-editor-error"></div>',
        inputId: '_ctrlTableEditorIntInput',

        /**
         * 初始化编辑器浮层
         *
         * @public
         */
        initLayer: function () {
            this.fillLayer([this.inputId]);
            var controlMap = this.initLayerControl();
            this.inputCtrl = controlMap[this.inputId];
            this.inputCtrl.onenter = this.getOkHandler();
            this.initButton(controlMap);
        },
        
        /**
         * 设置当前编辑器的值
         *
         * @public
         * @param {string} value 值内容
         */
        setValue: function (value) {
            this.inputCtrl.setValue(value);
        },
        
        /**
         * 获取当前编辑器所编辑的值
         *
         * @public
         * @return {string}
         */
        getValue: function () {
            return parseInt(this.inputCtrl.getValue(), 10);
        },

        getOkHandler: function () {
            var me = this;

            return function () {
                var value = me.inputCtrl.getValue();
                if (!/^\d+$/.test(value)) {
                    me.setError('请输入正确的整数，谢谢。');
                    return;
                }

                me.doOk();
            };
        }
    }));

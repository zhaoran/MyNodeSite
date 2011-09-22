/**
 * @author zhaoran02
 */
chart.index = new er.Action({
	VIEW : 'chartindex',
	UI_PROP_MAP : {},
	CONTEXT_INITER_MAP : {},
	onafterrender : function(){
		function dataAdapter(rawData){
			var rawStr = rawData.data.data,
			    rawArr = rawStr.split(' ');
			var dateArr = [],
				dataArr = [[], [], [], []],
				tagArr = [[], [], [], []],
				overview = '',
				showIndex = 0;
			var i, len, _item, _itemArr, _key, _value;
			for(i = 1, len = rawArr.length; i < len; i++){
				_item = rawArr[i];
				_itemArr = _item.split('=');
				_key = _itemArr[0];
				// 去掉单引号
				_value = _itemArr[1].replace(/'/g, '');
				switch(_key){
					case 'date':
						dateArr.push(_value);
						break;
					case 'data1':
						dataArr[0].push(parseInt(_value));
						break;
					case 'data2':
						dataArr[1].push(parseInt(_value));
						break;
					case 'data3':
						dataArr[2].push(parseFloat(_value));
						break;
					case 'data4':
						dataArr[3].push(parseFloat(_value));
						break;
					case 'overview':
						overview = _value;
						break;
					case 'showIndex':
						showIndex = _value;
						break;
					case 'tag1':
						tagArr[0] = _value;
						break;
					case 'tag2':
						tagArr[1] = _value;
						break;
					case 'tag3':
						tagArr[2] = _value;
						break;
					case 'tag4':
						tagArr[3] = _value;
						break;
				}//end switch
			}//end for
			
			// get statArr
			var statArr = [0, 0, 0.0000, 0.00];
			for(i = 0, len = dateArr.length; i < len; i++){
				statArr[0] += dataArr[0][i];
				statArr[1] += dataArr[1][i];
				statArr[3] += dataArr[3][i];
			}
			statArr[2] = (statArr[1]/statArr[0]*100).toFixed(4);
			statArr[3] = statArr[3].toFixed(2);
			statArr[0] = baidu.number.comma(tagArr[0].replace(/\/[\u4e00-\u9fa5]*\//, statArr[0]));
			statArr[1] = baidu.number.comma(tagArr[1].replace(/\/[\u4e00-\u9fa5]*\//, statArr[1]));
			statArr[2] = baidu.number.comma(tagArr[2].replace(/\/[\u4e00-\u9fa5]*\//, statArr[2]));
			statArr[3] = baidu.number.comma(tagArr[3].replace(/\/[\u4e00-\u9fa5]*\//, statArr[3]));
			//
				
			// format tagArr and get series 
			var	series = [],
				reg = new RegExp('/[\u4e00-\u9fa5]*/');
			for(i = 0, len = tagArr.length; i < len; i++){
				tagArr[i] = (tagArr[i].match(reg))[0].replace(/\//g, '');
				series.push({
					'name' : tagArr[i],
					'data' : dataArr[i]
				});
			}//end for		
			return {
				'series' : series,
				'labels' : dateArr,
				'overview' : {
						'text' : overview,
						'date' : dateArr[0].replace(/-/g, '.') + ' - ' + dateArr[dateArr.length-1].replace(/-/g, '.'),
						'statArr' : statArr,
						'tagArr' : tagArr
				}				
			};
		}//end fn
		var rawData = 
{
    "data": {
        "data": "<?xml version='1.0' encoding='utf-8'?><data overview='上周' showIndex='0' tag1='/展现次数/' tag2='/点击次数/' tag3='/点击率/%' tag4='￥/总费用/' selected='4'><record date='2011-09-12' data1='935616' data2='1133' data3='0.1211' data4='1567.1'/><record date='2011-09-13' data1='921623' data2='1084' data3='0.1176' data4='1506.72'/><record date='2011-09-14' data1='929247' data2='1060' data3='0.11410000000000001' data4='1516.39'/><record date='2011-09-15' data1='652874' data2='746' data3='0.11429999999999998' data4='1136.18'/><record date='2011-09-16' data1='2423' data2='1' data3='0.0413' data4='1.89'/><record date='2011-09-17' data1='3344' data2='4' data3='0.1196' data4='9.26'/><record date='2011-09-18' data1='2978' data2='1' data3='0.0336' data4='1.32'/></data>",
        "state": 0
    },
    "msg": [],
    "status": 0,
    "statusInfo": {}
}
		
		var data = dataAdapter(rawData),
			overview = data.overview,
			series = data.series,
			labels = data.labels;
		var me = this;
		var options = {
			overview : {
				visible : 1,
				width : 960,
				height : 50,
				data : overview
			},
			chart : {
				width : 690,
				height : 240
			},
			title : {},
			series : series,
			xAxis : {
				labels : labels
			},
			yAxis : {},
			legend : {},
			tooltip : {}
		};
		
		ui.get('svgBtn').onclick = me.getPlotHandler(options);
		var canvas = baidu.g('canvas');
		if(!canvas.getContext){
			return;
		}
		var ctx = canvas.getContext('2d');
		if(ctx){
			var x = 0, y = 0;
			setInterval(function(){
				ctx.clearRect(0,0,400,400);
				ctx.fillStyle = "red";
				ctx.fillRect(x++, y++, 50, 50);
			}, 500);
		}
		
	},
	getPlotHandler : function(options){
		var me = this;
		var SVG_NS = 'http://www.w3.org/2000/svg';
		var hasSVG = !!document.createElementNS && !!document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGRect;
		function createSVGElem(tagName, attrs, container){
			var elem, textnode, text;
			elem = document.createElementNS(SVG_NS, tagName);
			if(attrs['text']){
				text = attrs['text'];
				if(tagName == 'tspan'){
					node = document.createTextNode(text);
					elem.appendChild(node);
				}else if(tagName == 'text'){
					createSVGElem('tspan', 
							{
								'text' : text
							},
							elem);
				}
				attrs['text'] = '';
			}
			attrs && baidu.setAttrs(elem, attrs);
			container && baidu.g(container).appendChild(elem);
			return elem
		}
		function parseData(data){
			var max,
				min,
				sum,
				average,
				item;
			if(! data instanceof Array){
				data = [data];
			}
			var len = data.length;
			max = min = sum = data[0];
			for(var i = 1; i < len; i++){
				item = data[i];
				max = max >= item ? max : item;
				min = min <= item ? min : item;
				sum += item;
			}
			average = sum/len;
			return {
				'max' : max,
				'min' : min,
				'average' : average.toFixed(2),
				'len' : len
			};
		}
		function getPointMouseOverHandler(gTooltip){
			return function(){
				this.setAttribute('r', 7.5);
				this.setAttribute('style', 'stroke-width:3;stroke:#6666ff;fill:white;cursor:pointer;');
				var cx = parseFloat(this.getAttribute('cx'));
				var cy = parseFloat(this.getAttribute('cy'));
				gTooltip.setAttribute('transform', 'translate(' + cx + ',' +  cy + ')');
				gTooltip.setAttribute('visibility', 'visible');
			};
		}
		function getPointMouseOutHandler(gTooltip){
			return function(){
				this.setAttribute('r', 5);
				this.setAttribute('style', 'stroke-width:2;stroke:#71a5de;fill:white;cursor:pointer;');
				gTooltip.setAttribute('visibility', 'hidden');
			};
		}
		return function(){
			var svgContainer = baidu.g('svgContainer');
			if(!hasSVG){
				svgContainer.innerHTML = '<div style="margin-top:50px;">您的浏览器不支持SVG，请更换为firefox3.0以上版本浏览</div>';
				return;
			}
			this.setContent('redraw');
			var containerWidth = svgContainer.offsetWidth,
				containerHeight = svgContainer.offsetHeight;
			var overview = options.overview;
			var ovWidth = overview.width || containerWidth,
				ovHeight = overview.height || 50;
			if(!overview.visible){
				ovWidth = ovHeight = 0;
			}
			var seriesMargin = [35, 50, 45, 70];
			var svgSizeX = containerWidth,
				svgSizeY = containerHeight;
			var seriesOrigin = [seriesMargin[3], svgSizeY - seriesMargin[2]],
				axisSizeX = svgSizeX - seriesMargin[1] - seriesMargin[3];
				axisSizeY = svgSizeY - seriesMargin[0] - seriesMargin[2] - ovHeight;
			var clipRectMaxWidth = axisSizeX + 20;	
			baidu.hide('svgContainer');			
			baidu.g('svgContainer').innerHTML = '';
			//create svg
			var svg = createSVGElem('svg', 
						{
							'xmlns' : SVG_NS,
							'version' : '1.1',
							'viewBox' : [0, 0, svgSizeX, svgSizeY].join(' '),
							'width' : svgSizeX + 'px',
							'height' : svgSizeY + 'px'
						},
						'svgContainer');
			// create defs
			var defs = createSVGElem('defs', {}, svg),
				gOverview = createSVGElem('g', 
						{
							'class' : 'gOverview',
							'transform' : 'translate(0, 0)'
						}, 
						svg),			
				gAll = createSVGElem('g', 
						{
							'class' : 'gAll',
							'transform' : 'translate(' + seriesOrigin.join(',') +')'
						}, 
						svg),
				gAxes = createSVGElem('g', 
						{
							'class' : 'gAxes'
						}, 
						gAll),
			 	gGrids = createSVGElem('g', 
						{
							'class' : 'gGrids'
						}, 
						gAll),
			 	gLabels = createSVGElem('g', 
						{
							'class' : 'gLabels'
						}, 
						gAll),
			 	gSeries = createSVGElem('g', 
						{
							'class' : 'gSeries',
							'clip-path' : 'url(#animateRect)'
						}, 
						gAll);
			 	gPoints = createSVGElem('g', 
						{
							'class' : 'gPoints',
							'clip-path' : 'url(#animateRect)'
						}, 
						gAll),
				gTooltip = createSVGElem('g',
						{
							'class' : 'gTooltip',
							'visibility' : 'hidden'
						},
						gAll);			
			// create clipPath
			var clipPath = createSVGElem('clipPath',
						{
							'id' : 'animateRect'
						},
						defs),
			 	clipRect = createSVGElem('rect', 
						{
							'x' : -10,
							'y' : '-' + seriesOrigin[1],
							'width' : 0,
							'height' : seriesOrigin[1] + 10
						}, 
						clipPath);
			//create linear
			var linear = createSVGElem('linearGradient',
						{
							'x1' : '0%',
							'y1' : '0%',
							'x2' : '0%',
							'y2' : '80%',
							'id' : 'linear'
						},
						defs);
			createSVGElem('stop',
					{
						'offset' : '0%',
						'style' : 'stop-color:white'
					},
					linear);
			createSVGElem('stop',
					{
						'offset' : '80%',
						'style' : 'stop-color:rgb(227,235,255)'
					},
					linear);	
			//create overview			
			createSVGElem('rect', 
					{
						'x' : 1,
						'y' : 1,
						'rx' : 2,
						'ry' : 2,
						'width' : 958,
						'height' : 50,
						'style' : 'stroke-width:2px;stroke:#6699cc;fill:url(#linear)'
					},
					gOverview); 
			var ovData = overview.data,
				statArr = ovData.statArr,
				tagArr = ovData.tagArr;
			var styleStatNumber = 'font-size:16px;font-weight:bold;',
				styleStatTag = 'fill:rgb(153,153,153)';
			createSVGElem('text',
					{
						'text' : ovData.text + ' 数据概括',
						'x' : 20,
						'y' : 20
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : ovData.date,
						'x' : 20,
						'y' : 40
					},
					gOverview);
				
			createSVGElem('text',
					{
						'text' : statArr[0],
						'x' : ovWidth -400,
						'y' : 20,
						'style' : styleStatNumber
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : tagArr[0],
						'x' : ovWidth -400,
						'y' : 40,
						'style' : styleStatTag
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : statArr[1],
						'x' : ovWidth -300,
						'y' : 20,
						'style' : styleStatNumber
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : tagArr[1],
						'x' : ovWidth -300,
						'y' : 40,
						'style' : styleStatTag
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : statArr[2],
						'x' : ovWidth -200,
						'y' : 20,
						'style' : styleStatNumber
					},
					gOverview);
			createSVGElem('text',
					{
						'text' : tagArr[2],
						'x' : ovWidth -200,
						'y' : 40,
						'style' : styleStatTag
					},
					gOverview); 
			createSVGElem('text',
					{
						'text' : statArr[3],
						'x' : ovWidth -100,
						'y' : 20,
						'style' : styleStatNumber
					},
					gOverview); 
			createSVGElem('text',
					{
						'text' : tagArr[3],
						'x' : ovWidth -100,
						'y' : 40,
						'style' : styleStatTag
					},
					gOverview);   			
			// create Axis
			createSVGElem('path', 
					{
						'd' : ['M 0,0', 'h ' + axisSizeX].join(' '),
						'style' : 'stroke-width:2;stroke:#5f6160;'
					}, 
					gAxes),
			 createSVGElem('path', 
					{
						'd' : ['M 0,0', 'v -' + axisSizeY].join(' '),
						'style' : 'stroke-width:2;stroke:#5f6160;'
					}, 
					gAxes);
			// y title
			createSVGElem('text',
					{
						'text' : tagArr[3],
						'x' : -16,
						'y' : '-' + (axisSizeY + 10)
					},
					gAxes); 
			var i;
			
			// grid Y
			var series = options.series[3],
			 	data = series.data;
			var dataObj = parseData(data),
				maxdata = dataObj.max;
			var minStepY = axisSizeY/maxdata;
			var gridCountY = 3;
			for(i = 1; i<= gridCountY; i++){
				// grid Y
				createSVGElem('line', 
						{
							'x1' : 1,
							'y1' : '-' + minStepY * i * maxdata/gridCountY,
							'x2' : axisSizeX,
							'y2' : '-' + minStepY * i * maxdata/gridCountY,
							'style' : 'stroke:#f5f5f5;stroke-width:2;'
						},
						gGrids);
				// label Y
				createSVGElem('text', 
						{
							'x' : -50,
							'y' : '-' + (minStepY * i * maxdata/gridCountY - 5),
							'text' : (i * maxdata/gridCountY).toFixed(2)
						},
						gLabels);
			}
			// average
			var average = dataObj.average;
			createSVGElem('line', 
					{
						'x1' : 1,
						'y1' : '-' + minStepY * average,
						'x2' : axisSizeX,
						'y2' : '-' + minStepY * average,
						'style' : 'stroke:#f9c697;stroke-width:2;stroke-dasharray:2,2;'
					},
					gGrids);
			createSVGElem('text', 
					{
						'x' : -45,
						'y' : '-' + (minStepY * average - 5),
						'style' : 'fill:#fabb81;',
						'text' : average
					},
					gLabels);
			// grid X
			var xAxis = options.xAxis, labelsX = xAxis.labels, labelsXLen = labelsX.length;
			var dataLen = dataObj.len;
			var seriesLen = labelsXLen < dataLen ? labelsXlen : dataLen;
			var minStepX = axisSizeX/(seriesLen - 1);
			var path = [], type = 'L ';
			var point, cx, cy, pointsArr = [];
			for(var i = 0; i < seriesLen; i++){
				// series
				type = 'L ';
				if(i == 0){
					type = 'M ';
				}
				cx = minStepX * i;
				cy = '-' + minStepY * data[i];
				path.push(type +  cx+ ',' + cy);
				// grid X
				if(i > 0){
					var gridX = createSVGElem('line', 
							{
								'x1' : cx,
								'y1' : -1,
								'x2' : cx,
								'y2' : '-' + axisSizeY,
								'style' : 'stroke:#f5f5f5;stroke-width:2;'
							}, 
							gGrids);
				}
				// labelX
				createSVGElem('text',
						{
							'x' : cx - 30,
							'y' : 15,
							'text' : labelsX[i]
						},
						gLabels);
				// point
				point = createSVGElem('circle', 
						{
							'cx' : cx,
							'cy' : cy,
							'r' : 5,
							'style' : 'stroke-width:2;stroke:#71a5de;fill:white;cursor:pointer;'
						},
						gPoints);		
				pointsArr.push(point);
			}//end for
			var seriesLine = createSVGElem('path',
						{
							'd' : path.join(' '),
							'style' : 'stroke-width:2;stroke:#71a5de;fill:none;'
						},
						gSeries);			
			//animation
			var duration = 1000, animationStep = 50;
			var clipRectWidth = 0;
			var timer = setInterval(function(){
				clipRectWidth += animationStep;
				if(clipRectWidth > clipRectMaxWidth){
					timer = null;
					clipRectWidth = clipRectMaxWidth;
				}
				baidu.setAttr(clipRect, 'width', clipRectWidth);
			}, duration*animationStep/axisSizeX);			
			// tooltip
			
			var triWidth = 40, triHeight = 15,
				rectWidth = 144, rectHeight = 110;
			var tempPath = ['M 0,0',
							'l ' + (-triWidth/2) + ',' + triHeight,
							'h ' + (-(rectWidth-triWidth)/2),
							'v ' + rectHeight,
							'h ' + rectWidth,
							'v ' + (-rectHeight),
							'h ' + (-(rectWidth-triWidth)/2),
							'l ' + (-triWidth/2) + ',' + (-triHeight),
							'l ' + (-triWidth/2) + ',' + triHeight,
							'h ' + triWidth].join(' ');
			createSVGElem('path',
					{
						'd' : tempPath,
						'style' : 'fill:black;fill-opacity:0.6;stroke:black;stroke-width:1;stroke-opacity:0.4'
					},
					gTooltip);
			createSVGElem('path',
					{
						'd' : ['M ' + (-triWidth/2) + ',' + triHeight, 'h ' + triWidth].join(' '),
						'style' : 'stroke:black;stroke-width:1;'
					},
					gTooltip);
			// create tooltip content
			var tooltipText = createSVGElem('text',
						{
							'x' : -rectWidth/2 + 10,
							'y' : triHeight + 12,
							'style' : 'fill:white;'
						},
						gTooltip);
			createSVGElem('tspan', 
					{
						'x' : -rectWidth/2 + 10,
						'dy' : 5,
						'text' : '2011-08-01'
					},
					tooltipText);
			createSVGElem('tspan', 
					{
						'x' : -rectWidth/2 + 10,
						'dy' : 16,
						'text' : 'current value'
					},
					tooltipText);
			for(var i = 0; i < seriesLen; i++){
				point = pointsArr[i];
				baidu.event.on(point, 'mouseover', getPointMouseOverHandler(gTooltip));
				baidu.event.on(point, 'mouseout', getPointMouseOutHandler(gTooltip));
			}
			// container
			baidu.show('svgContainer');
		};//end return
	},
});
/**
 * @author zhaoran02
 */
chart.index = new er.Action({
	VIEW : 'chartindex',
	UI_PROP_MAP : {},
	CONTEXT_INITER_MAP : {},
	onafterrender : function(){
		var me = this;
		var options = {
			chart : {
				width : 690,
				height : 240
			},
			title : {},
			series : [
				{
					name : '',
					data : [0,70,14,47,0,31,93]
				}
			],
			xAxis : {
				labels : ['2011-08-01', '2011-08-02', '2011-08-03', '2011-08-04', '2011-08-05', '2011-08-06', '2011-08-07']
			},
			yAxis : {},
			legend : {},
			tooltip : {}
		};
		ui.get('svgBtn').onclick = me.getPlotHandler(options);
		var canvas = baidu.g('canvas');
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
		var svgContainer = baidu.g('svgContainer');
		var containerWidth = svgContainer.offsetWidth,
			containerHieght = svgContainer.offsetHeight;
		var seriesMargin = [70, 50, 70, 70];
		var svgSizeX = containerWidth,
			svgSizeY = containerHieght;
		var seriesOrigin = [seriesMargin[3], svgSizeY - seriesMargin[2]],
			axisSizeX = svgSizeX - seriesMargin[1] - seriesMargin[3];
			axisSizeY = svgSizeY - seriesMargin[0] - seriesMargin[2];
		var clipRectMaxWidth = axisSizeX + 20;	
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
			this.setContent('redraw');
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
			var i;
			
			// grid Y
			var series = options.series[0],
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
							'x' : -25,
							'y' : '-' + (minStepY * i * maxdata/gridCountY - 5),
							'text' : (i * maxdata/gridCountY)
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
						'x' : -35,
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
/**
 * @author zhaoran02
 */
chart.openflashchart = new er.Action({
	VIEW : 'openflashchart',
	onafterrender : function(){
		var swfOptions = {
			id : 'openFlashChart',
			url : 'asset/swf/open-flash-chart.swf',
			width : '500',
			height : '250',
			ver : '9.0.0',
			vars : 'data-file=src/testdata/openflashchart.json'
		};
		baidu.swf.create(swfOptions, 'openFlashChartContainer2');
		
	}
});

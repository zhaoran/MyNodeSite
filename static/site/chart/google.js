/**
 * @author zhaoran02
 */
chart.google = new er.Action({
	VIEW : 'google',
	UI_PROP_MAP : {},
	CONTEXT_INITER_MAP : {},
	onafterrender : function(){
		var me = this;
		ui.get('editChartBtn').onclick = me.editChart();
	},
	getEditChartHandler : function(){
		var me = this;
		return function(){	
			me.editChart();
		};
	},
	editChart : function(){
		var me = this;
		return function(){
	    	var visual = google.visualization;
	    	var chartEditor = new visual.ChartEditor();
	    	me.setContext('chartEditor', chartEditor);
			var params = {
				chartType: 'LineChart',
				dataSourceUrl: 'http://spreadsheets.google.com/tq?key=pCQbetd-CptGXxxQIG7VFIQ&pub=1',
				containerId: 'lineChartWrap',
				query: 'select A,D where D > 100 order by D',
				options: {
					title: 'Popu',
					legend: 'none'
				}
			};
			var wrap = new visual.ChartWrapper(params);
			visual.events.addListener(chartEditor, 'ok', me.redrawChart());
			chartEditor.openDialog(wrap, {});
		};
	},
	redrawChart : function(){
		var me = this;
		return function(){
			var chartEditor = me.getContext('chartEditor');
			chartEditor.getChartWrapper().draw(baidu.g('lineChartWrap'));
		};
	}
});
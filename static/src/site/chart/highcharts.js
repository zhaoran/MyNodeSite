/**
 * @author zhaoran02
 */
chart.highcharts = new er.Action({
	VIEW : 'highcharts',
	UI_PROP_MAP : {},
	CONTEXT_INITER_MAP : {},
	onafterrender : function(){
		var options = {
			chart : {
				renderTo : 'highchartsContainer',
				type : 'bar'
			},
			title : {
				text : 'highcharts'
			},
			xAxis : {
				categories : ['Apples', 'Bananas', 'Oranges']
			},
			yAxis : {
				title : {
					text : 'Fruit eaten'
				}
			},
			series : [
				{
					name : 'Jane',
					data : [1, 0, 4]
				},
				{
					name : 'Jhon',
					data : [3, 5, 8]
				}
			]
		};
		var highchart = new Highcharts.Chart(options);
	}
});

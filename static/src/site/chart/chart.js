/**
 * @author zhaoran02
 */
var chart = new er.Module({
	config : {
		action : [
	          {
				path : '/chart/google',
				action : 'chart.google'
	          },
	          {
				path : '/chart/highcharts',
				action : 'chart.highcharts'
	          },
	          {
	          	path : '/chart/openflashchart',
	          	action : 'chart.openflashchart'
	          },
	          {
	          	path : '/chart/number',
	          	action : 'chart.number'
	          }
		]
	}
});
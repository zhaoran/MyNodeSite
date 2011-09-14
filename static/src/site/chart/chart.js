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
	          }
		]
	}
});
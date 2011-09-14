/**
 * @author zhaoran02
 */
NODE_DEBUG && build.importJs([
	'lib/tangram-1.3.9/tangram-1.3.9.js',
	'lib/jquery/jquery-1.4.2.js',
	'lib/highcharts-2.1.6/highcharts.src.js',
	'lib/er-1.2.0/er.js',
	
	'lib/er-1.2.0/extends/UIAction.js',
	'lib/er-1.2.0/extends/UIAdapter.js',
	
	'lib/er-1.2.0/esui/ui.js',
	'lib/er-1.2.0/esui/Base.js',
	'lib/er-1.2.0/esui/Link.js',
//	"lib/er-1.2.0/esui/BaseBox.js",
	"lib/er-1.2.0/esui/BaseInput.js",
	'lib/er-1.2.0/esui/Button.js',
	
	'site/global/config.js',
	
	'site/home/home.js',
	'site/home/index.js',
	
	'site/chart/chart.js',
	'site/chart/config.js',
	'site/chart/google.js',
	'site/chart/highcharts.js'
	
], NODE_SRC_ROOT);

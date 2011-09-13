/**
 * @author zhaoran02
 */
NODE_DEBUG && build.importJs([
	'lib/tangram-1.3.9/tangram-1.3.9.js',
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
	'site/chart/google.js'
	
], NODE_ROOT);

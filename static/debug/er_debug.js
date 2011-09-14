/**
 * @author zhaoran02
 */
var NODE_DEBUG = true;
var NODE_TPL_LIST = [];
var NODE_ROOT = '/';
var NODE_DEBUG_ROOT = '/debug/';
var NODE_SRC_ROOT = '/src/';

var build = build || {
	importTpl : function(path, root){
		for(var i = 0, len = path.length; i < len; i++){
			NODE_TPL_LIST.push(root + path[i]);
		}
	},
	importJs : function(path, root){
		for(var i = 0, len = path.length; i < len; i++){
			document.write('<script type="text/javascript" src="' + root + path[i] + '"></script>');
		}
	},
	importCss : function(path, root){
		var head = document.getElementsByTagName('head')[0],
			links = document.createDocumentFragment(),
			link;
		for(var i = 0, len = path.length; i < len; i++){
			link = document.createElement('link');
			link.href = root + path[i];
			link.rel = 'stylesheet';
			links.appendChild(link);
		}
		head.appendChild(links);
	}
};
if(NODE_DEBUG){
	build.importJs(['debug_tpl.js'], NODE_DEBUG_ROOT);
	build.importJs(['debug_js.js'], NODE_DEBUG_ROOT);
//	build.importJs(['debug_css.js'], NODE_DEBUG_ROOT);
}

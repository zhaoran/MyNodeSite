/**
 * @author zhaoran02
 */
var home = new er.Module({
	config : {
		action : [
			{
				path : '/',
				action : 'home.index'
			}
		]
	}
});

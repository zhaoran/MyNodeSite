/**
 * @author zhaoran02
 */
chart.number = new er.Action({
	VIEW : 'number',
	UI_PROP_MAP : {
		maxTable : {
			datasource : '*maxTableSource',
			fields : '*maxTableFields',
			noDataHtml : 'no data',
			width : 200
		}
	},
	CONTEXT_INITER_MAP : {
		maxTable : function(callback){
			var me = this;
			var maxTableFields = [
				{
					title : 'number',
					align : 'center',
					field : 'number',
					width : 100,
					content : function(data){
						return data.number;
					}
				},
				{
					title : 'max',
					align : 'center',
					field : 'max',
					width : 100,
					content : function(data){
						return data.maxDistance;
					}
				}
			];
			me.setContext('maxTableFields', maxTableFields);
//			me.setContext('maxTableSource', []);
			callback();
		}
	},
	onafterrender : function(){
		var me = this;
		ui.get('numberBtn').onclick = me.getNumberBtnClickHandler();
	},
	onentercomplete : function(){
		var me = this;
		var numberInputSource = me.getContext('numberInputSource');
		ui.get('numberInput').setValue(numberInputSource);
	},
	getNumberBtnClickHandler : function(){
		var me = this;
		return function(){
			var nums = ui.get('numberInput').getValue();
			me.setContext('numberInputSource', nums);
			var max = [],
				cur = [],
				num;
			for(var i = 0, len = nums.length; i < len; i++){
				num = parseInt(nums.charAt(i));
				if(typeof num != 'number'){
					continue;
				}
				for(var j = 0, len2 = 10; j < len2; j++){
					if(j == num){
						if(typeof cur[num] == 'undefined'){
							cur[num] = 0;
						}else{
							if(typeof max[num] == 'undefined'){
								max[num] = cur[num];
							}else{
								max[num] = max[num] > cur[num] ? max[num] : cur[num];
							}
							cur[num] = 0;
						}
					}else{
						if(typeof cur[j] != 'undefined'){
							cur[j]++;
						}
					}//end if
				}//end for j	
			}//end for i
			var maxTableSource = [];
			for(var i = 0, len = max.length; i < len; i++){
				if(typeof max[i] != 'undefined'){
					maxTableSource.push({
						number : i,
						maxDistance : max[i]
					});
				}
			}//end for i
			me.setContext('maxTableSource', maxTableSource);
			me.refresh();
		};
	}
});

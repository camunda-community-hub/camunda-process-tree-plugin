define([ 'angular' ], function(angular) {
	var ngModule = angular.module('tasklist.plugin.process-tree-plugin', []);
	ngModule.factory('treeService', function() {
		var newFactory;
		newFactory.method1 = function() {			
			console.log('factory created.');
		}		
		return newFactory;
	});
});
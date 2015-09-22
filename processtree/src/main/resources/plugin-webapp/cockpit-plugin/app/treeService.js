define([ 'angular' ], function(angular) {
	
	var ngModule = angular.module('treeService', []);
	
	ngModule.factory('treeService', function() {
	
		var treeServiceFactory = {};
		
		treeServiceFactory.treeDataById = function(id) {
			
			console.log('Building tree data with id: ' + id);
			
			return [ 'Simple root node', {
				'id' : 'node_2',
				'text' : 'Root node with options',
				'state' : {
					'opened' : true,
					'selected' : true
				},
				'children' : [ {
					'text' : 'Child 1'
				}, 'Child 2' ]
			} ];
		}
		return treeServiceFactory;
	
	});
});
define([ 'angular' ], function(angular) {

	var treeServiceModule = angular.module('treeService', []);

	treeServiceModule.factory('treeService', function() {

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
								 
	treeServiceModule.directive('processTree', ['treeService', function(treeService) {
		
		function link(scope, element, attrs) {
			console.log('---------------------------- link function ------------------------------')
			console.log(attrs);
			
			scope.treeData = treeService.treeDataById(attrs.id)
		}
		
		return {
			scope: {
				id: '=id', 
				//treeData: treeService.treeDataById($scope.id)
			},
			link: link,
			templateUrl: '/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.html'
		}
	}]);
});
define([ 'angular' ], function(angular) {

	var treeServiceModule = angular.module('treeService', []);

	treeServiceModule.factory('treeService', function() {

		var treeServiceFactory = {};

		treeServiceFactory.treeDataByCurrentTask = function(task) {

			console.log('Building tree data with task: ' + task);
			console.log(task);

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
			console.log(scope.currentTask); 
			
			var currentTaskObject = attrs.currentTask ? scope.$parent.$eval(attrs.currentTask) : {};
			
			scope.treeData = treeService.treeDataByCurrentTask(currentTaskObject)
			
			scope.treeConfig = {
				"core" : {
					"themes" : {
						"variant" : "large"
					}
				},
				"checkbox" : {
					"keep_selected_style" : false
				},
				"plugins" : [ "wholerow" ]
			}
			
			scope.readyCB = function() {
		        console.log('ready called');
		    };
		    
		    scope.selectNodeCB = function(node, selected, event) {
		    	console.log('selectNodeCB called');
		    	console.log(node);
		    	console.log(selected);
		    };
		    
		}
		
		return {
			scope: {
				currentTask: '=',
			},
			link: link,
			templateUrl: '/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.html'
		}
	}]);
});
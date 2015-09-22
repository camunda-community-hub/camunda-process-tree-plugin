define(
		[
				'angular',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/jstree.js',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/ngJsTree.js',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.js' ],

		function(angular, jstree, ngJsTree, treeService) {

			var ngModule = angular.module(
					'tasklist.plugin.process-tree-plugin', [ 'ngJsTree',
							'treeService' ]);

			var Controller = [
					'$scope',
					'$modal',
					'$http',
					'camAPI',
					'dataDepend',
					'treeService',
					function($scope, $modal, $http, camAPI, dataDepend,
							treeService) {

						// TODO passing correct id here:
						$scope.treeData = treeService.treeDataById('xxx');

						var ProcessDefinition = camAPI
								.resource('process-definition');

						var diagramData = $scope.taskData.newChild($scope);

						diagramData.observe('processDefinition', function(
								processDefinition) {
							$scope.processDefinition = processDefinition;

							ProcessDefinition.xml(processDefinition, function(
									err, res) {
								if (err) {
									throw err;
								} else {
									$scope.processXml = res.bpmn20Xml;
								}
							});
						});
						
						$scope.readyCB = function() {
					        console.log('ready called');
					    };
					    
					    $scope.selectNodeCB = function(node, selected, event) {
					    	console.log('selectNodeCB called');
					    	console.log(node);
					    	console.log(selected);
					    };
					    
					    
					} ];

			var Configuration = function PluginConfiguration(ViewsProvider) {

				ViewsProvider
						.registerDefaultView(
								'tasklist.task.detail',
								{
									id : 'tasklist-plugin',
									label : 'Process Tree',
									// url :
									// 'plugin://process-tree-plugin/static/app/test.html',
									url : 'tasklistbase://../../api/tasklist/plugin/process-tree-plugin/static/app/test.html',
									controller : Controller,
									priority : 200
								});
			};

			Configuration.$inject = [ 'ViewsProvider' ];

			ngModule.config(Configuration);
			ngModule.controller(Controller);

			return ngModule;
		});

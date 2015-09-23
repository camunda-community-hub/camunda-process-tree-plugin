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

						var ProcessDefinition = camAPI
								.resource('process-definition');

						var diagramData = $scope.taskData.newChild($scope);

						diagramData.observe('task', function(task) {
							$scope.currentTask = task;
						});

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
					    
					} ];

			var Configuration = function PluginConfiguration(ViewsProvider) {

				ViewsProvider
						.registerDefaultView(
								'tasklist.task.detail',
								{
									id : 'tasklist-plugin',
									label : 'Process Tree',
									url: '/camunda/api/tasklist/plugin/process-tree-plugin/static/app/test.html',
									controller : Controller,
									priority : 200
								});
			};

			Configuration.$inject = [ 'ViewsProvider' ];

			ngModule.config(Configuration);
			ngModule.controller(Controller);

			return ngModule;
		});

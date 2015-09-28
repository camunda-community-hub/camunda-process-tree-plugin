define(
		[
				'angular',
				'jquery',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/jstree.js',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/ngJsTree.js',
				'/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.js' ],

		function(angular, $, jstree, ngJsTree, treeService) {

			var pluginModule = angular.module(
					'tasklist.plugin.process-tree-plugin', [ 'ngJsTree',
							'treeService' ]);

			var Controller = [
					'$scope',
					'camAPI',
					function($scope, camAPI) {

						var ProcessDefinition = camAPI
								.resource('process-definition');

						var diagramData = $scope.taskData.newChild($scope);
						
						diagramData.observe('task', function(task) {
							$scope.currentTask = task;
						});

						diagramData.observe('processDefinition', function(
								processDefinition) {
							
							$scope.processDefinition = processDefinition;

							assignDiagramToWidget(processDefinition);
							
						});
						
						$scope.$watch('processDefinition', function(newValue, oldValue) {

							assignDiagramToWidget(newValue);
							
						});

						var assignDiagramToWidget = function(processDefinition) {
							
							ProcessDefinition.xml($scope.processDefinition, function(
									err, res) {
								if (err) {
									throw err;
								} else {
									$scope.processXml = res.bpmn20Xml;
								}
							});
							
						}
						
					} ];
			

			var Configuration = function PluginConfiguration(ViewsProvider) {

				ViewsProvider
						.registerDefaultView(
								'tasklist.task.detail',
								{
									id : 'tasklist-plugin',
									label : 'Process Tree',
									url : '/camunda/api/tasklist/plugin/process-tree-plugin/static/app/test.html',
									controller : Controller,
									priority : 200
								});
			};

			Configuration.$inject = [ 'ViewsProvider' ];

			pluginModule.config(Configuration);
			pluginModule.controller(Controller);

			return pluginModule;
		});

define(
		[ 'angular' ],
		function(angular, treeService) {
			var ngModule = angular.module(
					'tasklist.plugin.process-tree-plugin', []);

			var Controller = [
					'$scope',
					'$modal',
					'$http',
					'camAPI',
					'dataDepend',
					'treeService',
					function($scope, $modal, $http, camAPI, dataDepend,
							treeService) {
						console.log(treeService);
						treeService.method1();
						var ProcessDefinition = camAPI
								.resource('process-definition');

						var procDefId = null;

						var diagramData = $scope.taskData.newChild($scope);

						diagramData.observe('processDefinition', function(
								processDefinition) {
							console.log(processDefinition);
							$scope.processDefinition = processDefinition;

							ProcessDefinition.xml(processDefinition, function(
									err, res) {
								if (err) {
									throw err;
								} else {
									console.log(res);
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
									url : 'tasklistbase://../../api/tasklist/plugin/process-tree-plugin/static/app/test.html',
									controller : Controller,
									priority : 200
								});
			};

			Configuration.$inject = [ 'ViewsProvider' ];

			ngModule.config(Configuration);
			ngModule.controller(Controller);

			ngModule.factory('treeService', function() {
				var newFactory = {};
				newFactory.method1 = function() {			
					console.log('factory created.');
				}		
				return newFactory;
			});
			
			return ngModule;
		});

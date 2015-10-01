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
					'$q',
					'$http',
					'camAPI',
					function($scope, $q, $http, camAPI) {

						var ProcessDefinition = camAPI.resource('process-definition');

						var diagramData = $scope.taskData.newChild($scope);
						
						diagramData.observe('task', function(task) {
							$scope.currentTask = task;
							$scope.processInstanceId = task.processInstanceId;
						});

						diagramData.observe('processDefinition', function(
								processDefinition) {

							assignDiagramToWidget(processDefinition);
						});
						
						$scope.$watch('processDefinition', function(newValue, oldValue) {

							assignDiagramToWidget(newValue);
														
						});

						var assignDiagramToWidget = function(processDefinition) {
							
							$scope.processDefinition = processDefinition;
							
							ProcessDefinition.xml($scope.processDefinition, function(
									err, res) {
								if (err) {
									throw err;
								} else {									
									$scope.processXml = res.bpmn20Xml + '<!-- '+ Math.floor(Math.random()*10000000) +' -->';																										
								}
							});							
							
						}
						
						diagramData.provide('bpmn20xml', ['processDefinition', function (processDefinition) {
					        var deferred = $q.defer();

					        if (!processDefinition) {
					          return deferred.resolve(null);
					        }

					        ProcessDefinition.xml(processDefinition, function(err, res) {
					          if(err) {
					            deferred.reject(err);
					          }
					          else {
					            deferred.resolve(res);
					          }
					        });

					        return deferred.promise;
					      }]);
						
						diagramData.provide('processDiagram', ['bpmn20xml', 'processDefinition', 'task', function (bpmn20xml, processDefinition, task) {
					      var processDiagram = {};

					      processDiagram.processDefinition = processDefinition;
					      processDiagram.task = task;
					      processDiagram.bpmn20xml = (bpmn20xml || {}).bpmn20Xml;

					      return processDiagram;
					    }]);
					    
					    
					    processDiagramState = diagramData.observe('processDiagram', function (processDiagram) {
					    	$scope.processDiagram = processDiagram;
					    });
					    
					    $scope.highlightTask = function(element) {
			    	
							$http.post('/engine-rest/engine/default/history/activity-instance',
									{processInstanceId: $scope.processInstanceId,
									 position: {bottom: 30, right: -30}})
									 .then(function(successCallback) {
										
										var activities = successCallback.data;
										
										activities.sort(function(a,b) {                         
					                           if (b.startTime < a.startTime) {
					                                  return 1;
					                           } else if (a.startTime == b.startTime) {
					                        	   
					                        	   	  if (a.durationInMillis == null) {
					                        	   		  return 1;
					                        	   	  } else if (b.durationInMillis == null) {
					                        	   		  return -1;
					                        	   	  } else if ( a.durationInMillis && b.durationInMillis ) {
					                                         return b.durationInMillis - a.durationInMillis
					                                  }
					                        	   	  
					                                  return 0; 
					                           } else {
					                                  return -1;
					                           }
					                     });
										
										// Element types ignored during marking
										var ignoredElementTypes = ["multiInstanceBody"];
										
										var running = false;
										activities.forEach(function(entry) {

											// If an element with no end time is present, the instance is still running.
											if (!entry.endTime) {
												running = true;
											}

											var color = 'blue';
											if (running) {
												color = 'green';
											}											

											if ($.inArray(entry.activityType, ignoredElementTypes) == -1) {

												//$scope.control.highlight(entry.activityId);
												var canvas = $scope.control.getViewer().get('canvas');
												canvas.addMarker(entry.activityId, 'djs-outline');
																																					
												$scope.control.createBadge(
														entry.activityId,
														{html: '<svg height="30" width="30"><circle cx="13" cy="13" r="10" stroke="black" stroke-width="3" fill="'+color+'" /></svg>'});																							
												
											}
											

												
										});
										
										// Only running instances should have a badge. (current blocking activity)
											
										
//										var lastActivity = activities[activities.length - 1];
//										
//										if ($.inArray(lastActivity.activityType, ignoredElementTypes) == -1) {
//											
//										}
											
									});
					    };
					}];
			

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

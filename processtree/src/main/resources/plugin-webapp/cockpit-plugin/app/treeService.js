define([ 'angular' ], function(angular) {

	var css = "/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/style.css";
	$.get(css, function(data){
		// while including the css file we lose the context of the file path, so we need to enrich the includes of the images with absolute url 
		data = data.replace(/(\(\"32px\.png\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/32px.png")');
		data = data.replace(/(\(\"40px\.png\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/40px.png")');
		data = data.replace(/(\(\"throbber\.gif\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/throbber.gif")');
	    $("<style type=\"text/css\">" + data + "</style>").appendTo(document.head);
	});

	
	var treeServiceModule = angular.module('treeService', []);

	treeServiceModule.factory('treeService', ['camAPI','$q',function(camAPI,$q) {

		var treeServiceFactory = {};

		treeServiceFactory.treeDataByCurrentTask = function(task) {

			var treeDataByCurrentTaskDefer = $q.defer();
			
			console.log('Building tree data with task: ' + task);
			console.log(task);

			var procDefId = null;					
			var processInstanceId = task.processInstanceId;							

			//find parent of process instance for current task.
			HistoryService = camAPI.resource('history');
			
			var workingObject = [ 'Simple root node HAHA', {
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
			
									
			fillTheTree().then(
					function(treeData) {
						treeDataByCurrentTaskDefer.resolve(treeData);
					},
					function(error) {
						treeDataByCurrentTaskDefer.reject(error);
					}
			);			
			
			function fillTheTree() {
				var fillTheTreeDefer = $q.defer();
				HistoryService.processInstance({processInstanceId: processInstanceId},function(err,res) {
					if (err) {
						throw err;
					} else {
						if (res[0] != null) {
							var instance = res[0];
							//enrichInstanceWithParent(instance);
							var treeDataToBeFilled = {};						
							
							var promise = findTopParent(instance);
							
							var topInstance;
							
							promise.then(
									
									//diese verschachtelten promises sind nicht sehr sauber, man sollte 
									//es im endeffekt so schreiben können: 
									// findProcessInstance(id).then(enrichInstanceWithParent).then(findTopParent).then(enrichWithChildren)...
									// geht das? Stefan kann das sicher, ich habs noch nicht ganz durchschaut...
									function (succInstance) {
										topInstance = succInstance										
										var treeDataToBeFilled = {};
										treeDataToBeFilled.id = topInstance.id;
										treeDataToBeFilled.definitionId = topInstance.processDefinitionId;
										treeDataToBeFilled.text = topInstance.processDefinitionKey;
										treeDataToBeFilled.state = {'opened' : true, 'selected' : false};
										if (topInstance != null) {
											var promise = enrichWithChildren(topInstance, treeDataToBeFilled);
											
											promise.then(
													function (succInstance) {
														console.log(treeDataToBeFilled);
														fillTheTreeDefer.resolve(treeDataToBeFilled);														
													},
													function (error) {
														console.log(error);
														fillTheTreeDefer.reject(error);
													}
											);
										}									
									},
									function (error){
										console.log(error);
										fillTheTreeDefer.reject(error);
									}
							);						
						}
					}
				});
				return fillTheTreeDefer.promise;
			}
			
			function enrichWithChildren(instance, node, parentDeferred) {
				
				var deferred = parentDeferred || $q.defer();
				
				var HistoryService = camAPI.resource('history');
				HistoryService.processInstance({superProcessInstanceId: instance.id}, function(err, res) {
					if (err) {
						deferred.reject(err);
					} else {
						if (res.length == 0) {
							//exit condition
							deferred.resolve(instance);
						} else {
							var children = [];
							for (i=0;i<res.length;i++) {
								var child = {};
								child.id = res[i].id;
								child.text = res[i].processDefinitionKey;
								child.definitionId = res[i].processDefinitionId;
/*
								retrieveNameForProcessDefiniton(child.definitionId).then(
										function(result) {
											child.name = result; 
										},
										function (err) {
											console.log(err);
											throw err;
										}
								);
*/
								child.state = {'opened' : true, 'selected' : false};
								children.push(child);
							}
							node.children = children;							
							for (i=0;i<node.children.length;i++) {
								var promise = enrichWithChildren(res[i],node.children[i], deferred);
								promise.then(
										function(succInstance){deferred.resolve(succInstance)},
										function(error){deferred.reject(error)}
								);
							}
						}						
					}
				});
				return deferred.promise;
			}
			
			function retrieveNameForProcessDefiniton(definitionId) {
				var retriveNameDefer = $q.defer();
				var ProcessDefinition = camAPI.resource('process-definition');				
				ProcessDefinition.get(definitionId, function(err,res) {
					if (err) {
						retriveNameDefer.reject(err);
					} else {
						retriveNameDefer.resolve(res.name);
					}
				});
				return retriveNameDefer.promise;
			}
			
			function findTopParent(instance, parentDeferred) {
				
				var deferred = parentDeferred || $q.defer();
				
				var HistoryService = camAPI.resource('history');
				HistoryService.processInstance({subProcessInstanceId: instance.id}, function(err, res) {
					if (err) {
						deferred.reject(err);
					} else {
						//exit condition:
						var superInstances = res;
						if (superInstances[0] == null || superInstances[0]['id'] == null) {
							instance['superProcessInstanceId']='#';									
							deferred.resolve(instance);
						} else {
							//recursion:
							var promise = findTopParent(superInstances[0], deferred);
							promise.then(
									function(succInstance){deferred.resolve(succInstance)},
									function(error){deferred.reject(error)}
							);
						}
					}
				});	
				return deferred.promise;
			}														
			return treeDataByCurrentTaskDefer.promise;			
		}
		return treeServiceFactory;
	}]);
								 
	treeServiceModule.directive('processTree', ['treeService', function(treeService) {
		
		function link(scope, element, attrs) {
			
			var currentTaskObject = attrs.currentTask ? scope.$parent.$eval(attrs.currentTask) : {};
						 
			treeService.treeDataByCurrentTask(currentTaskObject).then(
						function(succInstance) {

							scope.treeData = succInstance;							
							
							scope.treeConfig = {
									"core" : {
										"themes" : {
											"variant" : "large", 
											"icons":false
										}
									}
								//,
									//"plugins" : [ "wholerow" ]
								}
								
								scope.readyCB = function() {
							        console.log('ready called');
							    };
							    
							    scope.selectNodeCB = function(node, selected, event) {
							    	console.log('selectNodeCB called');
							    	console.log(node);
							    	console.log(selected);
							    };

						},
						function(error) {
							throw error;
						}
					);						
		    
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
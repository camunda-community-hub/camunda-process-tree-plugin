define([ 'angular' ], function(angular) {

	var treeServiceModule = angular.module('treeService', []);

	treeServiceModule.factory('treeService', ['camAPI','$q',function(camAPI,$q) {

		var treeServiceFactory = {};

		treeServiceFactory.treeDataByCurrentTask = function(task) {

			console.log('Building tree data with task: ' + task);
			console.log(task);

			var procDefId = null;					
			var processInstanceId = task.processInstanceId;							

			//find parent of process instance for current task.
			ProcessInstance = camAPI.resource('process-instance');
			
			ProcessInstance.list({processInstanceIds: processInstanceId},function(err,res) {
				if (err) {
					throw err;
				} else {
					if (res.items[0] != null) {
						var instance = res.items[0];
						enrichInstanceWithParent(instance);
						var treeDataToBeFilled = {};						
						
						var promise = findTopParent(instance);
						
						var topInstance;
						
						promise.then(
								function (succInstance){
									topInstance = succInstance 
								},
								function (error){
									throw error
								}
						);
						
						treeDataToBeFilled = topInstance.id;
						if (topInstance != null) {
							console.log('TOP PARENT:');
							console.log(topInstance);
							enrichWithChildren(topInstance, treeDataToBeFilled);
						}
					}
				}
			});
			
			//get the processDefinition
			var ProcessDefinition = camAPI
			.resource('process-definition');											
			
			function enrichWithChildren(instance, node) {
				var ProcessInstance = camAPI.resource('process-instance');
				ProcessInstance.list({superProcessInstance: instance.id}, function(err, res) {
					if (err) {
						throw err;
					} else {
						if (res.items.length == 0) {
							//exit condition
						} else {
							var children;
							for (i=0;i<res.items.length;i++) {
								var child;
								child.id = res.item[i].id;
								children[i] = child;
							}
							node.children = children;
							
							for (i=0;i<node.children.length;i++) {
								enrichWithChildren(res.items[i],node.children[i]);
							}
						}						
					}
				});
			}
			
			function findTopParent(instance) {
				
				var deferred = $q.defer();
				
				var ProcessInstance = camAPI.resource('process-instance');
				ProcessInstance.list({subProcessInstance: instance.id}, function(err, res) {
					if (err) {
						deferred.reject(err);
					} else {
						//exit condition:
						var superInstances = res;
						if (superInstances.items[0] == null || superInstances.items[0]['id'] == null) {
							instance['superProcessInstanceId']='#';									
							enrichInstanceWithParentIfIsIncident(instance);
							promise.resolve(instance);
						} else {
							//recursion:
							var promise = findTopParent(superInstances.items[0]);
							promise.then(
									function(succInstance){deferred.resolve(succInstance)},
									function(error){deferred.reject(error)}
							);
						}
					}
				});	
				return deferred.promise;
			}									
			
			function enrichInstanceWithParent(instance) {
				var ProcessInstance = camAPI.resource('process-instance');								
				ProcessInstance.list({subProcessInstance: instance.id}, function(err, res) {
					if (err) {
						throw err;
					} else {
						var superInstances = res;
						if (superInstances.items[0] == null || superInstances.items[0]['id'] == null) {
							instance['superProcessInstanceId']='#';
							enrichInstanceWithParentIfIsIncident(instance); 
						} else {
							instance['superProcessInstanceId']=superInstances.items[0]['id'];										
						}
					}
				});
			}
						
			function enrichInstanceWithParentIfIsIncident(instance) {
				var History = camAPI.resource('history');
				History.processInstance({name:'incidentProcessInstanceId', operator:'eq', value:instance.id}, function(err,res) {
					if (err) {
						throw err;
					} else {
						var variables = res;
						if (variables.items[0] != null && variables.items[0]['value'] != null) {
							instance['superProcessInstanceId'] = variables.items[0]['value'];
						}
					}
				});
			}			
			
			
			
			
			
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
	}]);
								 
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
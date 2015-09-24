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

			console.log('Building tree data with task: ' + task);
			console.log(task);

			var procDefId = null;					
			var processInstanceId = task.processInstanceId;							

			//find parent of process instance for current task.
			ProcessInstance = camAPI.resource('process-instance');
			
			fillTheTree().then(
					function(treeData) {
						return treeData;
					},
					function(error) {
						throw error;
					}
			);
						
//			return [ 'Simple root node HAHA', {
//				'id' : 'node_2',
//				'text' : 'Root node with options',
//				'state' : {
//					'opened' : true,
//					'selected' : true
//				},
//				'children' : [ {
//					'text' : 'Child 1'
//				}, 'Child 2' ]
//			} ];
			
			
			function fillTheTree() {
				defered = $q.defer();
				ProcessInstance.list({processInstanceIds: processInstanceId},function(err,res) {
					if (err) {
						throw err;
					} else {
						if (res.items[0] != null) {
							var instance = res.items[0];
							//enrichInstanceWithParent(instance);
							var treeDataToBeFilled = {};						
							
							var promise = findTopParent(instance);
							
							var topInstance;
							
							promise.then(
									
									//diese verschachtelten promises sind nicht sehr sauber, man sollte 
									//es im endeffekt so schreiben können: 
									// findProcessInstance(id).then(enrichInstanceWithParent).then(findTopParent).then(enrichWithChildren)...
									// geht das? Stefan kann das sicher, ich habs noch nicht ganz durchschaut...
									function (succInstance){
										topInstance = succInstance										
										var treeDataToBeFilled = {};
										treeDataToBeFilled.id = topInstance.id;
										treeDataToBeFilled.text = "Here is the top "+topInstance.id;
										if (topInstance != null) {
											var promise = enrichWithChildren(topInstance, treeDataToBeFilled);
											
											promise.then(
													function (succInstance) {
														console.log('got the model ready...');
														console.log(treeDataToBeFilled);
														defered.resolve(treeDataToBeFilled);
													},
													function (error) {
														console.log(error);
														defered.reject(error);
													}
											);
										}									
									},
									function (error){
										console.log(error);
										defered.reject(error);
									}
							);						
						}
					}
				});
				return defered.promise;
			}
			
			function enrichWithChildren(instance, node, parentDeferred) {
				
				var deferred = parentDeferred || $q.defer();
				
				var ProcessInstance = camAPI.resource('process-instance');
				ProcessInstance.list({superProcessInstance: instance.id}, function(err, res) {
					if (err) {
						deferred.reject(err);
					} else {
						if (res.items.length == 0) {
							//exit condition
							deferred.resolve(instance);
						} else {
							var children = [];
							for (i=0;i<res.items.length;i++) {
								var child = {};
								child.id = res.items[i].id;
								child.text = "I am child "+child.id;
								children.push(child);
							}
							node.children = children;							
							for (i=0;i<node.children.length;i++) {
								var promise = enrichWithChildren(res.items[i],node.children[i], deferred);
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
			
			function findTopParent(instance, parentDeferred) {
				
				var deferred = parentDeferred || $q.defer();
				
				var ProcessInstance = camAPI.resource('process-instance');
				ProcessInstance.list({subProcessInstance: instance.id}, function(err, res) {
					if (err) {
						deferred.reject(err);
					} else {
						//exit condition:
						var superInstances = res;
						if (superInstances.items[0] == null || superInstances.items[0]['id'] == null) {
							instance['superProcessInstanceId']='#';									
							//enrichInstanceWithParentIfIsIncident(instance);
							console.log('resolving...')
							deferred.resolve(instance);
							console.log('resolved!')
						} else {
							//recursion:
							var promise = findTopParent(superInstances.items[0], deferred);
							promise.then(
									function(succInstance){deferred.resolve(succInstance)},
									function(error){deferred.reject(error)}
							);
						}
					}
				});	
				return deferred.promise;
			}									
			
//			function enrichInstanceWithParent(instance) {
//				var ProcessInstance = camAPI.resource('process-instance');								
//				ProcessInstance.list({subProcessInstance: instance.id}, function(err, res) {
//					if (err) {
//						throw err;
//					} else {
//						var superInstances = res;
//						if (superInstances.items[0] == null || superInstances.items[0]['id'] == null) {
//							instance['superProcessInstanceId']='#';
//							enrichInstanceWithParentIfIsIncident(instance); 
//						} else {
//							instance['superProcessInstanceId']=superInstances.items[0]['id'];										
//						}
//					}
//				});
//			}
//						
//			function enrichInstanceWithParentIfIsIncident(instance) {
//				var History = camAPI.resource('history');
//				History.processInstance({name:'incidentProcessInstanceId', operator:'eq', value:instance.id}, function(err,res) {
//					if (err) {
//						throw err;
//					} else {
//						var variables = res;
//						if (variables.items[0] != null && variables.items[0]['value'] != null) {
//							instance['superProcessInstanceId'] = variables.items[0]['value'];
//						}
//					}
//				});
//			}			
			
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
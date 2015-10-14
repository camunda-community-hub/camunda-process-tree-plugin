define([ ], function() {

    var css ='/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/style.css';
    $.get(css, function(data) {
        // while including the css file we lose the context of the file path, so
        // we need to enrich the includes of the images with absolute url
        data = data.replace(/(\(\"32px\.png\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/32px.png")');
        data = data.replace(/(\(\"40px\.png\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/40px.png")');
        data = data.replace(/(\(\"throbber\.gif\"\))/g, '("/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/throbber.gif")');
        $("<style type=\"text/css\">" + data + "</style>").appendTo(document.head);
    });

    var treeServiceModule = angular.module('treeService', []);

    treeServiceModule.factory('treeService', [ 'camAPI', '$q', function(camAPI, $q) {

        var treeServiceFactory = {};

        treeServiceFactory.treeDataByCurrentTask = function(task) {

            var currentProcessInstanceId = task.processInstanceId;
            HistoryService = camAPI.resource('history');
        	var IncidentService = camAPI.resource('incident');

            var findProcessInstanceById = function(currentProcessInstanceId) {

                var findProcessInstanceDefer = $q.defer();
                HistoryService.processInstance({
                    processInstanceId : currentProcessInstanceId
                }, function(err, res) {
                    if (err) {
                        throw err;
                    }
                    if (res[0]) {
                        findProcessInstanceDefer.resolve(res[0]);
                    }
                });
                return findProcessInstanceDefer.promise;
            };

            var findTopParentInstance = function(instance, parentDeferred) {

                var findTopParentDefered = parentDeferred || $q.defer();

                HistoryService.processInstance({
                    subProcessInstanceId : instance.id
                }, function(err, res) {
                    if (err) {
                        findTopParentDefered.reject(err);
                    } else {
                        // exit condition:
                        var superInstances = res;
                        if (!superInstances[0] || !superInstances[0].id) {
                            instance.superProcessInstanceId = '#';
                            findTopParentDefered.resolve(instance);
                        } else {
                            // recursion:
                            findTopParentInstance(superInstances[0], findTopParentDefered).then(function(succInstance) {
                                findTopParentDefered.resolve(succInstance);
                            }, function(error) {
                                findTopParentDefered.reject(error);
                            });
                        }
                    }
                });
                return findTopParentDefered.promise;
            };

            var buildTreeDataByInstance = function(instance) {            	
                var treeData = {};
                treeData.id = instance.id;
                treeData.definitionId = instance.processDefinitionId;
                treeData.text = instance.processDefinitionKey;
                var selected = instance.id === currentProcessInstanceId; 
                                
                var styleClass = !instance.endTime ? 'processOngoing' : 'processFinished';
                                
                treeData.li_attr = {
                    'class' : styleClass
                };
                treeData.state = {
                    'opened' : true,
                    'selected' : selected
                };
                return treeData;
            };
            
            var findProcessesWithIncident = function(treeData, parentDefer) {
            	var processWithIncidentDefer = parentDefer || $q.defer();
            	IncidentService.get({
        		processInstanceId: treeData.id
            	}, function(err, res) {
	        		if (err) {
	        			processWithIncidentDefer.reject(err);
	        		} else {
	        			console.log('Res:');
	        			console.log(res);
	        			console.log(res.length);
	        			if (res.length > 0) {
		        			treeData.li_attr = {
		        					'class' : 'processError'
		                    }
	        			} else {
		        			treeData.li_attr = {
		        					'class' : 'processOngoing'
		                    }	        				
	        			}
	                	if (!treeData.children) {
	                		processWithIncidentDefer.resolve(treeData);
	                	} else {	                		
	                		var childrenDeferred = [];            		
	    	            	for (i = 0; i < treeData.children.length; i++) {
	    	            		var childDefer = $q.defer();
	    	            		childrenDeferred[i] = findProcessesWithIncident(treeData.children[i], childDefer);
	    	            	}
	    	            	$q.all(childrenDeferred).then(function() {
	    	            		processWithIncidentDefer.resolve(treeData);
	    	            	});
	                	}            		        		        		
	        		}
            	});
            	return processWithIncidentDefer.promise;
            	
//            	var processWithIncidentDefer = $q.defer();   
//            	var IncidentService = camAPI.resource('incident');
//            	IncidentService.get({
//            		processInstanceId: treeData.id
//            	}, function(err, res) {
//            		if (err) {
//            			processWithIncidentDefer.reject(err);
//            		} else {
//            			console.log('ProcessInstanceId: ' + treeData.id);
//            			console.log('Incidents found: '+ res.length);
//            			var incidents = res;
//            			if (incidents != null && incidents.length > 0) {
//            				treeData.hasIncident = true;
//            			}
//            			processWithIncidentDefer.resolve(treeData);
//            		}
//            	});            	
//            	return processWithIncidentDefer.promise;
            };
            
            var enrichParentInstanceWithChildren = function(topInstance) {
                var fillTheTreeDefer = $q.defer();
                if (topInstance) {
                    var treeDataToBeFilled = buildTreeDataByInstance(topInstance);
                    enrichWithChildren(topInstance, treeDataToBeFilled).then(function(succInstance) {
                        fillTheTreeDefer.resolve(treeDataToBeFilled);
                    }, function(error) {
                        console.log(error);
                        fillTheTreeDefer.reject(error);
                    });
                }
                return fillTheTreeDefer.promise;
            };

            var enrichWithChildren = function(instance, node, parentDeferred) {

                var enrichWithChildrenDeferred = parentDeferred || $q.defer();

                HistoryService.processInstance({
                    superProcessInstanceId : instance.id
                }, function(err, res) {
                    if (err) {
                        enrichWithChildrenDeferred.reject(err);
                    } else {
                        if (res.length === 0) {
                            // exit condition
                            enrichWithChildrenDeferred.resolve(instance);
                        } else {
                            var children = [];
                            for (i = 0; i < res.length; i++) {
                                children.push(buildTreeDataByInstance(res[i]));
                            }
                            node.children = children;

                            var childrenDeferred = [];

                            for (i = 0; i < node.children.length; i++) {
                                var childDeferred = $q.defer();
                                childrenDeferred[i] = enrichWithChildren(res[i], node.children[i], childDeferred);
                            }
                            $q.all(childrenDeferred).then(function() {
                                enrichWithChildrenDeferred.resolve(instance);
                            });
                        }
                    }
                });
                return enrichWithChildrenDeferred.promise;
            };

            var treeDataByCurrentTaskDefer = $q.defer();

            findProcessInstanceById(currentProcessInstanceId)//
            .then(findTopParentInstance)//            
            .then(enrichParentInstanceWithChildren)//
            .then(findProcessesWithIncident)//
            .then(function(treeData) {
                treeDataByCurrentTaskDefer.resolve(treeData);
            }, function(error) {
                treeDataByCurrentTaskDefer.reject(error);
            });

            return treeDataByCurrentTaskDefer.promise;
        };
        return treeServiceFactory;
    } ]);

    treeServiceModule.directive('processTree', [ 'treeService', 'camAPI', function(treeService, camAPI) {

        function link(scope, element, attrs) {

            scope.selectNodeCB = function(node, selected, event) {

                var ProcessDefinition = camAPI.resource("process-definition");
                ProcessDefinition.get(selected.node.original.definitionId, function(err, res) {

                    if (err) {
                        throw err;
                    } else {
                        if (res) {
                            scope.$parent.processDefinition = res;
                        }
                    }
                });

                var selectedProcessInstanceId = selected.selected[0];
                scope.$parent.processInstanceId = selectedProcessInstanceId;
            };

            var fillTreeByCurrentTask = function(currentTaskObject) {

                treeService.treeDataByCurrentTask(currentTaskObject).then(function(succInstance) {
                    scope.treeData = succInstance;
                    scope.treeConfig.version++;
                }, function(error) {
                    throw error;
                });
            };

            scope.$watch('currentTask', function(newValue, oldValue) {
                if (newValue !== oldValue) {
                    fillTreeByCurrentTask(newValue);
                }
            }, true);

            scope.treeConfig = {
                "core" : {
                    "themes" : {
                        "variant" : "large",
                        "icons" : false
                    }
                },
                version : 1
            };

            var currentTaskObject = attrs.currentTask ? scope.$parent.$eval(attrs.currentTask) : {};
            fillTreeByCurrentTask(currentTaskObject);

        }

        return {
            scope : {
                currentTask : '=',
            },
            link : link,
            templateUrl : '/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.html'
        };
    } ]);
});
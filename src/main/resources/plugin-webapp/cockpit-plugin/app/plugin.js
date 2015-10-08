define([ 'angular', 'jquery', //
'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/jstree.js', //
'/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/ngJsTree.js', //
'/camunda/api/tasklist/plugin/process-tree-plugin/static/app/treeService.js' ],

function(angular, $, jstree, ngJsTree, treeService) {

    var css = '/camunda/api/tasklist/plugin/process-tree-plugin/static/lib/themes/default/user-styles.css';
    $.get(css, function(data) {
        $("<style type=\"text/css\">" + data + "</style>").appendTo(document.head);
    });

    var pluginModule = angular.module('tasklist.plugin.process-tree-plugin', [ 'ngJsTree', 'treeService' ]);

    var Controller = [ '$scope', '$q', '$http', 'camAPI', function($scope, $q, $http, camAPI) {

        var ProcessDefinition = camAPI.resource('process-definition');

        var diagramData = $scope.taskData.newChild($scope);

        diagramData.observe('task', function(task) {
            $scope.currentTask = task;
            $scope.processInstanceId = task.processInstanceId;
        });

        diagramData.observe('processDefinition', function(processDefinition) {

            assignDiagramToWidget(processDefinition);
        });

        $scope.$watch('processDefinition', function(newValue, oldValue) {

            assignDiagramToWidget(newValue);

        });

        var assignDiagramToWidget = function(processDefinition) {

            $scope.processDefinition = processDefinition;

            ProcessDefinition.xml($scope.processDefinition, function(err, res) {
                if (err) {
                    throw err;
                } else {
                    $scope.processXml = res.bpmn20Xml + '<!-- ' + Math.floor(Math.random() * 10000000) + ' -->';
                }
            });

        }

        diagramData.provide('bpmn20xml', [ 'processDefinition', function(processDefinition) {
            var deferred = $q.defer();

            if (!processDefinition) {
                return deferred.resolve(null);
            }

            ProcessDefinition.xml(processDefinition, function(err, res) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(res);
                }
            });

            return deferred.promise;
        } ]);

        diagramData.provide('processDiagram', [ 'bpmn20xml', 'processDefinition', 'task', function(bpmn20xml, processDefinition, task) {
            var processDiagram = {};

            processDiagram.processDefinition = processDefinition;
            processDiagram.task = task;
            processDiagram.bpmn20xml = (bpmn20xml || {}).bpmn20Xml;

            return processDiagram;
        } ]);

        processDiagramState = diagramData.observe('processDiagram', function(processDiagram) {
            $scope.processDiagram = processDiagram;
        });

        $scope.highlightTask = function(element) {

            $http.post('/engine-rest/engine/default/history/activity-instance', {
                processInstanceId : $scope.processInstanceId
            }).then(function(successCallback) {

                var activities = successCallback.data;

                activities.sort(function(a, b) {
                    if (b.startTime < a.startTime) {
                        return 1;
                    } else if (a.startTime == b.startTime) {

                        if (a.durationInMillis == null) {
                            return 1;
                        } else if (b.durationInMillis == null) {
                            return -1;
                        } else if (a.durationInMillis && b.durationInMillis) {
                            return b.durationInMillis - a.durationInMillis
                        }

                        return 0;
                    } else {
                        return -1;
                    }
                });

                // Element types ignored during marking
                var ignoredElementTypes = [ "multiInstanceBody" ];

                var running = false;
                activities.forEach(function(entry) {

                    // If an element with no end time is present, the instance
                    // is still running.
                    if (!entry.endTime) {
                        running = true;
                    }

                    var taskStatus = 'task-finished';
                    if (running) {
                        taskStatus = 'task-running';
                    }

                    if ($.inArray(entry.activityType, ignoredElementTypes) == -1) {
                        // $scope.control.highlight(entry.activityId);
                        var canvas = $scope.control.getViewer().get('canvas');
                        canvas.addMarker(entry.activityId, 'highlight-' + taskStatus);
                    }

                });

            });

            var IncidentService = camAPI.resource('incident');
            IncidentService.get({
                processInstanceId : $scope.processInstanceId
            }, function(err, res) {
                if (!err) {
                    var incidents = res;
                    incidents.forEach(function(entry) {
                        var canvas = $scope.control.getViewer().get('canvas');
                        canvas.addMarker(entry.activityId, 'highlight-task-error');
                    });

                }
            });
        };

    } ];

    var Configuration = function PluginConfiguration(ViewsProvider) {

        ViewsProvider.registerDefaultView('tasklist.task.detail', {
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

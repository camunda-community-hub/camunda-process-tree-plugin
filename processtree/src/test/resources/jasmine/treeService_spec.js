// TODO the treeService.js ("class to test") file needs to be included here
define([ /*'/src/treeService.js'*/ ], function() {

    describe("the treeservice ", function() {

        describe("directive ", function() {

            // TODO for unit test cases the camAPI needs to be mocked here. 
//            beforeEach(module(function($provide) {
//                $provide.provider('camAPIProvider', function() {
//                    this.$get = function() {
//                        return {
//
//                            resource : function(resourceType) {
//                                console.log('camApi resource requested from type: ' + resourceType);
//                            }
//                        };
//                    };
//                });
//            }));

            var $compile, $rootScope;

            //beforeEach(module('treeService'));

//            beforeEach(inject(function(_$compile_, _$rootScope_, _camAPI_) {
//                $compile = _$compile_;
//                $rootScope = _$rootScope_;
//            }));

            it('can be compiled with empty parameter needs to be tested', function() {
                // Compile a piece of HTML containing the directive
                // var element = $compile('<div process-tree current-task="currentTask"></div>')($rootScope);
                // console.log(element);
                // expect(element.html()).toContain("plapla");
                expect(true).toBe(true);
            });
        });

        describe('factory ', function() {

            it('does some great stuff, which need to be tested', function() {
                expect(true).toBe(true);
            });
        });
    });
});
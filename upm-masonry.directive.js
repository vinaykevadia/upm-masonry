(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('upmMasonryController', upmMasonryController)
        .directive('upmMasonry', upmMasonry)
        .directive('upmMasonryItem', upmMasonryItem);

    /** @ngInject */
    function upmMasonryController($scope, $window, $mdMedia, $timeout)
    {
        var vm = this,
            defaultOpts = {
                itemSelector     : 'upm-masonry-item',
                reLayoutDebounce: 400,
            },
            reLayoutTimeout = true;

        vm.options = null;
        vm.container = [];
        vm.isInitialized = false;

        // Methods
        vm.reLayout = reLayout;
        vm.initialize = initialize;
        vm.waitImagesLoaded = waitImagesLoaded;
        vm.addItem = addItem;
        vm.removeItem = removeItem;

        function initialize(elem)
        {
            vm.options = !vm.options ? defaultOpts : angular.extend(defaultOpts, vm.options);

            console.log(elem.masonry);
            elem.masonry(vm.options);
            vm.isInitialized = true;
            watchContainerResize();
        }

        $scope.$on('upmMasonry:relayout', function ()
        {
            reLayout();
        });

        function waitImagesLoaded(element, callback)
        {
            if ( typeof imagesLoaded !== 'undefined' )
            {
                var imgLoad = $window.imagesLoaded(element);

                imgLoad.on('done', function ()
                {
                    callback();
                });
            }
            else
            {
                callback();
            }
        }

        function watchContainerResize()
        {
            $scope.$watch(
                function ()
                {
                    return vm.container.width();
                },
                function (newValue, oldValue)
                {
                    if ( newValue !== oldValue )
                    {
                        reLayout();
                    }
                }
            );
        }

        function reLayout()
        {
            // Debounce for relayout
            if ( reLayoutTimeout )
            {
                $timeout.cancel(reLayoutTimeout);
            }

            reLayoutTimeout = $timeout(function ()
            {
                start();
                $scope.$broadcast('upmMasonry:relayoutFinished');

            }, vm.options.reLayoutDebounce);

            // Start relayout
            function start()
            {
                if(!_.isEmpty(vm.container) && vm.isInitialized){
                    console.log('reloadItems', vm.container);
                    vm.container.masonry('layout');
                    $scope.$digest();
                }
            }
        }

        function addItem(element){
            vm.container.masonry('appended', element, true);
            vm.reLayout();
        }

        function removeItem(element){
            vm.container.masonry('remove', element, true);
            vm.reLayout();
        }

    }

    /** @ngInject */
    function upmMasonry($timeout)
    {
        return {
            restrict  : 'AEC',
            controller: 'upmMasonryController',
            scope: {
                options: '='
            },
            compile   : compile
        };
        function compile(element)
        {
            return {
                pre : function preLink(scope, iElement, iAttrs, controller)
                {
                    controller.options = scope.options || {};
                    controller.container = iElement;
                },
                post: function postLink(scope, iElement, iAttrs, controller)
                {
                    $timeout(function ()
                    {
                        controller.initialize(iElement);
                    });
                }
            };
        }
    }

    /** @ngInject */
    function upmMasonryItem($timeout)
    {
        return {
            restrict: 'AEC',
            require : '^upmMasonry',
            priority: 1,
            link    : link
        };

        function link(scope, element, attributes, controller)
        {
            var id = scope.$id;

            controller.waitImagesLoaded(element, function ()
            {
                controller.reLayout();

            });

            scope.$on('upmMasonryItem:finishReLayout', function ()
            {
                scope.$watch(function ()
                {
                    return element.height();
                }, function (newVal, oldVal)
                {
                    if ( newVal !== oldVal )
                    {
                        controller.reLayout();
                    }
                });
            });

            element.on('$destroy', function ()
            {
                controller.removeItem(element, id);
            });

            // Append element
            controller.addItem(element, id);
        }
    }
})();

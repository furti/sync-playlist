/// <reference path="../typings/angularjs/angular.d.ts"/>

module SyncPlaylist {
    interface DirectoryPickerScope extends angular.IScope {
        onDirectoryChange(event: DirectoryChangeEvent): void;
        directoryInput: angular.IAugmentedJQuery;
    }

    class DirectoryPickerController {
        static $inject = ['$scope', '$timeout'];
        private $scope: DirectoryPickerScope;
        private $timeout: angular.ITimeoutService;

        constructor($scope: DirectoryPickerScope, $timeout: angular.ITimeoutService) {
            this.$scope = $scope;
            this.$timeout = $timeout;
        }

        public selectDirectory(): void {
            this.$scope.directoryInput[0].click();
        }
    }

    angular.module('syncPlaylist.directives')
        .directive('directoryPicker', [function() {
            return {
                restrict: 'E',
                scope: {
                    onDirectoryChange: '&'
                },
                link: function($scope: DirectoryPickerScope, element: angular.IAugmentedJQuery) {
                    $scope.directoryInput = element.find('input');

                    $scope.directoryInput.on('change', function(event: any) {
                        $scope.$apply(function() {
                            var dir = $scope.directoryInput.val();

                            if (dir && dir.trim().length > 0) {
                                $scope.onDirectoryChange({ directory: dir });
                            }
                        });
                    });
                },
                controller: DirectoryPickerController,
                controllerAs: 'directoryPicker',
                templateUrl: 'templates/directory-picker.html'
            };
        }]);
}

/// <reference path="../typings/angularjs/angular.d.ts"/>

module SyncPlaylist {
    export interface DirectoryChangeEvent {
        directory: string;
    }

    interface FileExplorerScope extends angular.IScope {
        onDirectoryChange(event: DirectoryChangeEvent);
    }

    class FileExplorerController {
        public static $inject = ['$scope'];
        public directory: string;
        private $scope: FileExplorerScope;

        constructor($scope: FileExplorerScope) {
            var controller = this;

            $scope.$watch('directory', function(newDirectory: string) {
                controller.directory = newDirectory;
            });

            this.$scope = $scope;
        }

        directoryChanged(newDirectory: string) {
            this.directory = newDirectory;
            this.$scope.onDirectoryChange({ directory: newDirectory });
        }
    }

    angular.module('syncPlaylist.directives', [])
        .directive('fileExplorer', function() {
            return {
                restrict: 'E',
                scope: {
                    directory: '=',
                    onDirectoryChange: '&' //call wit onDirectoryChange({directory: newDir});
                },
                controller: FileExplorerController,
                controllerAs: 'fileExplorer',
                templateUrl: 'templates/file-explorer.html'
            };
        });
}

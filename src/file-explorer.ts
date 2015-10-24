/// <reference path="../typings/angularjs/angular.d.ts"/>

module SyncPlaylist {
    export interface DirectoryChangeEvent {
        directory: string
    }

    class FileExplorerController {
        public static $inject = ['$scope'];
        public directory: string;

        constructor($scope) {
            this.directory = $scope.directory;
        }

        directoryChanged(newDirectory: string) {
            this.directory = newDirectory;
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

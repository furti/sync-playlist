/// <reference path="../typings/angularjs/angular.d.ts"/>

module SyncPlaylist {

    class FileExplorerController {
        public static $inject = ['$scope'];
        public directory: string;

        constructor($scope) {
            this.directory = $scope.directory;
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

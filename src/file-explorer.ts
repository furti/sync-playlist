/// <reference path="../typings/angularjs/angular.d.ts"/>

module SyncPlaylist {

    class FileExplorerController {

    }

    angular.module('syncPlaylist.directives', [])
    .directive('fileExplorer', function() {
        return {
          restrict: 'E',
          controller: FileExplorerController,
          templateUrl: 'templates/file-explorer.html'
        };
    });
}

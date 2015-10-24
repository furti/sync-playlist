/// <reference path='../typings/angular-material/angular-material.d.ts'/>

module SyncPlaylist {

    class SyncPlaylistController {
        public static $inject = ['settings'];
        public settings: Settings;

        constructor(settings: Settings) {
            this.settings = settings;

            this.settings.load();
        }

        directoryChanged(type: string, newDirectory: string) {
            if (type === 'source') {
                this.settings.sourceDirectory = newDirectory;
            }
            else if (type === 'target') {
                this.settings.targetDirectory = newDirectory;
            }

            this.settings.persist();
        }
    }

    angular.module('syncPlaylist.main', ['ngMaterial', 'syncPlaylist.directives', 'syncPlaylist.services'])
        .config(['$mdThemingProvider', function($mdThemingProvider: ng.material.IThemingProvider) {
            $mdThemingProvider.theme('default')
                .primaryPalette('teal')
                .accentPalette('red');
        }])
        .controller('SyncPlaylistController', SyncPlaylistController);
}

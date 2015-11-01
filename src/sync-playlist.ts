/// <reference path='../typings/angular-material/angular-material.d.ts'/>

module SyncPlaylist {
    var playlistColors = ['blue', 'green', 'orange', 'yellow'];

    export class Playlist {
        public title: string;
        public background: string;
        public cols: number;
        public rows: number;
        public files: Array<SyncFile>;
    }

    class SyncPlaylistController {
        public static $inject = ['settings'];
        public settings: Settings;
        public playlists: Array<Playlist>

        constructor(settings: Settings) {
            this.settings = settings;

            this.settings.load();

            this.playlists = [
                { title: 'test', background: 'green', cols: 2, rows: 1, files: [] },
                { title: 'Austropop', background: 'pink', cols: 1, rows: 1, files: [] },
                { title: 'One more', background: 'blue', cols: 2, rows: 2, files: [] }
            ]
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

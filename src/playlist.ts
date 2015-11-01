module SyncPlaylist {
    var playlistColors = ['blue', 'green', 'pink', 'yellow', 'gray', 'red', 'purple'];
    var playlistDirectoryName = 'Playlists';
    var fs = require('fs');
    var path = require('path');

    export class Playlist {
        public path: string;
        public title: string;
        public background: string;
        public cols: number;
        public rows: number;
        public files: Array<string>;

        constructor(path: string, title: string) {
            this.path = path;
            this.title = title;
            this.files = [];

            this.randomBackground();
        }

        public randomBackground(): void {
            var hash = this.hash(this.title);
            console.log(hash + ' ' + hash % playlistColors.length);
            this.background = playlistColors[hash % playlistColors.length];
        }

        private hash(string: string): number {
            var hash = 0, i: number, char: number;
            if (string.length == 0) return hash;

            for (i = 0; i < string.length; i++) {
                char = string.charCodeAt(i);
                hash = hash + char;
            }

            return hash;
        }
    }


    export class PlaylistManager {
        public static $inject = ['$rootScope'];
        public playlists: Array<Playlist>;
        public loading: boolean;
        private $rootScope: angular.IRootScopeService;
        private playlistDirectory: string;

        constructor($rootScope: angular.IRootScopeService) {
            this.$rootScope = $rootScope;

            $rootScope.$on('settings.changed', (event: ng.IAngularEvent, args: Settings[]) => {
                this.loadPlaylists(args[0].sourceDirectory);
            });
        }

        private loadPlaylists(directory: string) {
            this.playlistDirectory = directory + '/' + playlistDirectoryName;
            this.loading = true;
            this.playlists = [];

            fs.access(this.playlistDirectory, fs.F_OK, (err: any) => {
                //If the direcotry exists we load all playlists from there.
                if (!err) {
                    fs.readdir(this.playlistDirectory, (err: any, files: Array<string>) => {
                        if (err) {
                            throw err
                        }

                        this.setupFiles(files, 0, () => this.$rootScope.$apply(() => { this.loading = false; }));
                    });
                }
            });
        }

        public setupFiles(files: string[], index: number, done: () => any): any {
            if (index === files.length) {
                done();
            }
            else {
                var file = this.playlistDirectory + '/' + files[index];

                fs.stat(file, (err: any, stats: any) => {
                    if (err) {
                        throw err;
                    }

                    //Only read the metadata for files
                    if (stats.isFile()) {
                        this.playlists.push(new Playlist(file, this.buildNameFromFile(file)));
                        this.setupFiles(files, index + 1, done);
                    }
                    else {
                        this.setupFiles(files, index + 1, done);
                    }
                });
            }
        }

        private buildNameFromFile(fileName: string): string {
            return path.parse(fileName).name;
        }
    }

    class PlaylistController {
        static $inject = ['playlistManager'];
        public playlistManager: PlaylistManager;

        constructor(playlistManager: PlaylistManager) {
            this.playlistManager = playlistManager;
        }
    }

    angular.module('syncPlaylist.services')
        .service('playlistManager', PlaylistManager)

    angular.module('syncPlaylist.directives')
        .directive('playlistView', [function() {
            return {
                restrict: 'E',
                controller: PlaylistController,
                controllerAs: 'lists',
                templateUrl: 'templates/playlist-view.html'
            };
        }]);
}

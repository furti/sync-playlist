module SyncPlaylist {
    var playlistColors = ['blue', 'green', 'pink', 'yellow', 'gray', 'red', 'purple'];
    var playlistDirectoryName = 'Playlists';
    var fs = require('fs');
    var path = require('path');

    export class SyncPlaylist {
        public path: string;
        public title: string;
        public background: string;
        public cols: number;
        public rows: number;
        public files: Array<PlaylistFile>;

        constructor(path: string, title: string, files: Array<PlaylistFile>) {
            this.path = path;
            this.title = title;
            this.files = files || [];

            this.randomBackground();
            this.calculateSize();
        }

        private randomBackground(): void {
            var hash = this.hash(this.title);

            this.background = playlistColors[hash % playlistColors.length];
        }

        public calculateSize(): void {
            if (this.files.length >= 20) {
                this.cols = 2;
                this.rows = 2;
            }
            else if (this.files.length >= 10) {
                this.cols = 2;
                this.rows = 1;
            }
            else {
                this.rows = 1;
                this.cols = 1;
            }
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
        public static $inject = ['$rootScope', 'playlistParser', 'syncPlaylistUtils'];
        public playlists: Array<SyncPlaylist>;
        public loading: boolean;
        private $rootScope: angular.IRootScopeService;
        private playlistDirectory: string;
        private playlistParser: PlaylistParser;
        private utils: Utils;

        constructor($rootScope: angular.IRootScopeService, playlistParser: PlaylistParser, utils: Utils) {
            this.$rootScope = $rootScope;
            this.playlistParser = playlistParser;
            this.utils = utils;

            $rootScope.$on('settings.changed', (event: ng.IAngularEvent, args: Settings[]) => {
                this.loadPlaylists(args[0].sourceDirectory);
            });
        }

        public removeFromList(playlist: SyncPlaylist, file: PlaylistFile): void {
            if (!playlist.files) {
                return;
            }

            this.utils.removeFromArray(playlist.files, file, (file: PlaylistFile, other: PlaylistFile) => {
                return file.path === other.path;
            });

            this.savePlaylist(playlist);
        }

        public savePlaylist(playlist: SyncPlaylist): void {
            this.playlistParser.save(playlist.path, {
                files: playlist.files
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

        private setupFiles(files: string[], index: number, done: () => any): any {
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
                        this.playlistParser.parse(file, (err: any, playlist: Playlist) => {
                            this.playlists.push(new SyncPlaylist(file, this.buildNameFromFile(file), playlist.files));
                            this.setupFiles(files, index + 1, done);
                        });
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

    export interface PlaylistViewScope extends ng.IScope {
        expanded: boolean;
        playlistManager: PlaylistManager;
        closeTile: ($event: ng.IAngularEvent) => void;
    }

    class PlaylistController {
        static $inject = ['$scope', 'playlistManager'];

        constructor($scope: PlaylistViewScope, playlistManager: PlaylistManager) {
            $scope.playlistManager = playlistManager;
        }
    }

    angular.module('syncPlaylist.services')
        .service('playlistManager', PlaylistManager)

    angular.module('syncPlaylist.directives')
        .directive('playlistView', [function() {
            return {
                restrict: 'E',
                controller: PlaylistController,
                templateUrl: 'templates/playlist-view.html'
            };
        }]);
}

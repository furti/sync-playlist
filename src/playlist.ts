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

        public containsFile(fileName: string): boolean {
            for (var file of this.files) {
                if (file.path === fileName) {
                    return true;
                }
            }

            return false;
        }

        public removeFile(fileName: string): void {
            var found = false;

            for (var index in this.files) {
                var file = this.files[index];

                if (file.path === fileName) {
                    found = true;
                    break;
                }
            }

            if (found) {
                this.files.splice(index, 1);
            }
        }

        private randomBackground(): void {
            var hash = this.hash(this.title);

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
    /**
     * When editing the playlists of a file we need to know the playlists the file is already in.
     * This is done with the active flag.
     *
     * After the User saves the playlists we can remove the file from all not active playlists and add it to
     * all new ones.
     */
    export interface EditingPlaylist {
        title: string;
        active: boolean;
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

        public findPlaylistsForEdit(fileName: string): Array<EditingPlaylist> {
            var editingPlaylists: Array<EditingPlaylist> = [], playlist: SyncPlaylist;

            for (playlist of this.playlists) {
                editingPlaylists.push({
                    title: playlist.title,
                    active: playlist.containsFile(fileName)
                });
            }

            return editingPlaylists;
        }

        public savePlaylistsForEdit(file: SyncFile, playlists: Array<EditingPlaylist>): void {
            for (var editingPlaylist of playlists) {
                var playlist = this.findPlaylist(editingPlaylist.title);

                if (!playlist) {
                    continue;
                }

                /*
                 * If not in the playlist but should or in the playlist but should not be
                 * --> We have to change the list and save it
                 */
                if (editingPlaylist.active && !playlist.containsFile(file.name)) {
                    playlist.files.push({
                        path: file.name,
                        length: -1,
                        title: `${file.title} - ${file.artist}`
                    });

                    this.savePlaylist(playlist);
                }
                else if (!editingPlaylist.active && playlist.containsFile(file.name)) {
                    playlist.removeFile(file.name);
                    this.savePlaylist(playlist);
                }
            }
        }

        private findPlaylist(title: string): SyncPlaylist {
            if (this.playlists) {
                for (var playlist of this.playlists) {
                    if (playlist.title === title) {
                        return playlist;
                    }
                }
            }

            return null;
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
                files: this.appendRelativePath(playlist.files)
            });
        }

        private appendRelativePath(files: PlaylistFile[]): Array<PlaylistFile> {
            var filesCopy: PlaylistFile[] = [];

            if (files) {
                for (var file of files) {
                    filesCopy.push({
                        path: '../' + file.path,
                        title: file.title,
                        length: file.length
                    });
                }
            }

            return filesCopy;
        }

        private removeRelativePath(files: PlaylistFile[]): Array<PlaylistFile> {
            if (files) {
                for (var file of files) {
                    file.path = file.path.substring(3);
                }
            }

            return files;
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
                            this.playlists.push(new SyncPlaylist(file, this.buildNameFromFile(file), this.removeRelativePath(playlist.files)));
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

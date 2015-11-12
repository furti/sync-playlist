/// <reference path="../typings/angularjs/angular.d.ts"/>
/// <reference path="../typings/node/node.d.ts"/>

module SyncPlaylist {
    var fs = require('fs');
    var ffmpeg = require('fluent-ffmpeg');
    var knownFiles = ['sync-playlist.settings'];

    export interface DirectoryChangeEvent {
        directory: string;
    }

    export class SyncFile {
        name: string;
        title: string;
        artist: string;
        editing: boolean;
        editingPlaylists: boolean;

        //tmp Properties are used for editing. So the actual properties do not change on cancel
        private tmpTitle: string;
        private tmpArtist: string;
        private playlistManager: PlaylistManager;
        private tmpPlaylists: Array<EditingPlaylist>;

        constructor(name: string, title: string, artist: string, playlistManager: PlaylistManager) {
            this.name = name;
            this.artist = artist;
            this.title = title;
            this.playlistManager = playlistManager;
        }

        public editTags(): void {
            this.editing = true;
            this.tmpArtist = this.artist;
            this.tmpTitle = this.title;
        }

        public cancelEdit(): void {
            this.editing = false;
            this.tmpArtist = null;
            this.tmpTitle = null;
        }

        public saveTags(): void {
            this.title = this.tmpTitle;
            this.artist = this.tmpArtist;
            this.cancelEdit();
        }

        public editPlaylists(): void {
            this.editingPlaylists = true;
            this.tmpPlaylists = this.playlistManager.findPlaylistsForEdit(this.name);
        }

        public cancelEditPlaylists(): void {
            this.editingPlaylists = false;
            this.tmpPlaylists = null;
        }

        public saveEditPlaylists(): void {
            this.playlistManager.savePlaylistsForEdit(this, this.tmpPlaylists);
            this.cancelEditPlaylists();
        }
    }

    interface FileExplorerScope extends angular.IScope {
        onDirectoryChange(event: DirectoryChangeEvent): void;
        controlsHidden: boolean;
    }

    class FileExplorerController {
        public static $inject = ['$scope', 'playlistManager', '$mdDialog'];

        public directory: string;
        public files: Array<SyncFile>;
        public loading: boolean;

        private $scope: FileExplorerScope;
        private playlistManager: PlaylistManager;
        private $mdDialog: ng.material.IDialogService;

        constructor($scope: FileExplorerScope, playlistManager: PlaylistManager, $mdDialog: ng.material.IDialogService) {
            var controller = this;

            $scope.$watch('directory', (newDirectory: string) => {
                controller.directory = newDirectory;
                this.loadFiles();
            });

            this.$scope = $scope;
            this.playlistManager = playlistManager;
            this.$mdDialog = $mdDialog;
        }

        public directoryChanged(newDirectory: string) {
            this.directory = newDirectory;
            this.$scope.onDirectoryChange({ directory: newDirectory });
        }

        public persistTags(file: SyncFile): void {
            var path = this.directory + '/' + file.name;
            console.log(path);

            var command = ffmpeg(path)
                .outputOptions('-metadata', 'title=' + file.title)
                .outputOptions('-metadata', 'artist=' + file.artist)
                .outputOptions('-id3v2_version 3')
                .save(path);
        }

        public deleteFile(file: SyncFile): void {
            var dialog = this.$mdDialog.confirm()
                .title('Delete File')
                .ok('Delete')
                .cancel('Cancel')
                .content(`<p>Do you really want to delete <b>${file.name}</b>?
                  </p><p><b>Can not be undone!</b></p>`);

            this.$mdDialog.show(dialog).then(() => {
                var path = this.directory + '/' + file.name;

                this.playlistManager.removeFileFromPlaylists(file);

                fs.unlink(path, (err: any) => {
                    if (err) {
                        throw err;
                    }

                    this.files.splice(this.files.indexOf(file), 1);
                });
            });
        }

        private loadFiles(): void {
            if (!this.directory) {
                return;
            }

            this.loading = true;
            this.files = [];

            fs.readdir(this.directory, (err: any, files: Array<string>) => {
                if (err) {
                    throw err
                }

                this.setupFiles(files, 0, () => this.$scope.$apply(() => this.loading = false));
            });
        }

        private setupFiles(files: Array<string>, index: number, done: () => void): void {
            if (index === files.length) {
                done();
            }
            else {
                //Ignore all files known as non audio files.
                if (this.isKnownFile(files[index])) {
                    this.setupFiles(files, index + 1, done);
                } else {
                    var file = this.directory + '/' + files[index];

                    fs.stat(file, (err: any, stats: any) => {
                        if (err) {
                            throw err;
                        }

                        //Only read the metadata for files
                        if (stats.isFile()) {
                            ffmpeg.ffprobe(file, (err: any, metadata: any) => {
                                if (!err) {
                                    var tags = metadata.format.tags;
                                    this.files.push(new SyncFile(files[index], tags.title, tags.artist, this.playlistManager));
                                }
                                else {
                                    console.log(err);
                                }

                                this.setupFiles(files, index + 1, done);
                            });
                        }
                        else {
                            this.setupFiles(files, index + 1, done);
                        }
                    });
                }
            }
        }

        public isKnownFile(file: string): boolean {
            return knownFiles.indexOf(file) >= 0;
        }
    }

    angular.module('syncPlaylist.directives', [])
        .directive('fileExplorer', function() {
            return {
                restrict: 'E',
                scope: {
                    directory: '=',
                    onDirectoryChange: '&',
                    controlsHidden: '='
                },
                controller: FileExplorerController,
                controllerAs: 'fileExplorer',
                templateUrl: 'templates/file-explorer.html'
            };
        });
}

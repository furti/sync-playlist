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

        constructor(name: string, title: string, artist: string) {
            this.name = name;
            this.artist = artist;
            this.title = title;
        }

        public editTags(): void {
            this.editing = true;
        }
    }

    interface FileExplorerScope extends angular.IScope {
        onDirectoryChange(event: DirectoryChangeEvent): void;
        controlsHidden: boolean;
    }

    class FileExplorerController {
        public static $inject = ['$scope'];
        public directory: string;
        public files: Array<SyncFile>;
        public loading: boolean;
        private $scope: FileExplorerScope;

        constructor($scope: FileExplorerScope) {
            var controller = this;

            $scope.$watch('directory', (newDirectory: string) => {
                controller.directory = newDirectory;
                this.loadFiles();
            });

            this.$scope = $scope;
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
                                    this.files.push(new SyncFile(files[index], tags.title, tags.artist));
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

module SyncPlaylist {
    var fs = require('fs');

    export class PlaylistFile {
        path: string;
        title: string;
        length: number;
    }

    export class Playlist {
        files: Array<PlaylistFile>;
    }

    class ParsedLine {
        type: string;
        index: number;
        value: string;
    }

    export class PlaylistParser {

        public parse(file: string, callback: (err: any, playlist: Playlist) => void): void {
            fs.readFile(file, { encoding: 'utf8' }, (err: any, content: string) => {
                if (err) {
                    callback(err, undefined);
                }

                callback(undefined, this.parseContent(content));
            });
        }

        private parseContent(content: string): Playlist {
            var lines = content.split(/\r?\n/), line: string;
            var playlistFiles: { [key: number]: PlaylistFile } = {};

            for (line of lines) {
                var keyValue = this.parseLine(line);

                if (keyValue) {

                    if (!playlistFiles[keyValue.index]) {
                        playlistFiles[keyValue.index] = {
                            length: null,
                            title: null,
                            path: null
                        };
                    }

                    if (keyValue.type === 'File') {
                        playlistFiles[keyValue.index].path = keyValue.value;
                    }
                    else if (keyValue.type === 'Length') {
                        playlistFiles[keyValue.index].title = keyValue.value;
                    }
                    else if (keyValue.type == 'Title') {
                        playlistFiles[keyValue.index].length = parseInt(keyValue.value);
                    }
                }
            }

            var playlist: Playlist = {
                files: []
            };

            for (var index of Object.getOwnPropertyNames(playlistFiles)) {
                playlist.files.push(playlistFiles[index]);
            }

            console.log(playlist);

            return playlist;
        }

        private parseLine(line: string): ParsedLine {
            var keyValue = line.split('=');
            var key = keyValue[0];
            var type: string, index: number;

            if (key.indexOf('File') === 0) {
                key = 'File';
            }
            else if (key.indexOf('Title') === 0) {
                key = 'Title';
            } else if (key.indexOf('Length') === 0) {
                key = 'Length';
            }
            else {
                return null;
            }


            return {
                type: key,
                index: parseInt(keyValue[0].substring(key.length)),
                value: keyValue[1]
            }
        }
    }

    angular.module('syncPlaylist.services')
        .service('playlistParser', PlaylistParser);
}

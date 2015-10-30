/// <reference path='../typings/node/node.d.ts'/>
/// <reference path='../typings/angularjs/angular.d.ts'/>

module SyncPlaylist {
    var fs = require('fs');

    export class Settings {
        public sourceDirectory: string;
        public targetDirectory: string;

        public persist(): void {
            var source = JSON.stringify({
                sourceDirectory: this.sourceDirectory
            });
            var target = JSON.stringify({
                targetDirectory: this.targetDirectory
            });


            fs.writeFile(this.getSettingsLocation(), source, { encoding: 'utf-8' }, function(err: any) {
                if (err) throw err;
            });

            fs.writeFile(this.sourceDirectory + '/sync-playlist.settings', target, { encoding: 'utf-8' }, function(err: any) {
                if (err) throw err;
            });
        }

        public load(): void {
            var settings = this;
            //Try to load the last opened source directory.
            settings.parseFile(settings.getSettingsLocation(), function(content) {
                settings.sourceDirectory = content.sourceDirectory;

                //If we have a last opened directory we load the target directory from there.
                settings.parseFile(content.sourceDirectory + '/sync-playlist.settings', function(projectSettings) {
                    settings.targetDirectory = projectSettings.targetDirectory;
                });
            });
        }


        private getSettingsLocation(): string {
            return process.cwd() + '/last-opened-source.json';
        }

        private parseFile(file: string, callback: (content: any) => void): void {
            fs.readFile(file, { encoding: 'utf-8' }, function(err: any, data: string) {
                if (err) {
                    //If the file was not found we simply do nothing
                    if (err.code === 'ENOENT') {
                        return;
                    }
                    else {
                        throw err;
                    }
                }

                callback(JSON.parse(data));
            });
        }
    }

    angular.module('syncPlaylist.services', [])
        .service('settings', Settings);
}

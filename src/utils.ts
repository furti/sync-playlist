module SyncPlaylist {

    export class Utils {

        public removeFromArray(array: Array<any>, toRemove: any, equals: (obj: any, other: any) => boolean) {
            var found = false;

            for (var index in array) {
                var arrayElement = array[index];

                if (equals(toRemove, arrayElement)) {
                    found = true;
                    break;
                }
            }

            if (found) {
                array.splice(index, 1);
            }
        }
    }

    angular.module('syncPlaylist.services')
        .service('syncPlaylistUtils', Utils);
}

module SyncPlaylist {

    angular.module('syncPlaylist.directives')
        .directive('expandGridTile', ['$timeout', function($timeout: ng.ITimeoutService) {
            return {
                restrict: 'A',
                link: function(scope: PlaylistViewScope, element: ng.IAugmentedJQuery) {
                    var originalStyle: any;

                    scope.closeTile = function($event: ng.IAngularEvent) {
                        scope.expanded = false;

                        element.css('top', originalStyle.top);
                        element.css('left', originalStyle.left);
                        element.css('height', originalStyle.height);
                        element.css('width', originalStyle.width);
                        element.removeClass('md-whiteframe-12dp');
                        element.removeClass('in');
                        element.addClass('out');

                        $timeout(() => {
                            element.removeClass('expanded');
                            element.removeClass('out');
                        }, 1000);

                        $event.stopPropagation();
                    };

                    element.on('click', function() {
                        if (scope.expanded) {
                            return;
                        }

                        $timeout(function() {
                            scope.expanded = true;
                        }, 500, true);

                        var raw = element[0], parent = element.parent();
                        originalStyle = {
                            top: raw.style.top,
                            left: raw.style.left,
                            height: raw.style.height,
                            width: raw.style.width
                        };

                        var grandParentRect = parent.parent()[0].getBoundingClientRect();

                        //Wait a little to add the in class. So that the transition can start.
                        $timeout(() => {
                            element.addClass('md-whiteframe-12dp');
                            element.addClass('expanded');
                            element.addClass('in');

                            element.css('top', 0);
                            element.css('left', 0);
                            element.css('height', grandParentRect.height - 20 + 'px');
                            element.css('width', grandParentRect.width - 20 + 'px');
                        }, 0, false);
                    });
                }
            };
        }]);
}

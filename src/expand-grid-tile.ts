/// <reference path="../typings/angularjs/angular-animate.d.ts"/>

module SyncPlaylist {

    angular.module('syncPlaylist.directives')
        .directive('expandGridTile', ['$timeout', '$animate', function($timeout: ng.ITimeoutService, $animate: any) {
            return {
                restrict: 'A',
                link: function(scope: PlaylistViewScope, element: ng.IAugmentedJQuery) {
                    var originalStyle: any, open: boolean;

                    scope.closeTile = function($event: ng.IAngularEvent) {

                        $animate.on('removeClass', element, (animatedElement: ng.IAugmentedJQuery, phase: string) => {
                            if (phase === 'start') {
                                scope.expanded = false;
                                element.removeClass('expanded');
                                element.removeClass('md-whiteframe-12dp');
                                element.css('top', originalStyle.top);
                                element.css('left', originalStyle.left);
                                element.css('height', originalStyle.height);
                                element.css('width', originalStyle.width);
                            }
                        });

                        $animate.removeClass(element, 'expand').then(() => {
                            open = false;
                            $animate.off('removeClass', element);
                        });

                        $event.stopPropagation();
                    };

                    element.on('click', function() {
                        if (open) {
                            return;
                        }

                        open = true;

                        var raw = element[0], parent = element.parent();
                        originalStyle = {
                            top: raw.style.top,
                            left: raw.style.left,
                            height: raw.style.height,
                            width: raw.style.width
                        };
                        var grandParentRect = parent.parent()[0].getBoundingClientRect();

                        $animate.on('addClass', element, (animatedElement: ng.IAugmentedJQuery, phase: string) => {
                            if (phase === 'start') {
                                element.addClass('md-whiteframe-12dp');
                                element.css('top', 0);
                                element.css('left', 0);
                                element.css('height', grandParentRect.height - 20 + 'px');
                                element.css('width', grandParentRect.width - 15 + 'px');
                            }
                        });

                        $animate.addClass(element, 'expand').then(() => {
                            scope.expanded = true;
                            element.addClass('expanded');
                            $animate.off('addClass', element);
                        });

                        scope.$apply();
                    });
                }
            };
        }]);
}

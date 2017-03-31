(function () {
    'use strict';

    angular.module('swcp')
        .directive('printFirebaseMessage', printFirebaseMessage);

    printFirebaseMessage.$inject = [];

    function printFirebaseMessage() {
        return {
            restrict: 'A',
            template: '' +
                '<span ng-show="message.private">[private] </span>' +
                '<strong>{{message.from}}' +
                    '<span ng-show="message.to"> -> {{message.to}}</span>:' +
                '</strong> {{message.message}}<br/>'
        };
    }

})();
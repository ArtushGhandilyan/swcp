(function () {
    'use strict';

    angular.module('swcp')
        .directive('printMessage', printMessage);

    printMessage.$inject = [];

    function printMessage() {
        return {
            restrict: 'A',
            template: '' +
                '<span ng-show="message.priv">[private] </span>' +
                '<strong>{{message.username}}' +
                    '<span ng-show="message.to"> -> {{message.to}}</span>:' +
                '</strong> {{message.message}}<br/>'
        };
    }

})();
(function () {
    'use strict';

    angular
        .module('swcp')
        .factory('firebaseService', firebaseService);

    function firebaseService() {
        var root = firebase.database().ref();

        return {
            root: root,
            participants: root.child('participants'),
            messages: root.child('messages')
        };
    }
})();

(function () {
    'use strict';

    angular.module('swcp')
        .service('authService', authService);

    authService.$inject = ['$http'];

    function authService($http) {
        return {
            getUser: getUser,
            auth: auth
        };

        function getUser() {
            return $http.get('/swcp/auth/info');
        }

        function auth(token) {
            return firebase.auth().signInWithCustomToken(token).catch(function(error) {
                console.log(error.code + ' ' + error.message);
            });
        }
    }
})();
(function () {
    'use strict';

    angular.module('swcp')
        .factory('chatService', ChatService);

    ChatService.$inject = ['$rootScope'];

    function ChatService($rootScope) {
        var stompClient;

        var reconnect = {
            reconnecting: false,            // Flag to indicate are we reconnecting or not.
            doNotReconnect: false,          // Do (not) try to reconnect.
            reloadAfterN: true,             // Flag to indicate try reload page after max retries or not.
            maxRetries: 30,                 // Try to reconnect this many times before reloading.
            resetMult: 6,                   // After n attemps, restore the timeout to default.
            retryTimeoutMs: 1500 + Math.floor(Math.random() * 60), // Default timeout in ms.
            retryMultiplier: 2,             // After a failed attempt, multiply the current timeout by this much.
            retryCurrMultiplier: 0,
            retryCurrTimeout: 0,
            retryCount: 0                   // Attempts so far.
        };


        return {
            init: init,
            connect: connect,
            subscribe: subscribe ,
            send: send
        };

        function init() {
            stompClient = Stomp.over(new SockJS('/swcp/ws'));
        }

        function connect(successCallback, errorCallback) {
            stompClient.connect({}, function (frame) {
                reconnectReset();
                $rootScope.$apply(function () {
                    successCallback(frame);
                });
            }, function (error) {
                if(reconnect.doNotReconnect) {
                    $rootScope.$apply(function () {
                        errorCallback(error);
                    });
                } else {
                    reconnectTry(function() {
                        init();
                        connect(successCallback, errorCallback);
                    });
                }
            });
        }

        function subscribe(destination, callback) {
            stompClient.subscribe(destination, function (message) {
                $rootScope.$apply(function () {
                    callback(message);
                });
            });
        }

        function send(destination, headers, object) {
            stompClient.send(destination, headers, object);
        }


        function reconnectReset() {
            reconnect.reconnecting = false;
            reconnect.retryCurrTimeout = 0;
            reconnect.retryCurrMultiplier = 0;
            reconnect.retryCount = 0;
        }

        function reconnectTry(connfunc) {
            if (reconnect.retryCount == reconnect.maxRetries) {
                // Failed to reconnect n times.
                reconnect.reconnecting = false;
                if (reconnect.reloadAfterN) {
                    window.location.reload(true);
                }
                return
            }


            if (!reconnect.reconnecting) {
                // First attempt to reconnect.
                reconnect.reconnecting = true;
                reconnect.retryCurrTimeout = reconnect.retryTimeoutMs;
                reconnect.retryCurrMultiplier = 1;
                reconnect.retryCount = 1;
                connfunc();
            } else {
                reconnect.retryCount += 1;
                var callback = function () {
                    reconnect.retryCurrTimeout *= reconnect.retryMultiplier;
                    reconnect.retryCurrMultiplier += 1;
                    if (reconnect.retryCurrMultiplier == reconnect.resetMult) {
                        reconnect.retryCurrTimeout = reconnect.retryTimeoutMs;
                        reconnect.retryCurrMultiplier = 1;
                    }
                    connfunc();
                };
                setTimeout(callback, reconnect.retryCurrTimeout)
            }
        }


    }

})();
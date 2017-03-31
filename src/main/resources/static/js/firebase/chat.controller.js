(function() {
    'use strict';

    angular.module('swcp')
        .controller('FBChatController', FBChatController);

    FBChatController.$inject = ['$scope', '$location', '$interval', '$firebaseArray', '$firebaseObject', 'toaster', 'firebaseService', 'authService', 'chatService'];
    
    function FBChatController($scope, $location, $interval, $firebaseArray, $firebaseObject, toaster, firebaseService, authService, chatService) {
        var self = this;
        var typing = undefined;

        self.sendTo       = 'everyone';
        self.newMessage   = '';

        self.sendMessage = sendMessage;
        self.startTyping = startTyping;
        self.stopTyping = stopTyping;
        self.privateSending = privateSending;

        self.test = test;

        initStompClient();

        function initStompClient() {
            chatService.init();

            chatService.connect(function(frame) {

                self.username = frame.headers['user-name'];

                chatService.subscribe("/user/queue/firebase.credentials", function(message) {
                    var body = JSON.parse(message.body);
                    var token = body.customToken;
                    var sessionId = body.sessionId;

                    authService.auth(token).then(function(authData) {
                        self.authData = authData;
                        self.participants = $firebaseArray(firebaseService.participants);
                        self.messages = $firebaseArray(firebaseService.messages);
                        self.user = $firebaseObject(firebaseService.participants.child(sessionId));
                    });
                });
                chatService.subscribe("/app/firebase.credentials", function(){});

            }, function(error) {
                toaster.pop('error', 'Error', 'Connection error ' + error);
            });
        }
        //".read": "((data.child('private').val() === true) && ((data.child('to').val() == auth.uid) || (data.child('from').val() == auth.uid))) || (data.child('to').val() == 'everyone')",
        function sendMessage() {
            firebaseService.messages.push({
                message: self.newMessage,
                private: (self.sendTo != "everyone"),
                from: self.username,
                to: self.sendTo,
                timestamp: new Date().getTime()
            });

            self.newMessage = '';
        }

        function startTyping() {
            // Don't send notification if we are still typing or we are typing a private message
            if (angular.isDefined(typing) || self.sendTo != "everyone") return;

            typing = $interval(function() {
                self.stopTyping();
            }, 500);

            self.user.typing = true;
            self.user.$save();
        }

        function stopTyping() {
            if (angular.isDefined(typing)) {
                $interval.cancel(typing);
                typing = undefined;

                self.user.typing = false;
                self.user.$save();
            }
        }

        function privateSending(username) {
            self.sendTo = (username != self.sendTo) ? username : 'everyone';
        }

        function test() {
            for(var i = 0; i < 200; i++) {
                firebaseService.messages.push({
                    private: false,
                    message: i+1+'',
                    to: 'everyone',
                    from: 'test',
                    timestamp: new Date().getTime()
                });
            }
        }
    }

    
})();

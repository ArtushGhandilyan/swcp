(function() {
    'use strict';

    angular.module('swcp')
        .controller('ChatController', ChatController);

    ChatController.$inject = ['$scope', '$location', '$interval', 'toaster', 'chatService'];
    
    function ChatController($scope, $location, $interval, toaster, chatService) {
        var self = this;
        var typing = undefined;

        self.username     = '';
        self.sendTo       = 'everyone';
        self.participants = [];
        self.messages     = [];
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

                chatService.subscribe("/app/chat.participants", function(message) {
                    self.participants = JSON.parse(message.body);
                });

                chatService.subscribe("/topic/chat.login", function(message) {
                    self.participants.unshift({username: JSON.parse(message.body).username, sessionId: JSON.parse(message.body).sessionId, typing : false});
                });

                chatService.subscribe("/topic/chat.logout", function(message) {
                    var sessionId = JSON.parse(message.body).sessionId;
                    for(var index in self.participants) {
                        if(self.participants[index].sessionId == sessionId) {
                            self.participants.splice(index, 1);
                        }
                    }
                });

                chatService.subscribe("/topic/chat.typing", function(message) {
                    var parsed = JSON.parse(message.body);
                    if(parsed.username == self.username) return;

                    for(var index in self.participants) {
                        var participant = self.participants[index];

                        if(participant.username == parsed.username) {
                            self.participants[index].typing = parsed.typing;
                        }
                    }
                });

                chatService.subscribe("/topic/chat.message", function(message) {
                    self.messages.unshift(JSON.parse(message.body));
                }, {'durable': true, 'auto-delete': false});

                chatService.subscribe("/user/queue/chat.message", function(message) {
                    var parsed = JSON.parse(message.body);
                    parsed.priv = true;
                    self.messages.unshift(parsed);
                });

                chatService.subscribe("/user/queue/errors", function(message) {
                    toaster.pop('error', "Error", message.body);
                });

            }, function(error) {
                toaster.pop('error', 'Error', 'Connection error ' + error);

            });
        }

        function sendMessage() {
            var destination = "/app/chat.message";

            if(self.sendTo != "everyone") {
                destination = "/app/chat.private." + self.sendTo;
                self.messages.unshift({message: self.newMessage, username: 'you', priv: true, to: self.sendTo});
            }

            chatService.send(destination, {}, JSON.stringify({message: self.newMessage}));
            self.newMessage = '';
        }

        function startTyping() {
            // Don't send notification if we are still typing or we are typing a private message
            if (angular.isDefined(typing) || self.sendTo != "everyone") return;

            typing = $interval(function() {
                self.stopTyping();
            }, 500);

            chatService.send("/topic/chat.typing", {}, JSON.stringify({username: self.username, typing: true}));
        }

        function stopTyping() {
            if (angular.isDefined(typing)) {
                $interval.cancel(typing);
                typing = undefined;

                chatService.send("/topic/chat.typing", {}, JSON.stringify({username: self.username, typing: false}));
            }
        }

        function privateSending(username) {
            self.sendTo = (username != self.sendTo) ? username : 'everyone';
        }

        function test() {
            if(self.sendTo != "everyone") {
                for(var i = 0; i < 200; i++) {
                    chatService.send("/app/chat.private." + self.sendTo, {persistent:true}, JSON.stringify({message: i+1}));
                    self.messages.unshift({message: i+1, username: 'you', priv: true, to: self.sendTo});
                }
            } else {
                for(var i = 0; i < 200; i++) {
                    chatService.send("/app/chat.message", {persistent:true}, JSON.stringify({message: i+1}));
                }
            }
        }
    }

    
})();

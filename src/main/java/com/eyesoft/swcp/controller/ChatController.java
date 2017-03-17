package com.eyesoft.swcp.controller;

import java.security.Principal;
import java.text.SimpleDateFormat;
import java.util.Collection;
import java.util.Date;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.messaging.simp.annotation.SubscribeMapping;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

import com.eyesoft.swcp.model.ChatMessage;
import com.eyesoft.swcp.model.SessionProfanity;
import com.eyesoft.swcp.event.LoginEvent;
import com.eyesoft.swcp.event.ParticipantRepository;
import com.eyesoft.swcp.exception.TooMuchProfanityException;
import com.eyesoft.swcp.util.ProfanityChecker;

/**
 * Controller that handles WebSocket chat messages
 */
@Controller
public class ChatController {

    private final ProfanityChecker profanityFilter;

    private final SessionProfanity profanity;

    private final ParticipantRepository participantRepository;

    private final SimpMessagingTemplate simpMessagingTemplate;

    @Autowired
    public ChatController(ProfanityChecker profanityFilter, SessionProfanity profanity, ParticipantRepository participantRepository, SimpMessagingTemplate simpMessagingTemplate) {
        this.profanityFilter = profanityFilter;
        this.profanity = profanity;
        this.participantRepository = participantRepository;
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @SubscribeMapping("/chat.participants")
    public Collection<LoginEvent> retrieveParticipants() {
        return participantRepository.getActiveSessions().values();
    }

    @MessageMapping("/chat.message")
    public ChatMessage filterMessage(@Payload ChatMessage message, Principal principal) {
        checkProfanityAndSanitize(message);
        message.setUsername(principal.getName());
        return message;
    }

    @MessageMapping("/chat.private.{username}")
    @SendTo("/user/{username}/queue/chat.message")
    public ChatMessage filterPrivateMessage(@Payload ChatMessage message, @DestinationVariable("username") String username, Principal principal) {
        checkProfanityAndSanitize(message);
        message.setUsername(principal.getName());
        return message;
    }

    private void checkProfanityAndSanitize(ChatMessage message) {
        long profanityLevel = profanityFilter.getMessageProfanity(message.getMessage());
        profanity.increment(profanityLevel);
        message.setMessage(profanityFilter.filter(message.getMessage()));
    }

    @MessageExceptionHandler
    @SendToUser(value = "/queue/errors", broadcast = false)
    public String handleProfanity(TooMuchProfanityException e) {
        return e.getMessage();
    }


    @Scheduled(fixedDelay = 30000L)
    private void publishServerTime() {
        ChatMessage serverTimeMessage = new ChatMessage();
        serverTimeMessage.setUsername("SERVER");
        serverTimeMessage.setMessage("time is " + new SimpleDateFormat("HH:mm:ss z").format(new Date()));

        if(participantRepository.getActiveSessions().size() > 0) {
            simpMessagingTemplate.convertAndSend("/topic/chat.message", serverTimeMessage);
        }
    }
}
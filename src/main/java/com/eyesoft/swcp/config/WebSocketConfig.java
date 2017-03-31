package com.eyesoft.swcp.config;

import com.eyesoft.swcp.actuate.endpoint.MessageMappingEndpoint;
import com.eyesoft.swcp.actuate.endpoint.WebSocketEndpoint;
import com.eyesoft.swcp.actuate.endpoint.WebSocketTraceEndpoint;
import com.eyesoft.swcp.actuate.interceptor.WebSocketTraceChannelInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.trace.InMemoryTraceRepository;
import org.springframework.boot.actuate.trace.TraceRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.session.ExpiringSession;
import org.springframework.session.web.socket.config.annotation.AbstractSessionWebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.WebSocketMessageBrokerStats;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

import javax.annotation.PostConstruct;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig extends AbstractSessionWebSocketMessageBrokerConfigurer<ExpiringSession> {

	@Value("${management.websocket.trace-inbound:true}")
	private boolean enableTraceInboundChannel;

	@Value("${management.websocket.trace-outbound:false}")
	private boolean enableTraceOutboundChannel;

	private InMemoryTraceRepository traceRepository = new InMemoryTraceRepository();

	@Value("${trace.repository.capacity:2}") int traceCapacity;

	@PostConstruct
	private void setTraceRepositoryCapacity() {
		traceRepository.setCapacity(traceCapacity);
	}

	@Override
	protected void configureStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/ws").withSockJS();
	}
	
	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableStompBrokerRelay("/queue/", "/topic/");
		registry.setApplicationDestinationPrefixes("/app");
	}

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		super.configureClientInboundChannel(registration);
		if(enableTraceInboundChannel) {
			registration.setInterceptors(webSocketTraceChannelInterceptor());
		}
	}

	@Override
	public void configureClientOutboundChannel(ChannelRegistration registration) {
		super.configureClientOutboundChannel(registration);
		if(enableTraceOutboundChannel) {
			registration.setInterceptors(webSocketTraceChannelInterceptor());
		}
	}

	@Bean
	public WebSocketTraceChannelInterceptor webSocketTraceChannelInterceptor() {
		return new WebSocketTraceChannelInterceptor(traceRepository);
	}

	@Bean
	@Description("Spring Actuator endpoint to expose WebSocket traces")
	public WebSocketTraceEndpoint websocketTraceEndpoint() {
		return new WebSocketTraceEndpoint(traceRepository);
	}

	@Bean
	@Description("Spring Actuator endpoint to expose WebSocket stats")
	public WebSocketEndpoint websocketEndpoint(WebSocketMessageBrokerStats stats) {
		return new WebSocketEndpoint(stats);
	}

	@Bean
	@Description("Spring Actuator endpoint to expose WebSocket message mappings")
	public MessageMappingEndpoint messageMappingEndpoint() {
		return new MessageMappingEndpoint();
	}

}
package com.eyesoft.swcp.event;

public class LogoutEvent {

	private String sessionId;
	private String username;

	public LogoutEvent(String username, String sessionId) {
		this.username = username;
		this.sessionId = sessionId;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public String getSessionId() {
		return sessionId;
	}

	public void setSessionId(String sessionId) {
		this.sessionId = sessionId;
	}
}

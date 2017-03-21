package com.eyesoft.swcp.event;

import java.util.Date;

public class LoginEvent {

    private String sessionId;
    private String username;
    private Date time;

    public LoginEvent(String username, String sessionId) {
        this.username = username;
        this.sessionId = sessionId;
        time = new Date();
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Date getTime() {
        return time;
    }

    public void setTime(Date time) {
        this.time = time;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}

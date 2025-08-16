import { describe, it, expect, beforeEach } from "bun:test";
import { AuthService } from "../../../core/services/SessionService.js";

describe("AuthService", () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe("createGuestSession", () => {
    it("should create a guest session with valid display name", () => {
      const session = authService.createGuestSession("TestUser");

      expect(session.sessionId).toBeDefined();
      expect(session.profile.displayName).toBe("TestUser");
      expect(session.profile.id).toBeDefined();
      expect(session.profile.createdAt).toBeDefined();
    });

    it("should throw error for empty display name", () => {
      expect(() => authService.createGuestSession("")).toThrow("Display name is required");
      expect(() => authService.createGuestSession("   ")).toThrow("Display name is required");
    });

    it("should trim display name", () => {
      const session = authService.createGuestSession("  TestUser  ");
      expect(session.profile.displayName).toBe("TestUser");
    });
  });

  describe("attachSocket", () => {
    it("should attach socket to existing session", () => {
      const session = authService.createGuestSession("TestUser");
      const socketId = "socket123";

      authService.attachSocket(session.sessionId, socketId);

      const retrievedSession = authService.getSessionBySocket(socketId);
      expect(retrievedSession?.sessionId).toBe(session.sessionId);
    });

    it("should throw error for non-existent session", () => {
      expect(() => authService.attachSocket("invalid-session", "socket123")).toThrow("Session not found");
    });
  });

  describe("session management", () => {
    it("should retrieve session by ID", () => {
      const session = authService.createGuestSession("TestUser");
      const retrieved = authService.getSession(session.sessionId);

      expect(retrieved?.sessionId).toBe(session.sessionId);
    });

    it("should return null for non-existent session", () => {
      const retrieved = authService.getSession("invalid-session");
      expect(retrieved).toBeNull();
    });

    it("should cleanup inactive sessions", () => {
      const session = authService.createGuestSession("TestUser");

      // Manually set old timestamp
      session.profile.lastActiveAt = Date.now() - 25 * 60 * 60 * 1000; // 25 hours ago

      authService.cleanupInactiveSessions(24 * 60 * 60 * 1000); // 24 hours

      const retrieved = authService.getSession(session.sessionId);
      expect(retrieved).toBeNull();
    });
  });
});

import jwt from "jsonwebtoken";

interface JWTData {
  sessionId: string;
  profileId: string;
}

interface JWTPayload extends JWTData {
  sub: string;
  iat?: number;
  exp?: number;
}

export class AuthService {
  private secret: string;
  private expiresIn: string;

  constructor(secret: string, expiresIn: string = "1h") {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  async generateToken({ profileId, sessionId }: JWTData): Promise<string> {
    return new Promise((resolve, reject) => {
      jwt.sign({ sessionId, profileId, sub: profileId }, this.secret, { expiresIn: this.expiresIn }, (err, token) => {
        if (err || !token) {
          return reject(new Error("Failed to generate token"));
        }
        resolve(token);
      });
    });
  }

  async verifyToken(token: string): Promise<JWTData | null> {
    return new Promise((resolve) => {
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err || !decoded) return resolve(null);

        const payload = decoded as JWTPayload;
        if (!payload.sessionId || !payload.profileId) return resolve(null);

        resolve({
          sessionId: payload.sessionId,
          profileId: payload.profileId,
        });
      });
    });
  }
}

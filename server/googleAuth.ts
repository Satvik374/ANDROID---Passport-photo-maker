import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { secretsManager } from "./secretsManager";

// Check for Google OAuth credentials
const googleClientId = secretsManager.getSecret('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = secretsManager.getSecret('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;

const hasGoogleAuth = googleClientId && googleClientSecret;

if (!hasGoogleAuth) {
  console.log('ℹ️ Google OAuth credentials not provided - Google authentication will be disabled');
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  // Get DATABASE_URL from environment or secrets manager
  let databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    databaseUrl = secretsManager.getSecret('DATABASE_URL');
  }

  if (databaseUrl) {
    try {
      const pgStore = connectPg(session);
      const sessionStore = new pgStore({
        conString: databaseUrl,
        createTableIfMissing: true,
        ttl: sessionTtl,
        tableName: "sessions",
      });
      return session({
        secret: secretsManager.getSecret('SESSION_SECRET') || process.env.SESSION_SECRET || 'fallback-secret-key',
        store: sessionStore,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: sessionTtl,
        },
      });
    } catch (error) {
      console.log('⚠️  PostgreSQL session store failed, falling back to memory store');
    }
  }

  // Fallback to memory store when database is not available
  return session({
    secret: secretsManager.getSecret('SESSION_SECRET') || process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupGoogleAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Only configure Google OAuth strategy if credentials are available
  if (hasGoogleAuth) {
    passport.use(new GoogleStrategy({
      clientID: googleClientId!,
      clientSecret: googleClientSecret!,
      callbackURL: "/auth/google/callback"
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      // Extract user data from Google profile
      const userData = {
        id: profile.id,
        email: profile.emails?.[0]?.value || null,
        firstName: profile.name?.givenName || null,
        lastName: profile.name?.familyName || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
      };

      // Upsert user in database
      const user = await storage.upsertUser(userData);
      
      return done(null, { 
        ...user,
        accessToken,
        refreshToken 
      });
    } catch (error) {
      console.error('Google auth error:', error);
      return done(error, null);
    }
  }));

  // Serialize/deserialize user for sessions
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      // Handle guest users
      if (id.startsWith('guest_')) {
        const guestUser = {
          id,
          email: null,
          firstName: "Guest",
          lastName: "User",
          profileImageUrl: null,
          isGuest: true
        };
        return done(null, guestUser);
      }

      // Handle regular authenticated users
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

    // Google OAuth routes (only if Google Auth is enabled)
    app.get("/api/login", 
      passport.authenticate("google", { 
        scope: ["profile", "email"] 
      })
    );

    app.get("/auth/google/callback",
      passport.authenticate("google", { 
        failureRedirect: "/?error=auth_failed" 
      }),
      (req, res) => {
        // Successful authentication, redirect to home
        res.redirect("/");
      }
    );
  } else {
    // Fallback routes when Google Auth is disabled
    app.get("/api/login", (req, res) => {
      res.status(503).json({ 
        message: "Google authentication is not configured",
        error: "GOOGLE_AUTH_DISABLED"
      });
    });
  }

  app.get("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
      }
      res.redirect("/");
    });
  });

  // Guest login endpoint
  app.post("/api/login/guest", (req, res) => {
    // Create a guest user session
    const guestUser = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: null,
      firstName: "Guest",
      lastName: "User",
      profileImageUrl: null,
      isGuest: true
    };

    req.login(guestUser, (err) => {
      if (err) {
        console.error('Guest login error:', err);
        return res.status(500).json({ message: "Guest login failed" });
      }
      res.json({ success: true, user: guestUser });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
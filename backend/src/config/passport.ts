import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import { generateTokens } from '../utils/jwt';

const prisma = new PrismaClient();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️  Google OAuth credentials not configured - OAuth disabled');
} else {
  console.log('✅ Google OAuth configured');
  console.log('   Callback URL:', `${BACKEND_URL}/api/auth/google/callback`);
  
  passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
    },
    async (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (error: any, user?: any) => void
    ) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email provided from Google'), false);
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (user) {
          // User exists, link Google account if not already linked
          if (!user.googleId) {
            await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id },
            });
          }
        } else {
          // Create new user with default role candidato
          const names = profile.displayName?.split(' ') || ['', ''];
          user = await prisma.user.create({
            data: {
              email,
              passwordHash: '', // No password for OAuth users
              name: profile.displayName || names[0] || 'Usuario',
              googleId: profile.id,
              emailVerified: true,
              role: 'CANDIDATO', // Default role
              avatarUrl: profile.photos?.[0]?.value || null,
              profileCompletion: 10,
            },
          });
        }

        const { accessToken, refreshToken } = generateTokens(user.id, user.role, user.email);
        return done(null, { user, tokens: { accessToken, refreshToken } });
      } catch (error) {
        return done(error, false);
      }
    }
  )
  );
}

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user);
});

passport.deserializeUser((user: any, done: (err: any, user?: any) => void) => {
  done(null, user);
});

export default passport;

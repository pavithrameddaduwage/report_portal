import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import ActiveDirectory from "activedirectory2";

const authOptions:any = {
  providers: [
    CredentialsProvider({
      name: "Active Directory",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "john.doe" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials:any) {
        if (!credentials?.username || !credentials?.password) {
          console.error("Missing credentials");
          throw new Error("Missing username or password");
        }

        const config = {
          url: "ldaps://HGUNBXDC01VM.Horizongroupusa.com",  // Change to your AD server URL
          baseDN: "dc=Horizongroupusa,dc=com",  // Change to your domain
          username: 'MISSVCACC', // Use domain\username format
          password: 'Horizon@MIS',
        };

        const ad = new ActiveDirectory(config);

        try {
          // ✅ 1️⃣ Authenticate user
          const auth = await new Promise((resolve, reject) => {
            ad.authenticate(config.username, config.password, (err, auth) => {
              if (err || !auth) {
                console.error("AD Authentication failed:", err);
                reject(new Error("Invalid Credentials"));
              } else {
                resolve(auth);
              }
            });
          });

          // ✅ 2️⃣ Fetch user details
          const user:any = await new Promise((resolve, reject) => {
            ad.findUser(credentials.username, (err, user) => {
              if (err || !user) {
                console.error("User lookup failed:", err);
                reject(new Error("User Not Found"));
              } else {
                resolve(user);
              }
            });
          });

          console.log("Authenticated User:", user);

          // ✅ 3️⃣ Return user object
          return {
            id: user.sAMAccountName,
            name: user.cn,
            email: user.mail || `${credentials.username}@company.com`, // Ensure email exists
          };
        } catch (error) {
          console.error("Authentication Error:", error);
          throw new Error("Authentication Failed");
        }
      },
    }),
  ],
  session: { strategy: "jwt" }, // Ensure session uses JWT
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }:any) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      console.log("JWT Token:", token);
      return token;
    },
    async session({ session, token }:any) {
      session.user.id = token.id;
      session.user.name = token.name;
      session.user.email = token.email;
      console.log("Session Data:", session);
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

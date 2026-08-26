import type { NextApiRequest, NextApiResponse } from "next";
import ldap from 'ldapjs';
import bcrypt from "bcryptjs";

const LDAP_URL = process.env.LDAP_URL || "ldap://your-ldap-server";
const LDAP_BASE_DN = process.env.LDAP_BASE_DN || "dc=example,dc=com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end(); // Allow only POST requests

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const client = ldap.createClient({ url: LDAP_URL });

  const userDN = `cn=${username},${LDAP_BASE_DN}`;

  client.bind(userDN, password, (err:any) => {
    if (err) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    client.unbind();
    return res.json({ message: "Authenticated successfully", user: { username } });
  });
}

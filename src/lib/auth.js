import { getServerSession } from "next-auth/next";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export async function getAuthenticatedUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  // MongoDB expects string IDs, but NextAuth might store them differently
  const user = {
    ...session.user,
    id: String(session.user.id || session.user._id)
  };

  return user;
}

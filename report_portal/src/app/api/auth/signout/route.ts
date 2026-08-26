import { NextResponse } from "next/server";
import { signOut } from "next-auth/react";

export async function GET(request: Request) {
  // await signOut({ redirect: false });
  // const response= NextResponse.redirect(new URL("/login", request.url));
  // response.cookies.set("next-auth.session-token", "", { maxAge: 0 });
  // return response;

  const response = NextResponse.redirect(new URL("/login", request.url));

  // Clear cookies
  response.cookies.set("next-auth.session-token", "", {
    path: "/",
    expires: new Date(0),
  });
  response.cookies.set("next-auth.csrf-token", "", {
    path: "/",
    expires: new Date(0),
  });

  return response;
}

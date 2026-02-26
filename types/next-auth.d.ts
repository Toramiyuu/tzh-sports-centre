import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      isMember: boolean;
      isTrainee: boolean;
      isTeacher: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

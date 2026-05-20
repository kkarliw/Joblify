declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/Config/firebase";

interface AuthContextValue {
  user: User | null;
  /** True until Firebase has restored (or rejected) the persisted session. */
  loading: boolean;
  /**
   * Whether the signed-in user carries the `admin: true` custom claim. The
   * console is admin-only; a valid Firebase account is not enough. Granted via
   * the API's `npm run grant-admin` script.
   */
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fires once on mount with the restored session, then on every sign-in /
    // sign-out. Unsubscribing on unmount avoids setState after teardown.
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          // force-refresh so a just-granted admin claim shows up without the
          // user having to sign out and back in.
          const token = await nextUser.getIdTokenResult(true);
          setIsAdmin(token.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAdmin,
      signIn: async (email, password) => {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Reject non-admins at the door rather than letting them into a
        // console where every API call would 403 anyway. Sign them straight
        // back out so no half-authenticated session lingers.
        const token = await cred.user.getIdTokenResult(true);
        if (token.claims.admin !== true) {
          await firebaseSignOut(auth);
          // Tagged code so the Login screen can show a precise message instead
          // of the generic sign-in failure.
          throw Object.assign(
            new Error("This account doesn't have admin access to the console."),
            { code: "admin/not-authorized" }
          );
        }
      },
      signOut: async () => {
        await firebaseSignOut(auth);
      },
    }),
    [user, loading, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  orgId: string | null;
  orgName: string | null;
  role: string | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithKakao: () => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [orgName, setOrgName] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Function to migrate user to organization if needed
  const ensureOrganization = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('migrate_user_to_organization', {
        p_user_id: userId
      });

      if (error) {
        console.error('Error migrating user to organization:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error calling migrate_user_to_organization:', err);
      return null;
    }
  };

  // Function to fetch organization context
  const fetchOrganizationContext = async (userId: string) => {
    try {
      // Ensure user has organization
      const migrated_org_id = await ensureOrganization(userId);

      // Fetch organization membership details
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          role,
          org_id,
          organizations (
            org_name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (memberError || !membership) {
        console.error('Error fetching organization membership:', memberError);
        return;
      }

      setOrgId(membership.org_id);
      setOrgName((membership.organizations as any)?.org_name || null);
      setRole(membership.role);
    } catch (err) {
      console.error('Error fetching organization context:', err);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch organization context when user signs in
        if (session?.user) {
          setTimeout(() => {
            fetchOrganizationContext(session.user.id);
          }, 0);
        } else {
          setOrgId(null);
          setOrgName(null);
          setRole(null);
        }
        
        // Redirect to dashboard after successful sign in
        if (event === "SIGNED_IN" && session) {
          navigate("/");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchOrganizationContext(session.user.id).then(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const signInWithKakao = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      orgId, 
      orgName, 
      role, 
      signIn, 
      signUp, 
      signOut, 
      resetPassword, 
      signInWithGoogle, 
      signInWithKakao, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

import React, { useState, useEffect, useRef } from 'react';
import './App.css';

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD3eqHGonqTi9nW4Int3SAUHhnUkRKaJYA",
    authDomain: "chatapp-8af35.firebaseapp.com",
    projectId: "chatapp-8af35",
    storageBucket: "chatapp-8af35.appspot.com",
    messagingSenderId: "873292895601",
    appId: "1:873292895601:web:855da72f0e20db1aae52d0",
    measurementId: "G-1W4H7YC7FB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {
  const [user, loading, error] = useAuthState(auth);
  const [authError, setAuthError] = useState(null);

  // Clear auth error when user state changes
  useEffect(() => {
    if (user) setAuthError(null);
  }, [user]);

  if (loading) {
    return <div className="App"><div className="loading">Loading...</div></div>;
  }

  if (error) {
    return <div className="App"><div className="error">Error: {error.message}</div></div>;
  }

  return (
    <div className="App">
      <header>
        <h1>Chat App</h1>
        {user && <SignOutButton />}
      </header>
      <section>
        {authError && <div className="error">{authError}</div>}
        {user ? <ChatRoom /> : <SignIn setAuthError={setAuthError} />}
      </section>
    </div>
  );
}

function SignIn({ setAuthError }) {
    const [isSigningIn, setIsSigningIn] = useState(false);

    const signInWithGoogle = async () => {
        setIsSigningIn(true);
        setAuthError(null);
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error during sign-in: ", error);
            setAuthError(error.message);
        } finally {
            setIsSigningIn(false);
        }
    }

    return (
        <button 
            onClick={signInWithGoogle} 
            disabled={isSigningIn}
            className="sign-in-button"
        >
            {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
        </button>
    )
}

function SignOutButton() {
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        } finally {
            setIsSigningOut(false);
        }
    }

    return auth.currentUser && (
        <button 
            onClick={handleSignOut} 
            disabled={isSigningOut}
            className="sign-out-button"
        >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </button>
    );
}

function ChatRoom() {
    const dummy = useRef();
    const [error, setError] = useState(null);
    const messagesRef = collection(firestore, 'messages');
    const messagesQuery = query(messagesRef, orderBy('createdAt'), limit(25));
    const [messages, loading, messagesError] = useCollectionData(messagesQuery, { idField: 'id' });

    const [formValue, setFormValue] = useState('');
    const [isSending, setIsSending] = useState(false);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!formValue.trim()) return;

        setIsSending(true);
        try {
            const { uid, photoURL } = auth.currentUser;

            await addDoc(messagesRef, {
                text: formValue,
                createdAt: serverTimestamp(),
                uid,
                photoURL
            });

            setFormValue('');
            dummy.current.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error("Error sending message: ", error);
            setError("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    }

    if (loading) {
        return <div className="loading">Loading messages...</div>;
    }

    if (messagesError) {
        return <div className="error">Error loading messages: {messagesError.message}</div>;
    }

    return (
        <>
            <main>
                {error && <div className="error">{error}</div>}
                {messages && messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                ))}
                <span ref={dummy}></span>
            </main>

            <form onSubmit={sendMessage}>
                <input 
                    value={formValue} 
                    onChange={(e) => setFormValue(e.target.value)} 
                    placeholder="Say something...." 
                    disabled={isSending}
                />
                <button 
                    type="submit" 
                    disabled={!formValue.trim() || isSending}
                >
                    {isSending ? '...' : '🕊️'}
                </button>
            </form>
        </>
    );
}

function ChatMessage(props) {
    const { text, uid } = props.message;
    const messageClass = uid === auth.currentUser?.uid ? 'sent' : 'received';

    return (
        <div className={`message ${messageClass}`}>
            <p>{text}</p>
        </div>
    )
}

export default App;
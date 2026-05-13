import { useState } from 'react';
import JoinForm from './components/JoinForm';
import ChatRoom from './components/ChatRoom';

interface AppState {
  isJoined: boolean;
  roomId: string;
  passwordKey: string;
  userName: string;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    isJoined: false,
    roomId: '',
    passwordKey: '',
    userName: ''
  });

  const handleJoin = (roomId: string, passwordKey: string, userName: string) => {
    setState({
      isJoined: true,
      roomId,
      passwordKey,
      userName
    });
  };

  const handleExit = () => {
    setState({
      isJoined: false,
      roomId: '',
      passwordKey: '',
      userName: ''
    });
  };

  if (state.isJoined) {
    return (
      <ChatRoom 
        roomId={state.roomId} 
        passwordKey={state.passwordKey} 
        userName={state.userName} 
        onExit={handleExit}
      />
    );
  }

  return <JoinForm onJoin={handleJoin} />;
}

import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '/src/contexts/AuthContext';
import { supabase } from '/src/lib/supabase';

export default function Chat({ adminId }) {
  Chat.propTypes = {
    adminId: PropTypes.string.isRequired,
  };

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const chatChannel = useRef(null);

  const initializeChat = useCallback(async () => {
    if (!user?.id || !adminId) return;

    try {
      setLoading(true);
      console.log('Buscando chat en la base de datos...');

      let { data: existingChat, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', user.id)
        .eq('admin_id', adminId)
        .maybeSingle();

      if (chatError) throw chatError;

      if (!existingChat) {
        console.log('No existe chat, creando uno nuevo...');
        const { data: newChat, error: newChatError } = await supabase
          .from('chats')
          .insert([{ user_id: user.id, admin_id: adminId }])
          .select()
          .maybeSingle();

        if (newChatError) throw newChatError;
        existingChat = newChat;
      }

      setChatId(existingChat.id);
      fetchMessages(existingChat.id);
    } catch (error) {
      console.error('Error en initializeChat:', error);
    } finally {
      setLoading(false);
    }
  }, [user, adminId]);

  const fetchMessages = async (chatId) => {
    try {
      console.log('Cargando mensajes...');
      const { data: chatMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(chatMessages || []);
    } catch (error) {
      console.error('Error al cargar mensajes:', error);
    }
  };

  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  useEffect(() => {
    if (chatId) {
      console.log(`Suscribiendo al chat con ID: ${chatId}`);
      subscribeToMessages();
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const subscribeToMessages = () => {
    if (chatChannel.current) {
      supabase.removeChannel(chatChannel.current);
    }

    chatChannel.current = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          setMessages((current) => [...current, payload.new]);
        }
      )
      .subscribe();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{ chat_id: chatId, sender_id: user.id, content: newMessage.trim() }]);
      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error en sendMessage:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg shadow-md">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs px-4 py-2 rounded-lg ${message.sender_id === user.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-900'}`}>
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-lg p-2"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
export type User = {
  id: number;
  username: string | null;
  phone: string | null;
  display_name: string;
  avatar_color: string;
  bio?: string | null;
  is_online: boolean;
  last_seen_at: string | null;
};

export type Reaction = { emoji: string; user_id: number; user_name: string };

export type ReplyPreview = {
  id: number;
  sender_id: number;
  body: string;
  sender_name: string;
};

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string | null;
  sender_avatar_color?: string | null;
  body: string;
  reply_to_id: number | null;
  reply_to: ReplyPreview | null;
  client_id: string | null;
  created_at: string;
  sender_status: string | null;
  reactions: Reaction[];
};


export type ConversationSummary = {
  id: number;
  type: string;
  title: string | null;
  updated_at: string;
  unread_count: number;
  last_message: Message | null;
  members: User[];
};

export type ConversationMember = {
  user_id: number;
  role: string;
  user: User;
};

export type ConversationDetail = {
  id: number;
  type: string;
  title: string | null;
  members: ConversationMember[];
  updated_at: string;
};

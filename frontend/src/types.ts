export interface NavItem {
  label: string;
  icon: string;
  path: string;
}

export interface ConversationStats {
  total: number;
  active: number;
  avgResponse: string;
  resolutionRate: string;
}

export interface KnowledgeSource {
  id: string;
  name: string;
  description: string;
  type: 'pdf' | 'docx' | 'txt' | 'url';
  status: 'synced' | 'processing' | 'failed' | 'idle';
  docCount: number;
  lastUpdated: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending';
  avatar: string;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  createdDate: string;
  lastUsed: string;
}

export interface Invoice {
  id: string;
  status: 'PAID' | 'REFUNDED';
  date: string;
  amount: string;
}

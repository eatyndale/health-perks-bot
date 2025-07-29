interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
}

interface UserSignup {
  name: string;
  email: string;
  password: string;
}

interface UserLogin {
  email: string;
  password: string;
}

interface ChatMessage {
  content: string;
  session_id: number;
}

interface ChatResponse {
  response: string;
  session_id: number;
  crisis_detected: boolean;
  crisis_resources: Record<string, any>;
}

interface AssessmentSubmission {
  answers: number[];
}

interface AssessmentResult {
  total_score: number;
  severity_level: string;
  recommendation: string;
  needs_crisis_support: boolean;
}

interface EFTRequest {
  problem: string;
  feeling: string;
  body_location: string;
  intensity: number;
}

interface EFTResponse {
  setup_statements: string[];
  reminder_phrases: string[];
  tapping_points: Array<{
    point: string;
    phrases: string[];
  }>;
}

interface EFTFeedback {
  session_id: number;
  initial_intensity: number;
  final_intensity: number;
  rounds_completed: number;
}

interface EFTFeedbackResponse {
  improvement: number;
  next_steps: string;
  continue_tapping: boolean;
}

class EFTChatbotAPI {
  private baseURL = 'http://localhost:8001';
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('access_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('access_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options?.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Authentication
  async signup(userData: UserSignup): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    this.setToken(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    return response;
  }

  async login(credentials: UserLogin): Promise<TokenResponse> {
    const response = await this.request<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    this.setToken(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    return response;
  }

  async refreshToken(): Promise<TokenResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<TokenResponse>(`/api/auth/refresh?refresh_token=${refreshToken}`, {
      method: 'POST',
    });
    
    this.setToken(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    return response;
  }

  // Chat
  async sendMessage(message: ChatMessage): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Assessment
  async submitAssessment(assessment: AssessmentSubmission): Promise<AssessmentResult> {
    return this.request<AssessmentResult>('/api/assessment/submit', {
      method: 'POST',
      body: JSON.stringify(assessment),
    });
  }

  // EFT
  async generateEFTScript(request: EFTRequest): Promise<EFTResponse> {
    return this.request<EFTResponse>('/api/eft/generate', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async submitEFTFeedback(feedback: EFTFeedback): Promise<EFTFeedbackResponse> {
    return this.request<EFTFeedbackResponse>('/api/eft/feedback', {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // Progress
  async getProgress(userId: string): Promise<any> {
    return this.request<any>(`/api/progress/${userId}`);
  }

  // Crisis
  async getCrisisResources(): Promise<any> {
    return this.request<any>('/api/crisis/resources');
  }

  // Health
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health');
  }
}

export const apiClient = new EFTChatbotAPI();
export type { TokenResponse, UserSignup, UserLogin, ChatMessage, ChatResponse, EFTRequest, EFTResponse, EFTFeedback, EFTFeedbackResponse };
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Configure CORS and security headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
};

// Simple rate limiting (in production, use Redis or similar)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_WINDOW = 60000; // 1 minute

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (clientData.count >= RATE_LIMIT) {
    return false;
  }
  
  clientData.count++;
  return true;
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000); // Limit input length
}

function validateIntensity(intensity: any): boolean {
  return typeof intensity === 'number' && intensity >= 0 && intensity <= 10;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting
    const clientId = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientId)) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.',
        response: "I'm getting a lot of requests right now. Please wait a moment and try again."
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      chatState, 
      userName, 
      sessionContext, 
      conversationHistory 
    } = await req.json();

    // Input validation and sanitization
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    const sanitizedMessage = sanitizeInput(message);
    const sanitizedUserName = userName ? sanitizeInput(userName) : 'User';
    const sanitizedChatState = typeof chatState === 'string' ? chatState : 'initial';

    // Validate session context if provided
    if (sessionContext) {
      if (sessionContext.intensity !== undefined && !validateIntensity(sessionContext.intensity)) {
        throw new Error('Invalid intensity value');
      }
      if (sessionContext.feeling) {
        sessionContext.feeling = sanitizeInput(sessionContext.feeling);
      }
      if (sessionContext.bodyLocation) {
        sessionContext.bodyLocation = sanitizeInput(sessionContext.bodyLocation);
      }
      if (sessionContext.problem) {
        sessionContext.problem = sanitizeInput(sessionContext.problem);
      }
    }

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context-aware system prompt based on chat state
    let systemPrompt = `You are an empathetic EFT (Emotional Freedom Techniques) tapping assistant trained in proper therapeutic protocols. Your role is to guide users through anxiety management using professional EFT tapping techniques.

USER CONTEXT:
- User's name: ${sanitizedUserName}
- Current session context: ${JSON.stringify(sessionContext)}
- Chat state: ${sanitizedChatState}

CORE THERAPEUTIC RULES:
1. ALWAYS address the user by their first name when greeting them
2. Use the user's EXACT words in setup statements and reminder phrases
3. If intensity rating is >7, do general tapping rounds first to bring it down
4. Always ask for body location of feelings and use it in statements
5. Be warm, empathetic, and validating - acknowledge their courage
6. Follow the exact tapping point sequence: eyebrow, outer eye, under eye, under nose, chin, collarbone, under arm, top of head
7. Use breathing instructions: "take a deep breath in and breathe out"
8. If crisis keywords detected, express concern and provide crisis resources immediately
9. Keep responses concise and natural - avoid repeated filler phrases

INTENSITY RULES:
- If >7: Start with general anxiety tapping to reduce intensity first
- If 4-7: Move to specific issue tapping with their words
- If 1-3: Add positive affirmations and completion phrases
- If 0: Celebrate and offer meditation/advice

TAPPING SEQUENCE FORMAT:
Setup (side of hand): Create 3 statements using "Even though [their problem/feeling], [self-acceptance]"
Sequence: Always follow this order with specific reminder phrases using their words
- Eyebrow, Outer eye, Under eye, Under nose, Chin, Collarbone, Under arm, Top of head
- End each round with breathing and intensity check

LANGUAGE PATTERNS:
- "You're doing great [name]" - frequent encouragement
- "I'd like to acknowledge you for coming here" - validate their effort
- "That can't be nice... I'd really like to help you" - empathy
- Reflect their exact words back to them

CURRENT STAGE GUIDANCE:`;

    switch (chatState) {
      case 'initial':
        systemPrompt += `
- Greet ${userName} warmly: "Hi ${userName}! How are you feeling today?"
- I'd like to acknowledge you for coming here to get help - it's a big thing!
- Ask: "is there anything in particular that is bothering you?"
- If they mention anxiety: "That can't be nice... I'd really like to help you... Would you like to do some tapping with me? To see if we can help you feel a bit better?"`;
        break;
      case 'gathering-feeling':
        systemPrompt += `
- Ask: "What's the utmost negative emotion you're feeling right now ${userName}?"
- Validate their response with empathy
- Wait for them to respond with the emotion before moving to next step`;
        break;
      case 'gathering-location':
        systemPrompt += `
- Say: "Thank you for sharing that, ${userName}. I want you to focus on that ${sessionContext.feeling || 'feeling'} for a moment."
- Ask: "Can you tell me where you feel it in your body?"
- Common responses: chest, stomach, shoulders, throat, head
- Acknowledge their response and prepare for intensity rating`;
        break;
      case 'gathering-intensity':
        systemPrompt += `
- Acknowledge the body location: "OK, so you feel that ${sessionContext.feeling || 'feeling'} in your ${sessionContext.bodyLocation || 'body'}."
- Ask them to rate the intensity: "On a scale of 0 to 10, with 0 being no intensity and 10 being extreme intensity, how would you rate that feeling right now?"
- Wait for their rating before proceeding to setup statements`;
        break;
      case 'creating-statements':
        systemPrompt += `
- Create EXACTLY 3 setup statements using their words for [emotion], [body location], and [problem]
- Use varied language patterns:
  "Even though I feel this [emotion] in my [body location] because [problem], I'd like to be at peace"
  "I feel [emotion] in my [body location], [problem context], but I'd like to relax now"  
  "This [emotion] in my [body location], [problem], but I want to let it go"
- ONLY provide the 3 setup statements, nothing else
- DO NOT mention tapping points or sequences - that comes next
- End with: "Now let's do the tapping sequence. Please tap along with the visual guide."`;
        break;
      case 'tapping':
        systemPrompt += `
- DO NOT provide any tapping instructions - the visual interface handles this
- DO NOT list tapping points or reminder phrases
- Simply say: "Great! The tapping sequence will guide you through each point. Follow along with the visual animation."
- Keep response very short - the visual guide does the work`;
        break;
      case 'post-tapping':
        systemPrompt += `
- Say: "Take a deep breath in and breathe out, ${userName}. How are you feeling now?"
- Ask them to re-rate their intensity: "Can you rate that feeling again on the scale of 0-10?"
- DO NOT create new statements yet - wait for their rating first
- Keep response focused only on getting the new intensity rating`;
        break;
      case 'advice':
        systemPrompt += `
- Acknowledge their transformation: "You have done AMAZING work here today ${userName}"
- Suggest: "For now, why don't you head over to the meditation library and do one of the meditations? I think you'd really benefit"
- Offer ongoing support: "I am here whenever you need me"
- Encourage daily practice for lasting results`;
        break;
    }

    const messages = [
      { role: 'system', content: systemPrompt + `

CRITICAL RULES:
- ONLY do ONE step at a time
- NEVER combine multiple steps in one response
- Current step: ${chatState}
- Wait for user response before moving to next step
- Keep responses short and focused on current step only` },
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: sanitizedMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const aiResponse = data.choices[0].message.content;

    // Enhanced crisis detection with expanded keywords and phrases
    const crisisKeywords = [
      // Immediate danger keywords
      'suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'death', 'want to die',
      'self harm', 'cutting', 'overdose', 'jump off', 'hang myself', 'pills',
      
      // Severe emotional distress
      'better off dead', 'no point living', 'can\'t go on', 'no way out', 'give up',
      'hopeless', 'worthless', 'pointless', 'no hope', 'escape this pain',
      
      // Crisis phrases
      'want to hurt myself', 'thoughts of dying', 'end the pain', 'make it stop',
      'can\'t take it anymore', 'life isn\'t worth', 'world without me',
      'planning to hurt', 'thinking about suicide'
    ];
    
    const crisisPhrases = [
      'want to hurt myself',
      'thoughts of dying', 
      'end the pain',
      'make it stop',
      'can\'t take it anymore',
      'life isn\'t worth',
      'world without me',
      'planning to hurt',
      'thinking about suicide',
      'no point in living',
      'better off dead',
      'can\'t go on',
      'no way out'
    ];

    const messageText = sanitizedMessage.toLowerCase();
    
    // Check for individual keywords
    const containsCrisisKeyword = crisisKeywords.some(keyword => 
      messageText.includes(keyword.toLowerCase())
    );
    
    // Check for crisis phrases
    const containsCrisisPhrase = crisisPhrases.some(phrase => 
      messageText.includes(phrase.toLowerCase())
    );
    
    // Context-aware detection for concerning word combinations
    const concerningCombinations = [
      ['hurt', 'myself'],
      ['end', 'life'],
      ['kill', 'me'],
      ['want', 'die'],
      ['can\'t', 'anymore'],
      ['no', 'hope'],
      ['give', 'up'],
      ['escape', 'pain']
    ];
    
    const containsConcerningCombination = concerningCombinations.some(([word1, word2]) => 
      messageText.includes(word1) && messageText.includes(word2)
    );

    const crisisDetected = containsCrisisKeyword || containsCrisisPhrase || containsConcerningCombination;
    
    // Log crisis detection for monitoring (in production, use proper logging service)
    if (crisisDetected) {
      console.log('Crisis detected in message:', {
        clientId: clientId.substring(0, 8), // Partial ID for privacy
        timestamp: new Date().toISOString(),
        triggerType: containsCrisisKeyword ? 'keyword' : containsCrisisPhrase ? 'phrase' : 'combination',
        messageLength: sanitizedMessage.length
      });
    }

    // If crisis detected, modify AI response to be supportive and redirect to resources
    let finalResponse = aiResponse;
    if (crisisDetected) {
      finalResponse = `${userProfile?.first_name || 'Friend'}, I can see you're going through a really difficult time right now. Your safety and wellbeing are the most important thing. I want to connect you with people who are specially trained to help in these situations. Please know that you're not alone, and there are people who care about you and want to help. Let me show you some immediate support resources.`;
    }

    return new Response(JSON.stringify({ 
      response: finalResponse,
      crisisDetected: crisisDetected 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in EFT chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I apologize, but I'm having trouble connecting right now. Please try again in a moment."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
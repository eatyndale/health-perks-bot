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

// Simple spell checker for common anxiety terms
function correctCommonTypos(input: string): string {
  if (typeof input !== 'string') return '';
  
  const corrections: Record<string, string> = {
    'anxios': 'anxious', 'anxiuos': 'anxious', 'anixous': 'anxious',
    'stresed': 'stressed', 'stresd': 'stressed',
    'depresed': 'depressed', 'depress': 'depressed', 
    'worryed': 'worried', 'woried': 'worried',
    'scaed': 'scared', 'afraaid': 'afraid',
    'overwelmed': 'overwhelmed', 'overwhelmd': 'overwhelmed',
    'panicced': 'panicked', 'terified': 'terrified',
    'hopeles': 'hopeless', 'helpeles': 'helpless',
    'fustrated': 'frustrated', 'frustraited': 'frustrated',
    'stomache': 'stomach', 'stomch': 'stomach', 'shouldor': 'shoulder',
    'throut': 'throat', 'throaht': 'throat', 'forhead': 'forehead',
    'cant': "can't", 'wont': "won't", 'dont': "don't", 'isnt': "isn't"
  };
  
  let corrected = input.toLowerCase();
  for (const [typo, correction] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  }
  
  return corrected;
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  const corrected = correctCommonTypos(input);
  return corrected.trim().slice(0, 1000); // Limit input length
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
      conversationHistory,
      currentTappingPoint = 0,
      intensityHistory = []
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

    // Build enhanced context-aware system prompt
    let systemPrompt = `You are an empathetic EFT (Emotional Freedom Techniques) tapping assistant trained in proper therapeutic protocols. Your role is to guide users through anxiety management using professional EFT tapping techniques.

USER CONTEXT:
- User's name: ${sanitizedUserName}
- Current session context: ${JSON.stringify(sessionContext)}
- Chat state: ${sanitizedChatState}
- Current tapping point: ${currentTappingPoint}
- Intensity progression: ${JSON.stringify(intensityHistory)}
- Full conversation history length: ${conversationHistory.length} messages

ENHANCED CONTEXT AWARENESS:
- Always reference the user's previous responses and emotions
- Notice patterns in their language and emotional expressions
- Acknowledge typos or unclear inputs with understanding
- Build on previous session insights and progress
- Use their exact emotional words consistently throughout

CORE THERAPEUTIC RULES:
1. ALWAYS address the user by their first name and reference their specific situation
2. Use the user's EXACT words in setup statements and reminder phrases
3. If intensity rating is >7, do general tapping rounds first to bring it down
4. Always ask for body location of feelings and use it in statements
5. Be warm, empathetic, and validating - acknowledge their courage
6. ONE STEP AT A TIME - never rush through multiple phases
7. Use breathing instructions: "take a deep breath in and breathe out"
8. If crisis keywords detected, express concern and provide crisis resources immediately
9. Keep responses concise and natural - avoid repeated filler phrases
10. UNDERSTAND TYPOS AND RESPOND APPROPRIATELY - be compassionate about misspellings

PROGRESSIVE TAPPING FLOW:
- Create ONE setup statement at a time, not all three at once
- Guide through ONE tapping point at a time with specific instructions
- Allow real-time intensity adjustments during tapping
- Check in emotionally between each major step

LANGUAGE PATTERNS:
- "You're doing great [name]" - frequent encouragement
- "I can hear that you're feeling [their exact emotion]" - reflect their words
- "That must be really difficult for you" - empathy
- Reference their previous statements to show you're listening

CURRENT STAGE GUIDANCE:`;

    switch (chatState) {
      case 'initial':
        systemPrompt += `
- The user has shared their concern about ${sessionContext.problem || 'their situation'}
- Acknowledge their feelings with empathy: "I understand, ${userName}. That sounds really challenging."  
- Ask them to identify their specific emotion: "What's the most intense negative emotion you're feeling right now about this situation?"
- This is critical - you must ask about their EMOTION to proceed to the next step`;
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
- After they respond, immediately ask: "Now I need you to rate that feeling on a scale of 0-10, where 0 means no intensity and 10 is the strongest you can imagine."
- This is CRITICAL - you MUST ask for the rating on a scale of 0-10 to proceed
- Wait for their body location first, then ask for the intensity rating`;
        break;
      case 'gathering-pre-intensity':
        systemPrompt += `
- The user will provide a number from 0-10 for their intensity rating
- Acknowledge their rating: "Thank you for rating that at ${sessionContext.currentIntensity || '[number]'}/10, ${userName}"
- Now move to creating setup statements
- Say: "Let's create some setup statements to work with. Here's the first one:"
- Present the FIRST setup statement using their exact words`;
        break;
      case 'gathering-post-intensity':
        systemPrompt += `
- The user has provided their post-tapping intensity rating
- Compare it with their initial rating if available: "Great! You started at ${sessionContext.initialIntensity || '[initial]'}/10 and now you're at ${sessionContext.currentIntensity || '[current]'}/10"
- If intensity is still high (>3), suggest another round
- If intensity is low (≤3), congratulate them and move to advice phase`;
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
- End with: "Choose one of these statements that resonates with you most."`;
        break;
      case 'setup-statement-1':
        systemPrompt += `
- Present the FIRST setup statement using their exact words: "Even though I feel this [emotion] in my [body location] because [problem], I'd like to be at peace"
- Ask them to repeat it while tapping the side of their hand
- Wait for confirmation before moving to next statement
- Keep it simple and focused on just this one statement`;
        break;
      case 'setup-statement-2':
        systemPrompt += `
- Present the SECOND setup statement: "I feel [emotion] in my [body location], [problem], but I'd like to relax now"
- Ask them to repeat it while tapping the side of their hand
- Wait for confirmation before moving to next statement`;
        break;
      case 'setup-statement-3':
        systemPrompt += `
- Present the THIRD setup statement: "This [emotion] in my [body location], [problem], but I want to let it go"
- Ask them to repeat it while tapping the side of their hand
- After confirmation, say: "Great! Now we'll move through the tapping points one by one."`;
        break;
      case 'tapping-point':
        systemPrompt += `
- Guide them through ONE tapping point at a time
- Current point: ${currentTappingPoint === 0 ? 'eyebrow' : currentTappingPoint === 1 ? 'outer eye' : currentTappingPoint === 2 ? 'under eye' : currentTappingPoint === 3 ? 'under nose' : currentTappingPoint === 4 ? 'chin' : currentTappingPoint === 5 ? 'collarbone' : currentTappingPoint === 6 ? 'under arm' : 'top of head'}
- Give clear instruction: "Tap the [point] while saying: '[reminder phrase using their words]'"
- Wait for them to complete before moving to next point
- Keep responses short and focused on current point only`;
        break;
      case 'tapping-breathing':
        systemPrompt += `
- Say: "Take a deep breath in and breathe out, ${userName}. How are you feeling now?"
- Ask them to rate their intensity again: "Please rate that feeling again on a scale of 0-10 where 0 is no intensity and 10 is the strongest."
- This will help us see if another round of tapping is needed
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
      // Enhanced conversation history with more context
      ...conversationHistory.slice(-20).map((msg: any) => ({
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
      finalResponse = `${sanitizedUserName || 'Friend'}, I can see you're going through a really difficult time right now. Your safety and wellbeing are the most important thing. I want to connect you with people who are specially trained to help in these situations. Please know that you're not alone, and there are people who care about you and want to help. Let me show you some immediate support resources.`;
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
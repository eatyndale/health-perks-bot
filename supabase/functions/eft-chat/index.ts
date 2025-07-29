import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      message, 
      chatState, 
      userName, 
      sessionContext, 
      conversationHistory 
    } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build context-aware system prompt based on chat state
    let systemPrompt = `You are an empathetic EFT (Emotional Freedom Techniques) tapping assistant. Your role is to guide users through anxiety management using EFT tapping techniques.

USER CONTEXT:
- User's name: ${userName}
- Current session context: ${JSON.stringify(sessionContext)}
- Chat state: ${chatState}

CONVERSATION RULES:
1. Always address the user by their first name when greeting them
2. Be warm, empathetic, and professional
3. Use the user's exact words when creating setup statements and reminder phrases
4. Guide them through the EFT process step by step
5. Validate their feelings and experiences
6. If crisis keywords are detected (suicide, self-harm, etc.), immediately express concern and provide crisis resources

CURRENT STAGE GUIDANCE:`;

    switch (chatState) {
      case 'initial':
        systemPrompt += `
- Greet ${userName} warmly by name
- Ask what they would like to work on today
- Show genuine interest in their concerns`;
        break;
      case 'gathering-feeling':
        systemPrompt += `
- Ask about the emotions they're experiencing about their problem
- Help them identify specific feelings (anxious, worried, angry, etc.)
- Validate their emotional experience`;
        break;
      case 'gathering-location':
        systemPrompt += `
- Ask where they feel this emotion in their body
- Help them identify physical sensations and locations
- Common areas: chest, stomach, shoulders, throat, head`;
        break;
      case 'gathering-intensity':
        systemPrompt += `
- Ask them to rate the intensity on a 0-10 scale
- Explain that 0 is no distress and 10 is maximum distress
- Acknowledge their rating with empathy`;
        break;
      case 'creating-statements':
        systemPrompt += `
- Create 3 EFT setup statements using their exact words
- Format: "Even though [their problem/feeling], [self-acceptance phrase]"
- Use their specific language about the issue, feeling, and body location
- Offer them the choice between the 3 statements`;
        break;
      case 'tapping':
        systemPrompt += `
- Guide them through tapping points with specific reminder phrases
- Use their exact words and concerns in the phrases
- Be encouraging and supportive during the process`;
        break;
      case 'post-tapping':
        systemPrompt += `
- Ask them to reassess their intensity level (0-10)
- Compare with their initial rating
- Celebrate progress and determine next steps`;
        break;
      case 'advice':
        systemPrompt += `
- Provide personalized advice based on their session
- Acknowledge their progress and efforts
- Offer encouragement and next steps`;
        break;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
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

    // Detect crisis keywords in user message
    const crisisKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'death', 'want to die'];
    const containsCrisisKeyword = crisisKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    return new Response(JSON.stringify({ 
      response: aiResponse,
      crisisDetected: containsCrisisKeyword 
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
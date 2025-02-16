import OpenAI from 'openai';

// Initialize OpenAI client
export const getOpenAIClient = () => {
  const apiKey = localStorage.getItem('medipal_api_key');
  
  if (!apiKey) {
    throw new Error('OpenAI API key not found');
  }

  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });
};

// Chat completion function
export const getChatCompletion = async (messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) => {
  const openai = getOpenAIClient();
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are MediPal, an AI medical assistant. Provide accurate, helpful medical information while being clear about your limitations and encouraging users to seek professional medical advice for diagnosis and treatment."
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting chat completion:', error);
    throw error;
  }
}; 
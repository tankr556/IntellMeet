import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'mock-key-development',
});

export const generateMeetingIntelligence = async (transcriptText: string) => {
  // Fallback AI Engine when local API key is not configured or in testing mode
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'mock-key-development') {
    return {
      summaryText: "In this Product Strategy Sync, the team reviewed the upcoming Q4 release roadmap. Key discussions revolved around optimizing WebRTC video latency, finalizing Figma design tokens, and automating action item extraction for team members.",
      keyTakeaways: [
        "WebRTC peer connections optimized for low-latency video streaming.",
        "Dark mode SaaS Figma design architecture approved by engineering team.",
        "Kanban task board synchronization integrated for instant task conversion."
      ],
      actionItems: [
        {
          task: "Refine user flow and update Figma design components",
          assigneeName: "Sarah Chen",
          dueDateGuess: "End of Week",
          status: "To Do"
        },
        {
          task: "Configure OpenAI Whisper transcription and AI Summary pipeline",
          assigneeName: "Rakesh Tank",
          dueDateGuess: "Tomorrow",
          status: "In Progress"
        },
        {
          task: "Audit JWT refresh token security and httpOnly cookie setup",
          assigneeName: "David K.",
          dueDateGuess: "Next Sprint",
          status: "Done"
        }
      ]
    };
  }

  try {
    const prompt = `Analyze the following meeting transcript and extract structured JSON with:
1. "summaryText": A concise 3-sentence summary of the meeting.
2. "keyTakeaways": Array of 3 key takeaways.
3. "actionItems": Array of objects with "task", "assigneeName", and "dueDateGuess".

Transcript:
${transcriptText}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const responseContent = completion.choices[0].message.content;
    return JSON.parse(responseContent || '{}');
  } catch (error) {
    console.error('[AI Service Error]:', error);
    throw error;
  }
};

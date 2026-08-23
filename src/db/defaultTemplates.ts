import { FollowUpTemplate } from '../types';

export const DEFAULT_FOLLOW_UP_TEMPLATES: FollowUpTemplate[] = [
  {
    id: 'tpl-1',
    name: 'Post-Application Check-In',
    stage: 'post_application',
    defaultDaysAfter: 7,
    subject: 'Following up on application for {{role}} at {{company}}',
    body: `Hi {{recruiter}},

I hope you're having a great week!

I recently submitted my application for the {{role}} position at {{company}} (via {{applied_source}}). Given my background in {{key_skills}}, I'm very excited about the opportunity to contribute to {{company}}'s team.

I wanted to politely check in on the timeline for this role and see if there are any additional materials or details I can provide.

Thank you so much for your time and consideration!

Best regards,
{{my_name}}`,
  },
  {
    id: 'tpl-2',
    name: 'Post-Interview Thank You',
    stage: 'post_interview',
    defaultDaysAfter: 1,
    subject: 'Thank you — {{role}} interview at {{company}}',
    body: `Hi {{recruiter}},

Thank you for taking the time to speak with me today about the {{role}} position at {{company}}.

I really enjoyed learning more about {{company}}'s upcoming initiatives and how the team operates. Our conversation reinforced my enthusiasm for the role and my confidence that my skills would allow me to make an immediate impact.

Please let me know if you need any further information from my side. Looking forward to hearing about the next steps!

Warm regards,
{{my_name}}`,
  },
  {
    id: 'tpl-3',
    name: 'Status Check (No Response)',
    stage: 'status_check',
    defaultDaysAfter: 10,
    subject: 'Status update request: {{role}} at {{company}}',
    body: `Hi {{recruiter}},

I hope all is well with you.

I'm following up on my previous note regarding the {{role}} position at {{company}}. I remain very interested in the opportunity and would love to know if there are any updates regarding the hiring process.

I understand you may be reviewing a high volume of candidates, so no rush at all.

Thanks again for your time!

Best regards,
{{my_name}}`,
  },
  {
    id: 'tpl-4',
    name: 'Recruiter Outreach / Referral',
    stage: 'reconnection',
    defaultDaysAfter: 5,
    subject: 'Interest in {{role}} opening at {{company}} — {{my_name}}',
    body: `Hi {{recruiter}},

I came across the {{role}} opening at {{company}} and was immediately impressed by {{company}}'s recent work.

With my background in {{key_skills}}, I believe I would be a great fit for the team. I have attached my resume and would love 5-10 minutes to discuss how I can add value to your team.

Thank you for your time, and I look forward to connecting!

Best regards,
{{my_name}}`,
  },
];

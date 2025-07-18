
export interface ConversationLine {
  speaker: '☆' | '★';
  line: string;
}

export interface SummaryPoints {
  purpose: string;
  customerRequest: string;
  operatorResponse: string;
  nextSteps: string;
}

export interface Summary {
  reconstructedConversation: ConversationLine[];
  summary: SummaryPoints;
  crmInput: string;
}

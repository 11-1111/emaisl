export type SentEmail = {
  id: number
  user:string
  subject: string
  recipient_emails: string[]
  to?: string[]             
  attachments: string[]      
  sent_at: string           
  created_at: string
   is_sent: boolean
   blocked: boolean
  merchant?: string        
  attachmentUrl?: string    
}
  
  export interface EmailTemplate {
    to: string[]
    dear: string
    subject: string
    body: string
    attachments: File[]
  }

  // types.ts
export type Merchant = {
    id: number;
    merchant_name: string;
    recipient_emails: string[];
    created_at: string;
  };
  
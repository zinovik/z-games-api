export interface IEmailOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: [
    {
      data: string;
    },
    {
      path: string;
      type: string;
      name?: string;
      headers?: any;
    }
  ];
}

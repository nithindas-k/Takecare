export interface IContactService {
    createContactSubmission(data: any): Promise<any>;
    getStats(): Promise<any>;
    getAllSubmissions(): Promise<any>;
    replyToContact(contactId: string, replyMessage: string): Promise<any>;
}

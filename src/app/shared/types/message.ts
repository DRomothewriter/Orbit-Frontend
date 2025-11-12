import { MessageType } from "./message-type"

export interface Message {
    _id?: string
    groupId: string,
    userId: string,
    type: MessageType,
    text: string
}

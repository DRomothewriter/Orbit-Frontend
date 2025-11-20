import { MessageType } from "./message-type"

export interface Message {
    _id?: string
    username: string,
    groupId: string,
    userId: string,
    type: MessageType,
    imageUrl?: String,
    text: string
}

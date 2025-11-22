import { User } from "./user";

export interface GetFriendsResponse {
    _id?: string,
    userId: string,
    friendId: User,
    status: 'pending' | 'accepted' | 'blocked' | 'muted'
}

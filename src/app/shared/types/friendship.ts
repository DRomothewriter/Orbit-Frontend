export interface Friendship {
    userId: string,
    friendId: string,
    status: 'pending' | 'accepted' | 'blocked' | 'muted'
}

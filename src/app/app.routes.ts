import { Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { HomeComponent } from './home/home.component';
import { ChatComponent } from './home/chat/chat.component';
import { FriendsPanelComponent } from './home/friends-panel/friends-panel.component';
import { AddFriendComponent } from './home/friends-panel/add-friend/add-friend.component';
import { PendingComponent } from './home/friends-panel/pending/pending.component';
import { FriendsListComponent } from './home/friends-panel/friends-list/friends-list.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component:LoginComponent },
    { path: 'register', component: RegisterComponent }, 

    

    { path: 'home', component: HomeComponent, children: [
        { path:'friends', component: FriendsPanelComponent, children:[
            {path:'', component: FriendsListComponent},
            {path:'addFriend', component: AddFriendComponent},
            {path:'Pending', component: PendingComponent},
        ]},
        { path: ':id', component: ChatComponent}
    ]},
];

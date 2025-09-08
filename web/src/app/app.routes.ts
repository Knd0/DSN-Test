// web/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login.component';
import { BoardComponent } from './pages/board.component';
import { RegisterComponent } from './pages/register.component'
import { AuthGuard } from './guard/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: BoardComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];

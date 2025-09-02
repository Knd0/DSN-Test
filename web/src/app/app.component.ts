// web/src/app/app.component.ts
import { Component } from '@angular/core';
import { BoardComponent } from './board/board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BoardComponent],
  template: `<app-board></app-board>`,
})
export class AppComponent {
  title(title: any) {
    throw new Error('Method not implemented.');
  }
}

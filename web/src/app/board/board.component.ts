import { Component, computed, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { WsService } from '../services/ws.service';


@Component({
selector: 'app-board',
standalone: true,
imports: [NgFor, NgIf],
template: `
<div class="app">
<header>
<h1>Mini‑Kanban</h1>
<span *ngIf="connected()">🟢 Conectado</span>
<span *ngIf="!connected()">🔴 Desconectado (reintentando)</span>
</header>


<main class="columns">
<section>
<h2>To‑do</h2>
<div class="card" *ngFor="let t of todo()">{{ t.title }}</div>
</section>
<section>
<h2>Doing</h2>
<div class="card" *ngFor="let t of doing()">{{ t.title }}</div>
</section>
<section>
<h2>Done</h2>
<div class="card" *ngFor="let t of done()">{{ t.title }}</div>
</section>
</main>
</div>
`,
styles: [`
.app { max-width: 960px; margin: 0 auto; padding: 16px; font-family: system-ui; }
header { display:flex; gap:12px; align-items:center; justify-content:space-between; }
.columns { display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 16px; }
section { background:#0f172a; color:#e2e8f0; border-radius:12px; padding:12px; min-height: 200px; }
h2 { margin: 0 0 8px; font-size: 18px; }
.card { background:#1f2937; padding:8px; border-radius:8px; margin-bottom:8px; }
`]
})
export class BoardComponent implements OnInit {
connected = this.ws.connected;
todo = computed(() => this.ws.board().todo);
doing = computed(() => this.ws.board().doing);
done = computed(() => this.ws.board().done);


constructor(private ws: WsService) {}


ngOnInit() {
this.ws.connect();
}
}
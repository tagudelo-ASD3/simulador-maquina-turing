import { Component, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="page">
      <header class="header">
        <div class="header-dot red"></div>
        <div class="header-dot yellow"></div>
        <div class="header-dot green"></div>
        <span class="header-title">turing-machine-simulator</span>
        <span class="header-status" *ngIf="animando()">
          <span class="pulse"></span> ejecutando...
        </span>
      </header>

      <div class="main">
        <aside class="sidebar">
          <div class="section-label main-label">CONFIGURACIÓN</div>

          <label class="field-label">algoritmo</label>
          <select
            [(ngModel)]="algoritmo"
            (ngModelChange)="onAlgoritmoChange($event)"
            class="input-dark"
          >
            <option value="binary_add">suma binaria</option>
            <option value="write_name">escribir nombre</option>
          </select>

          <!-- ===== SUMA BINARIA ===== -->
          <ng-container *ngIf="algoritmo === 'binary_add'">
            <label
              class="field-label"
              style="font-weight:600;letter-spacing:0.5px"
              >Primer número binario</label
            >
            <input
              [(ngModel)]="entrada1"
              class="input-dark"
              placeholder="Ingresa el primer número (solo 0 y 1)"
              (ngModelChange)="validarBinario('entrada1', $event)"
              autocomplete="off"
            />
            <span class="warn" *ngIf="errorEntrada1"
              >Solo se permiten 0 y 1</span
            >

            <label
              class="field-label"
              style="font-weight:600;letter-spacing:0.5px"
              >Segundo número binario</label
            >
            <input
              [(ngModel)]="entrada2"
              class="input-dark"
              placeholder="Ingresa el segundo número (solo 0 y 1)"
              (ngModelChange)="validarBinario('entrada2', $event)"
              autocomplete="off"
            />
            <span class="warn" *ngIf="errorEntrada2"
              >Solo se permiten 0 y 1</span
            >
          </ng-container>

          <!-- ===== ESCRIBIR NOMBRE ===== -->
          <ng-container *ngIf="algoritmo === 'write_name'">
            <label class="field-label">nombre a escribir</label>
            <input
              [(ngModel)]="entrada1"
              class="input-dark"
              placeholder="ej: Tatiana"
              (ngModelChange)="generarPreview()"
            />

            <div class="section-label">TRANSFORMACIONES</div>

            <label class="field-label">caso</label>
            <div class="radio-group">
              <label
                class="radio-opt"
                *ngFor="let op of opcionesCaso"
                [class.selected]="casoNombre === op.val"
                (click)="casoNombre = op.val; generarPreview()"
              >
                {{ op.label }}
              </label>
            </div>

            <label class="field-label">separador entre letras</label>
            <div class="radio-group">
              <label
                class="radio-opt"
                *ngFor="let op of opcionesSep"
                [class.selected]="separador === op.val"
                (click)="separador = op.val; generarPreview()"
              >
                {{ op.label }}
              </label>
            </div>

            <label class="field-label">repetir nombre</label>
            <div
              style="display:flex;align-items:center;gap:8px;margin-bottom:6px"
            >
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                [(ngModel)]="repeticiones"
                (ngModelChange)="generarPreview()"
                class="slider"
              />
              <span class="accent">x{{ repeticiones }}</span>
            </div>

            <label class="field-label">borrar al final</label>
            <div class="radio-group">
              <label
                class="radio-opt"
                [class.selected]="!borrar"
                (click)="borrar = false; generarPreview()"
                >no</label
              >
              <label
                class="radio-opt"
                [class.selected]="borrar"
                (click)="borrar = true; generarPreview()"
                >sí (borra al terminar)</label
              >
            </div>

            <!-- Preview -->
            <div class="preview-box" *ngIf="preview">
              <span class="section-label" style="margin:0 0 4px"
                >PREVIEW EN CINTA</span
              >
              <div class="preview-tape">
                <span
                  *ngFor="let c of preview.split('')"
                  class="preview-cell"
                  >{{ c }}</span
                >
              </div>
            </div>
          </ng-container>

          <label class="field-label" style="margin-top:10px"
            >velocidad (ms/paso)</label
          >
          <div style="display:flex;align-items:center;gap:8px">
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              [(ngModel)]="velocidad"
              class="slider"
            />
            <span class="accent">{{ velocidad }}ms</span>
          </div>

          <button (click)="ejecutar()" class="btn-run" [disabled]="animando()">
            <span>▶</span> {{ animando() ? 'ejecutando...' : 'ejecutar' }}
          </button>
          <button (click)="detener()" class="btn-stop" *ngIf="animando()">
            ■ detener
          </button>

          <!-- Estado -->
          <div class="status-box" *ngIf="pasos().length > 0">
            <div class="section-label">ESTADO ACTUAL</div>
            <div class="status-row">
              <span class="status-key">estado</span>
              <span class="status-val accent">{{ pasoActual()?.state }}</span>
            </div>
            <div class="status-row">
              <span class="status-key">paso</span>
              <span class="status-val"
                >{{ indice() + 1 }} / {{ pasos().length }}</span
              >
            </div>
            <div class="status-row">
              <span class="status-key">status</span>
              <span
                class="status-val"
                [class.green]="pasoActual()?.status === 'ACCEPTED'"
                [class.red]="pasoActual()?.status === 'REJECTED'"
              >
                {{ pasoActual()?.status }}
              </span>
            </div>
            <div class="status-row">
              <span class="status-key">cabezal</span>
              <span class="status-val yellow"
                >pos {{ pasoActual()?.head }}</span
              >
            </div>
          </div>

          <div class="controles" *ngIf="pasos().length > 0 && !animando()">
            <button
              (click)="anterior()"
              [disabled]="indice() === 0"
              class="btn-nav"
            >
              ◀ prev
            </button>
            <button
              (click)="siguiente()"
              [disabled]="indice() === pasos().length - 1"
              class="btn-nav"
            >
              next ▶
            </button>
            <button (click)="reiniciar()" class="btn-nav reset">↺ reset</button>
          </div>
        </aside>

        <div class="content">
          <!-- Cinta -->
          <div class="panel" *ngIf="pasos().length > 0">
            <div class="panel-header">
              <span class="section-label panel-label" style="margin:0"
                >CINTA DE MEMORIA</span
              >
              <span class="progress-bar-wrap">
                <span
                  class="progress-bar"
                  [style.width.%]="((indice() + 1) / pasos().length) * 100"
                >
                </span>
              </span>
              <span class="accent" style="font-size:11px"
                >{{ indice() + 1 }}/{{ pasos().length }}</span
              >
            </div>
            <div class="tape-wrapper">
              <div class="tape">
                <div
                  *ngFor="let celda of pasoActual()?.tape; let i = index"
                  class="cell"
                  [class.active]="i === pasoActual()?.head"
                  [class.written]="celda !== '_' && i !== pasoActual()?.head"
                  [class.erased]="celda === '_' && i < pasoActual()?.head"
                >
                  <span class="cell-index">{{ i }}</span>
                  <span class="cell-val">{{
                    celda === '_' ? '□' : celda
                  }}</span>
                </div>
              </div>
            </div>
            <div class="head-indicator">
              cabezal → posición
              <span class="accent">{{ pasoActual()?.head }}</span> &nbsp;|&nbsp;
              leyendo:
              <span class="accent"
                >"{{ pasoActual()?.tape[pasoActual()?.head] }}"</span
              >
            </div>
            <!-- Resultado de la suma binaria -->
            <div *ngIf="algoritmo === 'binary_add' && !animando() && pasos().length > 0" style="margin-top:18px">
              <span class="section-label" style="font-size:1rem;margin:0 0 6px 0;padding-left:8px;border-left:3px solid #3fb950;">RESULTADO</span>
              <div style="margin-top:6px;font-size:1.2rem;color:#3fb950;font-family:'Courier New',monospace;">
                {{ obtenerResultadoBinario() }}
              </div>
            </div>
          </div>

          <!-- Tabla -->
          <div class="panel" *ngIf="tablaEstados().length > 0">
            <div class="section-label panel-label">TABLA DE TRANSICIÓN</div>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>estado actual</th>
                    <th>lee</th>
                    <th>escribe</th>
                    <th>mueve</th>
                    <th>nuevo estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    *ngFor="let fila of tablaEstados()"
                    [class.row-active]="
                      fila.current_state === pasoActual()?.state
                    "
                  >
                    <td class="mono">{{ fila.current_state }}</td>
                    <td class="mono center accent">{{ fila.read }}</td>
                    <td class="mono center green">{{ fila.write }}</td>
                    <td class="mono center yellow">{{ fila.move }}</td>
                    <td class="mono">{{ fila.next_state }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      .page {
        min-height: 100vh;
        background: #0d1117;
        color: #c9d1d9;
        font-family: 'Courier New', monospace;
        font-size: 13px;
      }
      .header {
        background: #161b22;
        border-bottom: 1px solid #30363d;
        padding: 10px 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .header-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .header-dot.red {
        background: #ff5f57;
      }
      .header-dot.yellow {
        background: #febc2e;
      }
      .header-dot.green {
        background: #28c840;
      }
      .header-title {
        margin-left: 12px;
        color: #fff;
        font-size: 2.2rem;
        font-weight: bold;
        letter-spacing: 2px;
        text-shadow:
          0 2px 12px #1f6feb88,
          0 1px 0 #30363d;
        font-family: 'Inter Tight', 'Segoe UI', Arial, sans-serif;
        background: linear-gradient(90deg, #58a6ff 0%, #a5d6ff 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-fill-color: transparent;
        transition: font-size 0.2s;
      }
      .header-status {
        margin-left: auto;
        color: #3fb950;
        font-size: 12px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      @keyframes blink {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.2;
        }
      }
      .pulse {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #3fb950;
        animation: blink 1s infinite;
        display: inline-block;
      }

      .main {
        display: flex;
        min-height: calc(100vh - 41px);
      }
      .sidebar {
        width: 270px;
        min-width: 270px;
        background: #161b22;
        border-right: 1px solid #30363d;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow-y: auto;
      }
      .section-label {
        color: #fff;
        font-size: 1.15rem;
        font-weight: 700;
        margin: 18px 0 10px;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-shadow: 0 2px 12px #1f6feb44;
        border-left: 5px solid #58a6ff;
        padding-left: 13px;
        background: linear-gradient(90deg, #161b22 80%, #58a6ff22 100%);
        border-radius: 3px;
        display: inline-block;
        transition: all 0.2s;
      }
      .main-label {
        color: #a5d6ff;
        font-size: 1.25rem;
        letter-spacing: 3px;
        border-left: 7px solid #1f6feb;
        padding-left: 16px;
        margin-top: 0;
        margin-bottom: 18px;
        background: linear-gradient(90deg, #161b22 60%, #1f6feb33 100%);
      }
      .panel-label {
        color: #58a6ff;
        font-size: 1.1rem;
        border-left: 5px solid #3fb950;
        padding-left: 12px;
        margin-bottom: 12px;
        background: linear-gradient(90deg, #161b22 80%, #3fb95022 100%);
      }
      .field-label {
        color: #8b949e;
        font-size: 11px;
        margin-bottom: 3px;
        display: block;
      }
      .warn {
        color: #f85149;
        font-size: 11px;
        margin-top: -4px;
        margin-bottom: 4px;
        display: block;
      }

      .input-dark {
        width: 100%;
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 6px;
        color: #58a6ff;
        padding: 7px 10px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        margin-bottom: 6px;
        outline: none;
      }
      .input-dark:focus {
        border-color: #58a6ff;
      }
      .slider {
        flex: 1;
        accent-color: #58a6ff;
      }

      .radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-bottom: 8px;
      }
      .radio-opt {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 4px;
        padding: 4px 10px;
        cursor: pointer;
        font-size: 11px;
        color: #8b949e;
        transition: all 0.15s;
      }
      .radio-opt:hover {
        border-color: #58a6ff;
        color: #c9d1d9;
      }
      .radio-opt.selected {
        background: #1f3a5f;
        border-color: #58a6ff;
        color: #58a6ff;
      }

      .preview-box {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 10px;
        margin: 6px 0;
      }
      .preview-tape {
        display: flex;
        flex-wrap: wrap;
        gap: 3px;
        margin-top: 6px;
      }
      .preview-cell {
        width: 22px;
        height: 22px;
        border: 1px solid #30363d;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #3fb950;
        background: #0f2d1a;
      }

      .btn-run {
        background: #238636;
        border: 1px solid #2ea043;
        color: #fff;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        margin-top: 8px;
        width: 100%;
        letter-spacing: 1px;
      }
      .btn-run:hover:not(:disabled) {
        background: #2ea043;
      }
      .btn-run:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .btn-stop {
        background: #3d1a1a;
        border: 1px solid #f85149;
        color: #f85149;
        padding: 8px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        width: 100%;
        margin-top: 4px;
      }
      .btn-stop:hover {
        background: #5a1f1f;
      }

      .status-box {
        background: #0d1117;
        border: 1px solid #30363d;
        border-radius: 6px;
        padding: 10px;
        margin-top: 8px;
      }
      .status-row {
        display: flex;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid #21262d;
      }
      .status-row:last-child {
        border-bottom: none;
      }
      .status-key {
        color: #6e7681;
      }
      .status-val {
        color: #c9d1d9;
      }

      .controles {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        flex-wrap: wrap;
      }
      .btn-nav {
        flex: 1;
        background: #21262d;
        border: 1px solid #30363d;
        color: #c9d1d9;
        padding: 7px 4px;
        border-radius: 6px;
        cursor: pointer;
        font-family: 'Courier New', monospace;
        font-size: 11px;
      }
      .btn-nav:hover {
        background: #30363d;
      }
      .btn-nav:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
      .btn-nav.reset {
        color: #f85149;
        border-color: #f85149;
      }

      .content {
        flex: 1;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 20px;
        overflow: hidden;
      }
      .panel {
        background: #161b22;
        border: 1px solid #30363d;
        border-radius: 10px;
        padding: 16px 20px;
      }
      .panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 10px;
      }
      .progress-bar-wrap {
        flex: 1;
        height: 4px;
        background: #21262d;
        border-radius: 2px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        background: #1f6feb;
        border-radius: 2px;
        transition: width 0.2s ease;
      }

      .tape-wrapper {
        overflow-x: auto;
        padding: 10px 0;
      }
      .tape {
        display: flex;
        gap: 4px;
        min-width: max-content;
      }
      .cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 42px;
        border: 1px solid #30363d;
        border-radius: 4px;
        padding: 4px 2px;
        background: #0d1117;
        transition: all 0.2s ease;
      }
      .cell.active {
        background: #1f6feb;
        border-color: #58a6ff;
      }
      .cell.written {
        border-color: #2ea043;
        background: #0f2d1a;
      }
      .cell.erased {
        border-color: #6e7681;
        background: #1a1a1a;
        opacity: 0.5;
      }
      .cell-index {
        font-size: 9px;
        color: #6e7681;
        line-height: 1;
      }
      .cell-val {
        font-size: 16px;
        font-weight: bold;
        color: #e6edf3;
        line-height: 1.4;
      }
      .cell.active .cell-val {
        color: #fff;
      }
      .cell.active .cell-index {
        color: #a5c8ff;
      }
      .head-indicator {
        margin-top: 8px;
        color: #6e7681;
        font-size: 12px;
      }

      .table-wrapper {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      th {
        color: #6e7681;
        text-align: left;
        padding: 8px 12px;
        border-bottom: 1px solid #21262d;
        font-weight: normal;
        letter-spacing: 0.5px;
      }
      td {
        padding: 7px 12px;
        border-bottom: 1px solid #21262d;
        color: #c9d1d9;
      }
      tr.row-active td {
        background: #1f2d45;
        color: #58a6ff;
      }
      tr:hover td {
        background: #1c2128;
      }

      .mono {
        font-family: 'Courier New', monospace;
      }
      .center {
        text-align: center;
      }
      .accent {
        color: #58a6ff;
      }
      .green {
        color: #3fb950;
      }
      .yellow {
        color: #d29922;
      }
      .red {
        color: #f85149;
      }
    `,
  ],
})
export class AppComponent implements OnDestroy {
  private http = inject(HttpClient);

  algoritmo = 'binary_add';
  entrada1 = '';
  entrada2 = '';
  velocidad = 300;

  casoNombre = 'upper';
  separador = '';
  repeticiones = 1;
  borrar = false;
  preview = '';
  errorEntrada1 = false;
  errorEntrada2 = false;

  opcionesCaso = [
    { val: 'upper', label: 'Mayus' },
    { val: 'lower', label: 'Minus' },
    { val: 'title', label: 'Title' },
    { val: 'alt', label: 'Alter' },
  ];

  opcionesSep = [
    { val: '', label: 'ninguno' },
    { val: '-', label: '-' },
    { val: '_', label: '_' },
    { val: '.', label: '.' },
    { val: '*', label: '*' },
  ];

  pasos = signal<any[]>([]);
  indice = signal(0);
  tablaEstados = signal<any[]>([]);
  animando = signal(false);
  private intervalo: any = null;

  pasoActual() {
    return this.pasos()[this.indice()] ?? null;
  }

  // Transforma el nombre según las opciones elegidas
  transformarNombre(nombre: string): string {
    let resultado = nombre;

    switch (this.casoNombre) {
      case 'upper':
        resultado = nombre.toUpperCase();
        break;
      case 'lower':
        resultado = nombre.toLowerCase();
        break;
      case 'title':
        resultado =
          nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
        break;
      case 'alt':
        resultado = nombre
          .split('')
          .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
          .join('');
        break;
    }

    // Separador entre letras
    if (this.separador) {
      resultado = resultado.split('').join(this.separador);
    }

    // Repeticiones
    const base = resultado;
    for (let i = 1; i < this.repeticiones; i++) {
      resultado += (this.separador ? this.separador : '') + base;
    }

    return resultado;
  }

  generarPreview() {
    if (!this.entrada1) {
      this.preview = '';
      return;
    }
    const nombre = this.transformarNombre(this.entrada1);
    this.preview = nombre + (this.borrar ? ' → □□□' : '');
  }

  validarBinario(campo: 'entrada1' | 'entrada2', valor: string) {
    const invalido = !/^[01]*$/.test(valor);
    if (campo === 'entrada1') this.errorEntrada1 = invalido;
    if (campo === 'entrada2') this.errorEntrada2 = invalido;
  }

  onAlgoritmoChange(nuevo: string) {
    this.detener();
    this.pasos.set([]);
    this.tablaEstados.set([]);
    this.indice.set(0);
    this.errorEntrada1 = false;
    this.errorEntrada2 = false;
    this.preview = '';
    if (nuevo === 'binary_add') {
      this.entrada1 = '';
      this.entrada2 = '';
    } else {
      this.entrada1 = '';
      this.entrada2 = '';
      this.casoNombre = 'upper';
      this.separador = '';
      this.repeticiones = 1;
      this.borrar = false;
      this.generarPreview();
    }
  }

  ejecutar() {
    this.detener();

    // Construir el nombre final con todas las transformaciones
    const nombreFinal =
      this.algoritmo === 'write_name'
        ? this.transformarNombre(this.entrada1) + (this.borrar ? '|BORRAR' : '')
        : this.entrada1;

    this.http
      .post<any>('http://localhost:8000/api/execute', {
        algorithm: this.algoritmo,
        input1: nombreFinal,
        input2: this.entrada2,
        step_by_step: true,
      })
      .subscribe({
        next: (res) => {
          this.pasos.set(res.steps);
          this.tablaEstados.set(res.state_table);
          this.indice.set(0);
          this.iniciarAnimacion();
        },
        error: (err) => console.error('Error:', err),
      });
  }

  iniciarAnimacion() {
    this.animando.set(true);
    this.intervalo = setInterval(() => {
      if (this.indice() < this.pasos().length - 1) {
        this.indice.update((i) => i + 1);
      } else {
        this.detener();
      }
    }, this.velocidad);
  }

  detener() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
      this.intervalo = null;
    }
    this.animando.set(false);
  }

  siguiente() {
    if (this.indice() < this.pasos().length - 1)
      this.indice.update((i) => i + 1);
  }

  anterior() {
    if (this.indice() > 0) this.indice.update((i) => i - 1);
  }

  reiniciar() {
    this.detener();
    this.indice.set(0);
    this.iniciarAnimacion();
  }

  // Obtiene el resultado binario final de la cinta (después de la animación)
  obtenerResultadoBinario(): string {
    if (this.pasos().length === 0) return '';
    // Último paso
    const final = this.pasos()[this.pasos().length - 1];
    if (!final || !final.tape) return '';
    // El resultado está después del separador '+' y antes del primer '_'
    const tape = final.tape;
    const plusIdx = tape.indexOf('+');
    if (plusIdx === -1) return '';
    // El resultado está a la derecha del '+'
    let res = '';
    for (let i = plusIdx + 1; i < tape.length; i++) {
      if (tape[i] === '_' || tape[i] === undefined) break;
      res += tape[i];
    }
    // Si el resultado está vacío, intenta buscar a la izquierda del '_'
    if (!res) {
      // Busca el primer '_'
      let last = tape.lastIndexOf('_', tape.length - 1);
      if (last === -1) last = tape.length;
      // Busca desde el principio hasta '_', omitiendo '+'
      for (let i = 0; i < last; i++) {
        if (tape[i] !== '+' && tape[i] !== '_') res += tape[i];
      }
    }
    // Elimina ceros a la izquierda
    return res.replace(/^0+/, '') || '0';
  }

  ngOnDestroy() {
    this.detener();
  }
}

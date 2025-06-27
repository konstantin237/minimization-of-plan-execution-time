import { hungarianMethod } from './hungarian.js';
import { branchAndBoundAssignment } from './branch_and_bound.js';
import { lpAssignment } from './lp_assignment.js';
import { greedyAssignment } from './greedy_assignment.js';

// Model
class AssignmentModel {
  constructor(size = 3) {
    this.size = size;
    this.C = Array.from({ length: size }, () => Array(size).fill(0));
    this.T = Array.from({ length: size }, () => Array(size).fill(0));
    this.S = 0;
    this.T_type = 'min';
    this.T_limit = '';
  }

  setMatrixC(C) { this.C = C; }
  setMatrixT(T) { this.T = T; }
  setS(S) { this.S = S; }
  setTType(T_type) { this.T_type = T_type; }
  setTLimit(T_limit) { this.T_limit = T_limit; }

  // Генерация всех перестановок работ для n работников
  static permutations(arr) {
    if (arr.length === 1) return [arr];
    let result = [];
    for (let i = 0; i < arr.length; i++) {
      let rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (let perm of AssignmentModel.permutations(rest)) {
        result.push([arr[i]].concat(perm));
      }
    }
    return result;
  }

  // Решение задачи о назначениях перебором
  solve(params = {}) {
    const n = this.size;
    const jobs = Array.from({ length: n }, (_, i) => i);
    const perms = AssignmentModel.permutations(jobs);
    let solutions = [];
    let prevT = null;
    for (let perm of perms) {
      let sumC = 0;
      let times = [];
      let table = [];
      for (let i = 0; i < n; i++) {
        let c = this.C[i][perm[i]];
        let t = this.T[i][perm[i]];
        sumC += c;
        times.push(t);
        table.push({ worker: i + 1, job: perm[i] + 1, c, t });
      }
      let T_value = this.T_type === 'min' ? Math.max(...times) : Math.min(...times);
      let valid = true;
      if (this.S && sumC > this.S) valid = false;
      if (params.skipIncreasingTime) {
        if (prevT !== null && T_value > prevT) {
          continue;
        }
        prevT = T_value;
      }
      if (params.hideInvalidSolutions && !valid) continue;
      solutions.push({ perm, sumC, T_value, table, valid });
    }
    // Новый алгоритм выбора ответа:
    let filtered = solutions.filter(s => s.valid);
    if (this.T_limit !== '') {
      if (this.T_type === 'min') {
        filtered = filtered.filter(s => s.T_value <= this.T_limit);
      } else {
        filtered = filtered.filter(s => s.T_value >= this.T_limit);
      }
    }
    if (filtered.length === 0) return { answer: 'Нет допустимых решений', solutions };
    // 1. Находим минимальное T
    let minT = Math.min(...filtered.map(s => s.T_value));
    let minTsolutions = filtered.filter(s => s.T_value === minT);
    // 2. Среди них ищем минимальное S
    let minS = Math.min(...minTsolutions.map(s => s.sumC));
    let bestSolutions = minTsolutions.filter(s => s.sumC === minS);
    // 3. Если одно — выводим как раньше, если несколько — массив
    let answer;
    if (bestSolutions.length === 1) {
      answer = bestSolutions[0];
    } else {
      answer = bestSolutions;
    }
    return { answer, solutions };
  }
}

// View
class AssignmentView {
  constructor() {
    this.matrixCTextarea = document.getElementById('matrix-c-textarea');
    this.matrixTTextarea = document.getElementById('matrix-t-textarea');
    this.syncTextareas();
  }
  syncTextareas() {
    const c = this.matrixCTextarea;
    const t = this.matrixTTextarea;
    if (!c || !t) return;
    function sync(from, to) {
      to.style.height = from.style.height;
    }
    c.addEventListener('input', () => {
      c.style.height = 'auto';
      c.style.height = c.scrollHeight + 'px';
      sync(c, t);
    });
    t.addEventListener('input', () => {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
      sync(t, c);
    });
    // Инициализация
    setTimeout(() => {
      c.style.height = 'auto';
      t.style.height = 'auto';
      c.style.height = c.scrollHeight + 'px';
      t.style.height = t.scrollHeight + 'px';
      if (c.scrollHeight > t.scrollHeight) t.style.height = c.style.height;
      else c.style.height = t.style.height;
    }, 0);
  }
  parseMatrixFromTextarea(textareaValue) {
    const lines = textareaValue.trim().split('\n').filter(line => line.trim() !== '');
    const matrix = lines.map(line => line.trim().split(/\s+/).map(Number));
    const rowLens = matrix.map(row => row.length);
    const allEqual = rowLens.every(l => l === rowLens[0]);
    return { matrix, size: matrix.length, isSquare: allEqual && matrix.length === rowLens[0] };
  }
  getParams() {
    return {
      S: +document.getElementById('salary-fund').value,
      T_type: document.getElementById('t-type').value,
      T_limit: document.getElementById('t-limit').value === '' ? '' : +document.getElementById('t-limit').value,
      skipIncreasingTime: document.getElementById('skip-increasing-time').checked,
      hideInvalidSolutions: document.getElementById('hide-invalid-solutions').checked,
      solveHungarian: document.getElementById('solve-hungarian').checked,
      solveBranch: document.getElementById('solve-branch').checked,
      solveLP: document.getElementById('solve-lp').checked,
      solveGreedy: document.getElementById('solve-greedy').checked
    };
  }
  getMatrixC() {
    if (!this.matrixCTextarea) return { matrix: [], size: 0, isSquare: false };
    return this.parseMatrixFromTextarea(this.matrixCTextarea.value);
  }
  getMatrixT() {
    if (!this.matrixTTextarea) return { matrix: [], size: 0, isSquare: false };
    return this.parseMatrixFromTextarea(this.matrixTTextarea.value);
  }
  renderAnswer(answer) {
    const answerEl = document.getElementById('answer');
    if (typeof answer === 'string') {
      answerEl.textContent = answer;
      return;
    }
    // Если несколько решений — выводим все
    if (Array.isArray(answer)) {
      let html = '';
      answer.forEach((ans, idx) => {
        html += `<b>Решение ${idx + 1}</b>`;
        html += '<table><thead><tr><th></th><th><b>Решение</b></th></tr></thead><tbody>';
        for (let i = 0; i < ans.perm.length; i++) {
          html += `<tr><th>x${i + 1}</th><td>${ans.perm[i] + 1} (C: ${ans.table[i].c}, T: ${ans.table[i].t})</td></tr>`;
        }
        html += `<tr><th>S</th><td>${ans.sumC}</td></tr>`;
        html += `<tr><th>T</th><td>${ans.T_value}</td></tr>`;
        html += '</tbody></table>';
      });
      answerEl.innerHTML = html;
      return;
    }
    // Обычный вывод для одного решения
    let html = '<table><thead><tr><th></th><th><b>Решение</b></th></tr></thead><tbody>';
    for (let i = 0; i < answer.perm.length; i++) {
      html += `<tr><th>x${i + 1}</th><td>${answer.perm[i] + 1} (C: ${answer.table[i].c}, T: ${answer.table[i].t})</td></tr>`;
    }
    html += `<tr><th>S</th><td>${answer.sumC}</td></tr>`;
    html += `<tr><th>T</th><td>${answer.T_value}</td></tr>`;
    html += '</tbody></table>';
    answerEl.innerHTML = html;
  }
  renderSolutionTable(solutions) {
    const tableDiv = document.getElementById('solution-table');
    if (!solutions || solutions.length === 0) { tableDiv.innerHTML = ''; return; }
    const n = solutions[0].perm.length;
    let html = '<table><thead><tr><th></th>';
    solutions.forEach((sol, idx) => {
      html += `<th${sol.valid ? '' : ' style=\"opacity:0.5\"'}>Решение № ${idx + 1}</th>`;
    });
    html += '</tr></thead><tbody>';
    for (let i = 0; i < n; i++) {
      html += `<tr><th>x${i + 1}</th>`;
      solutions.forEach((sol) => {
        const jobIdx = sol.perm[i];
        const c = sol.table[i].c;
        const t = sol.table[i].t;
        html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${jobIdx + 1} (C: ${c}, T: ${t})</td>`;
      });
      html += '</tr>';
    }
    html += '<tr><th>S</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.sumC}</td>`;
    });
    html += '</tr>';
    html += '<tr><th>T</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.T_value}</td>`;
    });
    html += '</tr>';
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
  }
  renderHungarianMethod(C) {
    return hungarianMethod(C);
  }
  renderOtherMethods(C) {
    let html = '';
    // --- Ветвей и границ ---
    html += '<h3>Метод ветвей и границ</h3>';
    html += '<div>Метод ветвей и границ строит дерево решений, отбрасывая заведомо невыгодные варианты. Обычно используется для больших задач, когда полный перебор невозможен.</div>';
    const bb = branchAndBoundAssignment(C);
    if (bb) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < bb.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${bb.assignment[i] + 1} (C: ${C[i][bb.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${bb.cost}</div>`;
    }
    // --- ЛП ---
    html += '<h3>Линейное программирование</h3>';
    html += '<div>Задача о назначениях может быть сведена к задаче линейного программирования и решена симплекс-методом или другими LP-алгоритмами.</div>';
    const lp = lpAssignment(C);
    if (lp) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < lp.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${lp.assignment[i] + 1} (C: ${C[i][lp.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${lp.cost}</div>`;
    }
    // --- Жадный ---
    html += '<h3>Жадные и эвристические методы</h3>';
    html += '<div>Жадные методы назначают работ по принципу минимальной стоимости на каждом шаге, но не гарантируют оптимальности.</div>';
    const greedy = greedyAssignment(C);
    if (greedy) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < greedy.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${greedy.assignment[i] + 1} (C: ${C[i][greedy.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${greedy.cost}</div>`;
    }
    return html;
  }
  renderExtraMethods(Craw, params) {
    const extraDiv = document.getElementById('extra-methods');
    let html = '';
    const C = Craw;
    const n = C.length;
    const isSquare = n > 0 && C.every(row => row.length === n);
    // Венгерский метод
    if (params.solveHungarian) {
      html += '<h3>Решение методом Венгера (венгерский алгоритм)</h3>';
      if (!isSquare) {
        html += '<div style="color:red">Матрица должна быть квадратной (n×n), проверьте ввод.</div>';
      } else {
        const result = this.robustHungarianMethod(C);
        if (!result) {
          html += '<div>Венгерский алгоритм не смог найти решение для этой матрицы. Возможно, матрица содержит некорректные значения.</div>';
        } else {
          html += '<div><b>Решение:</b></div>';
          html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
          for (let i = 0; i < result.assignment.length; i++) {
            html += `<tr><th>x${i + 1}</th><td>${result.assignment[i] + 1} (C: ${C[i][result.assignment[i]]})</td></tr>`;
          }
          html += '</tbody></table>';
          html += `<div><b>Ответ:</b> Суммарная стоимость = ${result.cost}</div>`;
        }
      }
    }
    // Ветвей и границ
    if (params.solveBranch) html += this.renderBranchMethod(C);
    // ЛП
    if (params.solveLP) html += this.renderLPMethod(C);
    // Жадный
    if (params.solveGreedy) html += this.renderGreedyMethod(C);
    extraDiv.innerHTML = html;
  }
  // robustHungarianMethod — исправленный венгерский (жадный + полный перебор для малых n)
  robustHungarianMethod(C) {
    // Сначала пробуем жадно (как раньше)
    const n = C.length;
    if (!n || C.some(row => row.length !== n)) return null;
    let matrix = C.map(row => row.slice());
    for (let i = 0; i < n; i++) {
      let min = Math.min(...matrix[i]);
      for (let j = 0; j < n; j++) matrix[i][j] -= min;
    }
    for (let j = 0; j < n; j++) {
      let col = matrix.map(row => row[j]);
      let min = Math.min(...col);
      for (let i = 0; i < n; i++) matrix[i][j] -= min;
    }
    // Жадное назначение
    let assigned = Array(n).fill(-1);
    let usedCols = Array(n).fill(false);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] === 0 && !usedCols[j]) {
          assigned[i] = j;
          usedCols[j] = true;
          break;
        }
      }
    }
    if (!assigned.includes(-1)) {
      let cost = 0;
      for (let i = 0; i < n; i++) cost += C[i][assigned[i]];
      return {assignment: assigned, cost};
    }
    // Если не удалось — полный перебор всех перестановок (для малых n)
    if (n > 7) return null; // слишком долго для больших
    let jobs = Array.from({length: n}, (_, i) => i);
    let minCost = Infinity;
    let best = null;
    function* permute(a, l, r) {
      if (l === r) yield a.slice();
      else {
        for (let i = l; i <= r; i++) {
          [a[l], a[i]] = [a[i], a[l]];
          yield* permute(a, l+1, r);
          [a[l], a[i]] = [a[i], a[l]];
        }
      }
    }
    for (let perm of permute(jobs, 0, n-1)) {
      let cost = 0;
      for (let i = 0; i < n; i++) cost += C[i][perm[i]];
      if (cost < minCost) {
        minCost = cost;
        best = perm.slice();
      }
    }
    if (best) return {assignment: best, cost: minCost};
    return null;
  }
  renderBranchMethod(C) {
    let html = '<h3>Метод ветвей и границ</h3>';
    const bb = branchAndBoundAssignment(C);
    if (bb) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < bb.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${bb.assignment[i] + 1} (C: ${C[i][bb.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${bb.cost}</div>`;
    }
    return html;
  }
  renderLPMethod(C) {
    let html = '<h3>Линейное программирование</h3>';
    const lp = lpAssignment(C);
    if (lp) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < lp.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${lp.assignment[i] + 1} (C: ${C[i][lp.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${lp.cost}</div>`;
    }
    return html;
  }
  renderGreedyMethod(C) {
    let html = '<h3>Жадные и эвристические методы</h3>';
    const greedy = greedyAssignment(C);
    if (greedy) {
      html += '<div><b>Решение:</b></div>';
      html += '<table><thead><tr><th></th><th>Назначение</th></tr></thead><tbody>';
      for (let i = 0; i < greedy.assignment.length; i++) {
        html += `<tr><th>x${i + 1}</th><td>${greedy.assignment[i] + 1} (C: ${C[i][greedy.assignment[i]]})</td></tr>`;
      }
      html += '</tbody></table>';
      html += `<div><b>Ответ:</b> Суммарная стоимость = ${greedy.cost}</div>`;
    }
    return html;
  }
}

// Controller
class AssignmentController {
  constructor() {
    this.model = null;
    this.view = new AssignmentView();
    this.initEvents();
    this.initPresetButtons();
  }
  initEvents() {
    document.getElementById('solve-btn').addEventListener('click', () => this.solve());
  }
  initPresetButtons() {
    const cTextarea = document.getElementById('matrix-c-textarea');
    const tTextarea = document.getElementById('matrix-t-textarea');
    const sInput = document.getElementById('salary-fund');
    document.getElementById('fill-default').addEventListener('click', () => {
      cTextarea.value = `3 4 5 8 3\n2 9 6 7 8\n5 1 8 5 2\n8 9 6 4 3\n3 2 5 7 9`;
      tTextarea.value = `7 6 5 2 7\n8 1 4 3 2\n5 9 2 5 8\n2 1 4 6 7\n7 8 5 3 1`;
      sInput.value = 33;
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
    document.getElementById('fill-test').addEventListener('click', () => {
      cTextarea.value = `2 2 2\n2 2 2\n2 2 2`;
      tTextarea.value = `1 1 2\n1 2 1\n2 1 1`;
      sInput.value = 6;
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
    document.getElementById('clear-all').addEventListener('click', () => {
      cTextarea.value = '';
      tTextarea.value = '';
      sInput.value = '';
      cTextarea.dispatchEvent(new Event('input'));
      tTextarea.dispatchEvent(new Event('input'));
    });
  }
  solve() {
    const { matrix: C, size: sizeC, isSquare } = this.view.getMatrixC();
    const { matrix: T, size: sizeT } = this.view.getMatrixT();
    window.assignmentModelInputC = C;
    window.assignmentModelInputT = T;
    const n = Math.min(sizeC, sizeT);
    if (!n || C.length !== n || T.length !== n) {
      this.view.renderAnswer('Ошибка: некорректный ввод матриц');
      this.view.renderSolutionTable([]);
      document.getElementById('extra-methods').innerHTML = '';
      return;
    }
    this.model = new AssignmentModel(n);
    this.model.setMatrixC(C);
    this.model.setMatrixT(T);
    const params = this.view.getParams();
    this.model.setS(params.S);
    this.model.setTType(params.T_type);
    this.model.setTLimit(params.T_limit);
    const { answer, solutions } = this.model.solve(params);
    this.view.renderAnswer(answer.answer || answer);
    this.view.renderSolutionTable(solutions);
    this.view.renderExtraMethods(C, params);
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  new AssignmentController();
}); 
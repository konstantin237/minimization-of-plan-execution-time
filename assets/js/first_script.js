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
  solve() {
    const n = this.size;
    const jobs = Array.from({ length: n }, (_, i) => i);
    const perms = AssignmentModel.permutations(jobs);
    let solutions = [];
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
      if (this.T_limit !== '' && ((this.T_type === 'min' && T_value > this.T_limit) || (this.T_type === 'max' && T_value < this.T_limit))) valid = false;
      solutions.push({ perm, sumC, T_value, table, valid });
    }
    // Выбираем оптимальное решение
    let filtered = solutions.filter(s => s.valid);
    if (filtered.length === 0) return { answer: 'Нет допустимых решений', solutions };
    let best;
    if (this.T_type === 'min') {
      let minT = Math.min(...filtered.map(s => s.T_value));
      best = filtered.find(s => s.T_value === minT);
    } else {
      let maxT = Math.max(...filtered.map(s => s.T_value));
      best = filtered.find(s => s.T_value === maxT);
    }
    return { answer: best, solutions };
  }
}

// View
class AssignmentView {
  constructor(size = 3) {
    this.size = size;
    this.matrixC = document.getElementById('matrix-c');
    this.matrixT = document.getElementById('matrix-t');
    this.renderMatrixInputs();
  }

  renderMatrixInputs() {
    this.matrixC.innerHTML = '';
    this.matrixT.innerHTML = '';
    for (let i = 0; i < this.size; i++) {
      let rowC = document.createElement('tr');
      let rowT = document.createElement('tr');
      for (let j = 0; j < this.size; j++) {
        let cellC = document.createElement('td');
        let inputC = document.createElement('input');
        inputC.type = 'number';
        inputC.value = 0;
        inputC.min = 0;
        inputC.className = 'matrix-c-input';
        inputC.dataset.row = i;
        inputC.dataset.col = j;
        cellC.appendChild(inputC);
        rowC.appendChild(cellC);

        let cellT = document.createElement('td');
        let inputT = document.createElement('input');
        inputT.type = 'number';
        inputT.value = 0;
        inputT.min = 0;
        inputT.className = 'matrix-t-input';
        inputT.dataset.row = i;
        inputT.dataset.col = j;
        cellT.appendChild(inputT);
        rowT.appendChild(cellT);
      }
      this.matrixC.appendChild(rowC);
      this.matrixT.appendChild(rowT);
    }
  }

  getMatrix(className) {
    let inputs = document.querySelectorAll('.' + className);
    let size = this.size;
    let matrix = Array.from({ length: size }, () => Array(size).fill(0));
    inputs.forEach(input => {
      let i = +input.dataset.row;
      let j = +input.dataset.col;
      matrix[i][j] = +input.value;
    });
    return matrix;
  }

  getParams() {
    return {
      S: +document.getElementById('salary-fund').value,
      T_type: document.getElementById('t-type').value,
      T_limit: document.getElementById('t-limit').value === '' ? '' : +document.getElementById('t-limit').value
    };
  }

  renderAnswer(answer) {
    const answerEl = document.getElementById('answer');
    if (typeof answer === 'string') {
      answerEl.textContent = answer;
      return;
    }
    let jobs = answer.perm.map(j => j + 1).join(', ');
    let workers = answer.perm.map((j, i) => `Работник ${i + 1} → Работа ${j + 1} (C=${answer.table[i].c}, T=${answer.table[i].t})`).join('; ');
    answerEl.innerHTML = `Назначения: ${workers}<br>Сумма C = ${answer.sumC}, T = ${answer.T_value}`;
  }

  renderSolutionTable(solutions) {
    const tableDiv = document.getElementById('solution-table');
    let html = '<table><thead><tr><th></th>';
    // Заголовки: Решение 1, Решение 2, ...
    solutions.forEach((sol, idx) => {
      html += `<th${sol.valid ? '' : ' style=\"opacity:0.5\"'}>Решение ${idx + 1}</th>`;
    });
    html += '</tr></thead><tbody>';
    // Для каждого работника — строка
    for (let i = 0; i < this.size; i++) {
      html += `<tr><th>Работник ${i + 1}</th>`;
      solutions.forEach((sol, idx) => {
        // Найти работу, которую выполняет этот работник в этом решении
        const jobIdx = sol.perm[i];
        const c = sol.table[i].c;
        const t = sol.table[i].t;
        html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${jobIdx + 1} (C=${c}, T=${t})</td>`;
      });
      html += '</tr>';
    }
    // Строка S (сумма C)
    html += '<tr><th>S</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.sumC}</td>`;
    });
    html += '</tr>';
    // Строка T
    html += '<tr><th>T</th>';
    solutions.forEach((sol) => {
      html += `<td${sol.valid ? '' : ' style=\"opacity:0.5\"'}>${sol.T_value}</td>`;
    });
    html += '</tr>';
    html += '</tbody></table>';
    tableDiv.innerHTML = html;
  }
}

// Controller
class AssignmentController {
  constructor(size = 3) {
    this.model = new AssignmentModel(size);
    this.view = new AssignmentView(size);
    this.initEvents();
  }

  initEvents() {
    document.getElementById('solve-btn').addEventListener('click', () => this.solve());
  }

  solve() {
    this.model.setMatrixC(this.view.getMatrix('matrix-c-input'));
    this.model.setMatrixT(this.view.getMatrix('matrix-t-input'));
    const params = this.view.getParams();
    this.model.setS(params.S);
    this.model.setTType(params.T_type);
    this.model.setTLimit(params.T_limit);
    const { answer, solutions } = this.model.solve();
    this.view.renderAnswer(answer.answer || answer);
    this.view.renderSolutionTable(solutions);
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  new AssignmentController(3);
}); 
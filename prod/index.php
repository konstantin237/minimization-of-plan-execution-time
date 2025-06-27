<!DOCTYPE html><html><head><title>Задача о назначениях</title><link rel="stylesheet" href="./assets/css/first_styles.min.css"></head><body><main class="container"><h1>Задача о назначениях</h1><form id="assignment-form"><div class="matrix-inputs"><div class="matrix-block"><label for="matrix-c-textarea">Матрица C (стоимости)</label><textarea id="matrix-c-textarea" placeholder="Введите элементы матрицы через пробел, строки отделяйте переносами
Например для матрицы 3x3:
1 2 3
4 5 6
7 8 9">3 4 5 8 3
2 9 6 7 8
5 1 8 5 2
8 9 6 4 3
3 2 5 7 9</textarea></div><div class="matrix-block"><label for="matrix-t-textarea">Матрица T (времена)</label><textarea id="matrix-t-textarea" placeholder="Введите элементы матрицы через пробел, строки отделяйте переносами
Например для матрицы 3x3:
1 2 3
4 5 6
7 8 9">7 6 5 2 7
8 1 4 3 2
5 9 2 5 8
2 1 4 6 7
7 8 5 3 1</textarea></div></div><div class="params"><label for="salary-fund">Фонд зарплаты S:</label><input id="salary-fund" type="number" name="S" min="0" value="33"><label for="t-type">Тип оптимизации T:</label><select id="t-type" name="T"><option value="min" selected>min</option><option value="max">max</option></select><label for="t-limit">Ограничение на T (Если в условии не указано, оставить пустым):</label><input id="t-limit" type="number" name="T_limit" min="0" step="any"></div><button id="solve-btn" type="button">Решить</button></form><section id="solution"><h2>Ответ</h2><p id="answer"></p><h3>Ход решения</h3><div id="solution-table"></div></section></main><script type="module" src="./assets/js/first_script.js"> </script></body></html>
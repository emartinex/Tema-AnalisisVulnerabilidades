/**
 * ============================================================
 * SEMANA 6 – ANÁLISIS DE VULNERABILIDADES
 * Script principal – Hacking Ético
 * JavaScript Vanilla – SPA educativa
 * ============================================================
 */

(function () {
    'use strict';

    /* --- Referencias DOM --- */
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navLinks = document.querySelectorAll('.nav-link');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const backToTop = document.getElementById('backToTop');
    const matrixBody = document.getElementById('matrixBody');
    const quizContainer = document.getElementById('quizContainer');
    const quizResults = document.getElementById('quizResults');

    /* --- Estado de la aplicación --- */
    const STORAGE_KEY = 'vulnAnalysisProgress';
    const TOTAL_TABS = tabPanels.length; // número dinámico de pestañas

    let visitedTabs = loadProgress();
    let quizCompleted = false;

    /**
     * Carga el progreso guardado en localStorage
     * @returns {Set<string>} Conjunto de pestañas visitadas
     */
    function loadProgress() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                quizCompleted = data.quizCompleted || false;
                return new Set(data.visitedTabs || ['inicio']);
            }
        } catch (e) {
            console.warn('No se pudo cargar el progreso:', e);
        }
        return new Set(['inicio']);
    }

    /**
     * Guarda el progreso del estudiante en localStorage
     */
    function saveProgress() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                visitedTabs: Array.from(visitedTabs),
                quizCompleted: quizCompleted
            }));
        } catch (e) {
            console.warn('No se pudo guardar el progreso:', e);
        }
    }

    /**
     * Actualiza la barra de progreso visual
     */
    function updateProgressBar() {
        let progress = (visitedTabs.size / TOTAL_TABS) * 100;
        if (quizCompleted) {
            progress = Math.min(100, progress + 5);
        }
        progress = Math.round(progress);
        progressFill.style.width = progress + '%';
        progressText.textContent = 'Progreso: ' + progress + '%';
    }

    /**
     * Cambia a una pestaña específica con animación
     * @param {string} tabId - Identificador de la pestaña
     */
    function switchTab(tabId) {
        tabPanels.forEach(function (panel) {
            panel.classList.remove('active');
            if (panel.dataset.tab === tabId) {
                panel.classList.add('active');
            }
        });

        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            }
        });

        visitedTabs.add(tabId);
        saveProgress();
        updateProgressBar();

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (window.innerWidth <= 1024) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    }

    /**
     * Inicializa la navegación por pestañas
     */
    function initNavigation() {
        navLinks.forEach(function (link) {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                switchTab(link.dataset.tab);
            });
        });

        document.querySelectorAll('[data-goto]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                switchTab(btn.dataset.goto);
            });
        });

        if (window.location.hash) {
            const tabId = window.location.hash.replace('#', '');
            if (document.getElementById(tabId)) {
                switchTab(tabId);
            }
        }
    }

    /**
     * Inicializa el menú lateral colapsable
     */
    function initSidebar() {
        sidebarToggle.addEventListener('click', function () {
            if (window.innerWidth <= 1024) {
                sidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('active');
            } else {
                sidebar.classList.toggle('collapsed');
                document.body.classList.toggle('sidebar-collapsed');
            }
        });

        sidebarOverlay.addEventListener('click', function () {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
    }

    /**
     * Índice de contenido para el buscador interno
     */
    function buildSearchIndex() {
        const index = [];
        tabPanels.forEach(function (panel) {
            const tabId = panel.dataset.tab;
            const tabName = panel.querySelector('.section-header h2, .hero h1');
            const title = tabName ? tabName.textContent.trim() : tabId;

            const textElements = panel.querySelectorAll('p, li, h3, h4, td, th');
            textElements.forEach(function (el) {
                const text = el.textContent.trim();
                if (text.length > 10) {
                    index.push({ tabId: tabId, tabTitle: title, text: text });
                }
            });
        });
        return index;
    }

    const searchIndex = buildSearchIndex();

    /**
     * Inicializa el buscador interno de contenido
     */
    function initSearch() {
        searchInput.addEventListener('input', function () {
            const query = searchInput.value.trim().toLowerCase();
            if (query.length < 2) {
                searchResults.hidden = true;
                return;
            }

            const matches = searchIndex.filter(function (item) {
                return item.text.toLowerCase().includes(query);
            }).slice(0, 8);

            if (matches.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">Sin resultados</div>';
            } else {
                searchResults.innerHTML = matches.map(function (match) {
                    const highlight = match.text.substring(0, 80) + (match.text.length > 80 ? '...' : '');
                    return '<div class="search-result-item" data-tab="' + match.tabId + '">' +
                        '<div class="search-result-item__tab">' + match.tabTitle + '</div>' +
                        '<div class="search-result-item__text">' + highlight + '</div></div>';
                }).join('');
            }
            searchResults.hidden = false;
        });

        searchResults.addEventListener('click', function (e) {
            const item = e.target.closest('.search-result-item');
            if (item && item.dataset.tab) {
                switchTab(item.dataset.tab);
                searchResults.hidden = true;
                searchInput.value = '';
            }
        });

        document.addEventListener('click', function (e) {
            if (!e.target.closest('.search-box')) {
                searchResults.hidden = true;
            }
        });
    }

    /**
     * Inicializa botón "Volver al inicio"
     */
    function initBackToTop() {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function () {
            switchTab('inicio');
        });
    }

    /**
     * Inicializa botones de copiar código
     */
    function initCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const text = btn.dataset.copy;
                navigator.clipboard.writeText(text).then(function () {
                    const icon = btn.querySelector('i');
                    icon.className = 'fas fa-check';
                    setTimeout(function () {
                        icon.className = 'fas fa-copy';
                    }, 2000);
                });
            });
        });
    }

    /**
     * Detalles CVSS para la tabla interactiva
     */
    const cvssDetails = {
        base: {
            title: 'Base Score',
            content: 'Evalúa métricas intrínsecas: Vector de ataque (AV), Complejidad (AC), Privilegios requeridos (PR), Interacción del usuario (UI), Alcance (S), e Impacto en Confidencialidad, Integridad y Disponibilidad (C/I/A).'
        },
        temporal: {
            title: 'Temporal Score',
            content: 'Modifica el Base Score considerando: Código de explotación (E), Remediación (RL) y Reporte de confianza (RC). Un exploit funcional aumenta la severidad temporal.'
        },
        environmental: {
            title: 'Environmental Score',
            content: 'Personaliza el score según el entorno: requisitos de seguridad modificados, controles de mitigación en el activo y confidencialidad/integridad/disponibilidad del activo afectado.'
        }
    };

    /**
     * Inicializa interactividad de la tabla CVSS y barra de severidad
     */
    function initCVSS() {
        const detailPanel = document.getElementById('cvssDetailPanel');
        const severityInfo = document.getElementById('severityInfo');

        document.querySelectorAll('.cvss-detail-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const type = btn.dataset.type;
                const detail = cvssDetails[type];
                detailPanel.hidden = false;
                detailPanel.innerHTML = '<strong>' + detail.title + ':</strong> ' + detail.content;
            });
        });

        const severityDescriptions = {
            none: 'Ninguno (0.0): Sin impacto de seguridad.',
            low: 'Bajo (0.1–3.9): Impacto mínimo, difícil de explotar.',
            medium: 'Medio (4.0–6.9): Impacto moderado, requiere condiciones específicas.',
            high: 'Alto (7.0–8.9): Impacto significativo, explotación probable.',
            critical: 'Crítico (9.0–10.0): Impacto severo, explotación trivial.'
        };

        document.querySelectorAll('.severity-segment').forEach(function (seg) {
            seg.addEventListener('mouseenter', function () {
                severityInfo.textContent = severityDescriptions[seg.dataset.severity];
            });
        });
    }

    /* ============================================================
       MATRIZ DE VULNERABILIDADES
       ============================================================ */

    /**
     * Crea una fila editable en la matriz
     * @param {Object} data - Datos opcionales de la fila
     * @returns {HTMLTableRowElement}
     */
    function createMatrixRow(data) {
        data = data || {};
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td><input type="checkbox" class="row-select"></td>' +
            '<td><input type="text" value="' + (data.vuln || '') + '" placeholder="Nombre de vulnerabilidad"></td>' +
            '<td><input type="text" value="' + (data.cve || '') + '" placeholder="CVE-XXXX-XXXX"></td>' +
            '<td><input type="number" min="0" max="10" step="0.1" value="' + (data.cvss || '') + '" placeholder="0.0"></td>' +
            '<td><input type="text" value="' + (data.asset || '') + '" placeholder="Servidor, app..."></td>' +
            '<td><select>' +
                '<option value="">Seleccionar</option>' +
                '<option value="Crítico"' + (data.risk === 'Crítico' ? ' selected' : '') + '>Crítico</option>' +
                '<option value="Alto"' + (data.risk === 'Alto' ? ' selected' : '') + '>Alto</option>' +
                '<option value="Medio"' + (data.risk === 'Medio' ? ' selected' : '') + '>Medio</option>' +
                '<option value="Bajo"' + (data.risk === 'Bajo' ? ' selected' : '') + '>Bajo</option>' +
            '</select></td>' +
            '<td><input type="text" value="' + (data.rec || '') + '" placeholder="Acción recomendada"></td>';
        return tr;
    }

    /**
     * Inicializa la matriz de vulnerabilidades
     */
    function initMatrix() {
        const defaultRows = [
            { vuln: 'vsftpd 2.3.4 Backdoor', cve: 'CVE-2011-2523', cvss: '9.8', asset: 'Metasploitable - FTP', risk: 'Crítico', rec: 'Actualizar o deshabilitar vsftpd' },
            { vuln: 'OpenSSH Weak Keys', cve: 'CVE-2008-0166', cvss: '7.5', asset: 'Metasploitable - SSH', risk: 'Alto', rec: 'Regenerar claves SSH' },
            { vuln: 'Apache Tomcat Manager', cve: 'N/A', cvss: '7.0', asset: 'Metasploitable - Web', risk: 'Alto', rec: 'Restringir acceso al manager' }
        ];

        defaultRows.forEach(function (row) {
            matrixBody.appendChild(createMatrixRow(row));
        });

        document.getElementById('addRowBtn').addEventListener('click', function () {
            matrixBody.appendChild(createMatrixRow());
        });

        document.getElementById('removeRowBtn').addEventListener('click', function () {
            const checked = matrixBody.querySelectorAll('.row-select:checked');
            if (checked.length === 0) {
                alert('Selecciona al menos una fila para eliminar.');
                return;
            }
            checked.forEach(function (cb) {
                cb.closest('tr').remove();
            });
        });

        document.getElementById('selectAllRows').addEventListener('change', function (e) {
            matrixBody.querySelectorAll('.row-select').forEach(function (cb) {
                cb.checked = e.target.checked;
            });
        });

        document.getElementById('exportCsvBtn').addEventListener('click', exportMatrixCSV);
    }

    /**
     * Exporta la matriz a archivo CSV
     */
    function exportMatrixCSV() {
        const headers = ['Vulnerabilidad', 'CVE', 'CVSS', 'Activo afectado', 'Nivel de riesgo', 'Recomendación'];
        const rows = [headers.join(',')];

        matrixBody.querySelectorAll('tr').forEach(function (tr) {
            const cells = tr.querySelectorAll('td');
            const rowData = [];
            for (let i = 1; i < cells.length; i++) {
                const input = cells[i].querySelector('input, select');
                let val = input ? input.value : '';
                val = '"' + val.replace(/"/g, '""') + '"';
                rowData.push(val);
            }
            rows.push(rowData.join(','));
        });

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'matriz_vulnerabilidades.csv';
        link.click();
        URL.revokeObjectURL(link.href);
    }

    /* ============================================================
       EVALUACIÓN – CUESTIONARIO INTERACTIVO
       ============================================================ */

    const quizQuestions = [
        {
            question: '¿Qué significa CVE?',
            options: ['Common Vulnerabilities and Exposures', 'Critical Vulnerability Engine', 'Certified Vulnerability Evaluation', 'Central Virus Encyclopedia'],
            correct: 0,
            feedback: 'CVE (Common Vulnerabilities and Exposures) es el estándar internacional para identificar vulnerabilidades.'
        },
        {
            question: '¿Cuál es el rango de puntuación del CVSS Base Score?',
            options: ['0 a 100', '0.0 a 10.0', '1 a 5', '0 a 1000'],
            correct: 1,
            feedback: 'El CVSS Base Score va de 0.0 (sin impacto) a 10.0 (crítico).'
        },
        {
            question: '¿Qué CVE corresponde a la vulnerabilidad Log4Shell?',
            options: ['CVE-2014-0160', 'CVE-2021-44228', 'CVE-2017-0144', 'CVE-2019-0708'],
            correct: 1,
            feedback: 'CVE-2021-44228 es el identificador de la vulnerabilidad Log4Shell en Apache Log4j.'
        },
        {
            question: '¿Qué es ExploitDB?',
            options: ['Un antivirus comercial', 'Una base de datos de exploits públicos', 'Un protocolo de red', 'Un estándar de cifrado'],
            correct: 1,
            feedback: 'ExploitDB es un repositorio de exploits y pruebas de concepto mantenido por Offensive Security.'
        },
        {
            question: '¿Qué herramienta es open source para escaneo de vulnerabilidades?',
            options: ['Nessus Professional', 'Qualys', 'OpenVAS', 'CrowdStrike'],
            correct: 2,
            feedback: 'OpenVAS es una solución open source integrada en Greenbone Vulnerability Management.'
        },
        {
            question: '¿Cuál es una ventaja principal de Nessus?',
            options: ['Es completamente gratuito', 'Tiene más de 100,000 plugins y soporte comercial', 'Solo escanea servidores web', 'No requiere actualizaciones'],
            correct: 1,
            feedback: 'Nessus destaca por su extensa base de plugins y soporte comercial de Tenable.'
        },
        {
            question: '¿Para qué se utiliza principalmente Nikto?',
            options: ['Escaneo de servidores web', 'Análisis de malware', 'Crackeo de contraseñas', 'Monitoreo de red'],
            correct: 0,
            feedback: 'Nikto es un escáner especializado en vulnerabilidades de servidores web.'
        },
        {
            question: '¿Qué es un falso positivo en vulnerability scanning?',
            options: ['Una vulnerabilidad real no detectada', 'Un reporte de vulnerabilidad que no existe realmente', 'Un exploit exitoso', 'Un parche aplicado incorrectamente'],
            correct: 1,
            feedback: 'Un falso positivo ocurre cuando el escáner reporta una vulnerabilidad inexistente o no explotable.'
        },
        {
            question: '¿Qué score CVSS se considera Crítico?',
            options: ['4.0 – 6.9', '7.0 – 8.9', '9.0 – 10.0', '0.1 – 3.9'],
            correct: 2,
            feedback: 'Los scores de 9.0 a 10.0 se clasifican como Críticos según CVSS v3.'
        },
        {
            question: 'En el flujo Vulnerabilidad → CVE → Exploit → Riesgo, ¿qué representa el CVE?',
            options: ['El código de explotación', 'El identificador estandarizado de la vulnerabilidad', 'El nivel de riesgo final', 'La herramienta de escaneo'],
            correct: 1,
            feedback: 'El CVE identifica de forma única y estandarizada una vulnerabilidad conocida.'
        }
    ];

    let userAnswers = new Array(quizQuestions.length).fill(null);

    /**
     * Renderiza el cuestionario en el DOM
     */
    function renderQuiz() {
        quizContainer.innerHTML = quizQuestions.map(function (q, index) {
            const optionsHtml = q.options.map(function (opt, optIndex) {
                return '<label class="quiz-option" data-q="' + index + '" data-opt="' + optIndex + '">' +
                    '<input type="radio" name="q' + index + '" value="' + optIndex + '" hidden>' +
                    '<span>' + String.fromCharCode(65 + optIndex) + ') ' + opt + '</span></label>';
            }).join('');

            return '<div class="quiz-question" id="question-' + index + '">' +
                '<h4><span class="q-number">' + (index + 1) + '</span> ' + q.question + '</h4>' +
                '<div class="quiz-options">' + optionsHtml + '</div>' +
                '<div class="quiz-feedback" id="feedback-' + index + '" hidden></div></div>';
        }).join('');

        quizContainer.querySelectorAll('.quiz-option').forEach(function (option) {
            option.addEventListener('click', function () {
                const qIndex = parseInt(option.dataset.q, 10);
                const optIndex = parseInt(option.dataset.opt, 10);

                document.querySelectorAll('.quiz-option[data-q="' + qIndex + '"]').forEach(function (o) {
                    o.classList.remove('selected');
                });
                option.classList.add('selected');
                option.querySelector('input').checked = true;
                userAnswers[qIndex] = optIndex;
            });
        });
    }

    /**
     * Evalúa las respuestas y muestra retroalimentación
     */
    function submitQuiz() {
        let score = 0;

        quizQuestions.forEach(function (q, index) {
            const questionEl = document.getElementById('question-' + index);
            const feedbackEl = document.getElementById('feedback-' + index);
            const userAnswer = userAnswers[index];

            questionEl.classList.remove('correct', 'incorrect');
            feedbackEl.hidden = false;

            document.querySelectorAll('.quiz-option[data-q="' + index + '"]').forEach(function (opt) {
                opt.classList.remove('correct-answer', 'wrong-answer');
                const optIndex = parseInt(opt.dataset.opt, 10);
                if (optIndex === q.correct) {
                    opt.classList.add('correct-answer');
                }
            });

            if (userAnswer === null) {
                questionEl.classList.add('incorrect');
                feedbackEl.className = 'quiz-feedback incorrect';
                feedbackEl.innerHTML = '<i class="fas fa-times-circle"></i> Sin respuesta. ' + q.feedback;
            } else if (userAnswer === q.correct) {
                score++;
                questionEl.classList.add('correct');
                feedbackEl.className = 'quiz-feedback correct';
                feedbackEl.innerHTML = '<i class="fas fa-check-circle"></i> ¡Correcto! ' + q.feedback;
            } else {
                questionEl.classList.add('incorrect');
                feedbackEl.className = 'quiz-feedback incorrect';
                feedbackEl.innerHTML = '<i class="fas fa-times-circle"></i> Incorrecto. ' + q.feedback;
            }
        });

        const percent = Math.round((score / quizQuestions.length) * 100);
        document.getElementById('scorePercent').textContent = percent + '%';
        document.getElementById('scorePoints').textContent = score + '/' + quizQuestions.length;

        let feedbackMsg = '';
        if (percent >= 90) {
            feedbackMsg = '¡Excelente! Dominas el tema de análisis de vulnerabilidades.';
        } else if (percent >= 70) {
            feedbackMsg = 'Buen trabajo. Repasa las secciones donde tuviste errores.';
        } else if (percent >= 50) {
            feedbackMsg = 'Resultado aceptable. Te recomendamos revisar el material completo.';
        } else {
            feedbackMsg = 'Necesitas reforzar el estudio. Revisa cada pestaña del curso.';
        }
        document.getElementById('scoreFeedback').textContent = feedbackMsg;

        const scoreCircle = document.getElementById('scoreCircle');
        if (percent >= 70) {
            scoreCircle.style.borderColor = 'var(--accent-green)';
            scoreCircle.style.background = 'rgba(34, 197, 94, 0.1)';
        } else if (percent >= 50) {
            scoreCircle.style.borderColor = 'var(--accent-yellow)';
            scoreCircle.style.background = 'rgba(234, 179, 8, 0.1)';
        } else {
            scoreCircle.style.borderColor = 'var(--accent-red)';
            scoreCircle.style.background = 'rgba(239, 68, 68, 0.1)';
        }

        quizResults.hidden = false;
        quizCompleted = true;
        saveProgress();
        updateProgressBar();
        quizResults.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Reinicia el cuestionario
     */
    function resetQuiz() {
        userAnswers = new Array(quizQuestions.length).fill(null);
        quizResults.hidden = true;
        renderQuiz();
    }

    /**
     * Inicializa la evaluación
     */
    function initQuiz() {
        renderQuiz();
        document.getElementById('submitQuizBtn').addEventListener('click', submitQuiz);
        document.getElementById('resetQuizBtn').addEventListener('click', resetQuiz);
    }

    /* ============================================================
       INICIALIZACIÓN GENERAL
       ============================================================ */

    function init() {
        initNavigation();
        initSidebar();
        initSearch();
        initBackToTop();
        initCopyButtons();
        initCVSS();
        initMatrix();
        initQuiz();
        updateProgressBar();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

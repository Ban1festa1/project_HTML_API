let currentPage = 'home';

let canvas, ctx;
let ball = {
    x: 50,
    y: 50,
    radius: 20,
    vx: 2.5,
    vy: 2.2
};
let animationId = null;

let worker = null;
let workerBusy = false;

function setStatus(message, type = 'info') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;

    statusEl.textContent = message;

    statusEl.classList.remove('error', 'success');
    if (type === 'error') {
        statusEl.classList.add('error');
    } else if (type === 'success') {
        statusEl.classList.add('success');
    }
}

function showPage(page) {
    currentPage = page;
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));

    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
        pageEl.classList.add('active');
    }

    if (page !== 'canvas') {
        stopAnimation();
    }
}

function navigateTo(page) {
    showPage(page);
    history.pushState({ page }, '', `?page=${page}`);
    setStatus(`Открыта страница: ${page}`, 'info');
}

function handlePopState(event) {
    const state = event.state;
    const pageFromState = state && state.page ? state.page : 'home';
    showPage(pageFromState);
    setStatus(`Переход по истории на страницу: ${pageFromState}`, 'info');
}

function initHistory() {
    const btnBack = document.getElementById('btnBack');
    const btnForward = document.getElementById('btnForward');
    const navLinks = document.querySelectorAll('.nav-link');

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            history.back();
        });
    }

    if (btnForward) {
        btnForward.addEventListener('click', () => {
            history.forward();
        });
    }

    navLinks.forEach(btn => {
        btn.addEventListener('click', () => {
            const page = btn.getAttribute('data-page');
            if (page) {
                navigateTo(page);
            }
        });
    });

    window.addEventListener('popstate', handlePopState);

    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('page') || 'home';
    showPage(initialPage);

    history.replaceState({ page: initialPage }, '', `?page=${initialPage}`);
}

function initCanvas() {
    canvas = document.getElementById('myCanvas');
    if (!canvas) {
        setStatus('Ошибка: элемент canvas не найден.', 'error');
        return;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) {
        setStatus('Ошибка: Canvas API не поддерживается.', 'error');
        return;
    }

    const btnStartAnimation = document.getElementById('btnStartAnimation');
    const btnStopAnimation = document.getElementById('btnStopAnimation');

    if (btnStartAnimation) {
        btnStartAnimation.addEventListener('click', () => {
            startAnimation();
        });
    }

    if (btnStopAnimation) {
        btnStopAnimation.addEventListener('click', () => {
            stopAnimation();
            setStatus('Анимация остановлена.', 'info');
        });
    }
}

function drawBall() {
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0077cc';
    ctx.fill();
    ctx.closePath();
}

function updateBall() {
    if (!canvas) return;

    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
        ball.vx = -ball.vx;
    }
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
        ball.vy = -ball.vy;
    }
}

function animationLoop() {
    updateBall();
    drawBall();
    animationId = window.requestAnimationFrame(animationLoop);
}

function startAnimation() {
    if (!canvas || !ctx) {
        setStatus('Невозможно запустить анимацию: Canvas недоступен.', 'error');
        return;
    }
    if (animationId !== null) {
        return;
    }
    setStatus('Анимация запущена.', 'success');
    animationId = window.requestAnimationFrame(animationLoop);
}

function stopAnimation() {
    if (animationId !== null) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
    }
}

function initWorker() {
    const workerResultEl = document.getElementById('workerResult');
    const btnStartWorker = document.getElementById('btnStartWorker');
    const inputEl = document.getElementById('workerInput');

    if (!btnStartWorker || !inputEl || !workerResultEl) {
        setStatus('Ошибка инициализации Web Worker UI.', 'error');
        return;
    }

    if (typeof Worker === 'undefined') {
        setStatus('Ваш браузер не поддерживает Web Workers.', 'error');
        btnStartWorker.disabled = true;
        workerResultEl.textContent = 'Web Workers не поддерживаются в этом браузере.';
        return;
    }

    worker = new Worker('js/worker.js');

    worker.onmessage = function (e) {
        workerBusy = false;
        btnStartWorker.disabled = false;

        const data = e.data;
        if (!data) {
            setStatus('Неизвестный ответ от воркера.', 'error');
            return;
        }

        if (data.status === 'success') {
            const info = data.result;
            workerResultEl.innerHTML =
                `N = ${info.n}<br>` +
                `Количество простых чисел: ${info.primeCount}<br>` +
                `Сумма простых чисел: ${info.primeSum}`;
            setStatus('Вычисления успешно завершены в веб-воркере.', 'success');
        } else if (data.status === 'error') {
            workerResultEl.textContent = 'Ошибка: ' + data.message;
            setStatus('Ошибка при выполнении вычислений в веб-воркере.', 'error');
        } else {
            workerResultEl.textContent = 'Неизвестный статус ответа от воркера.';
            setStatus('Неизвестный статус ответа от воркера.', 'error');
        }
    };

    worker.onerror = function (err) {
        workerBusy = false;
        btnStartWorker.disabled = false;
        workerResultEl.textContent = 'Ошибка в воркере: ' + err.message;
        setStatus('Произошла ошибка внутри веб-воркера.', 'error');
    };

    btnStartWorker.addEventListener('click', () => {
        if (workerBusy) {
            setStatus('Воркёр уже выполняет задачу, дождитесь завершения.', 'info');
            return;
        }

        const value = parseInt(inputEl.value, 10);
        if (isNaN(value) || value < 2) {
            setStatus('Введите корректное число N (не менее 2).', 'error');
            workerResultEl.textContent = 'Ошибка: некорректное значение N.';
            return;
        }

        try {
            workerBusy = true;
            btnStartWorker.disabled = true;
            workerResultEl.textContent = 'Выполняются вычисления...';
            setStatus('Запущены вычисления в веб-воркере.', 'info');

            worker.postMessage({ n: value });
        } catch (e) {
            workerBusy = false;
            btnStartWorker.disabled = false;
            setStatus('Не удалось отправить данные в веб-воркер: ' + e.message, 'error');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initHistory();
    initCanvas();
    initWorker();
    setStatus('Приложение загружено. Откройте нужный раздел.', 'info');
});

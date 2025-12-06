self.onmessage = function (e) {
    const data = e.data;

    try {
        if (!data || typeof data.n !== 'number') {
            throw new Error('Некорректные данные: ожидалось число n.');
        }

        const n = data.n;
        if (n < 2) {
            throw new Error('Число N должно быть не менее 2.');
        }

        const result = computePrimesUpToN(n);

        self.postMessage({
            status: 'success',
            result
        });
    } catch (err) {
        self.postMessage({
            status: 'error',
            message: err.message || 'Неизвестная ошибка внутри воркера.'
        });
    }
};

function computePrimesUpToN(n) {
    let primeCount = 0;
    let primeSum = 0;

    for (let i = 2; i <= n; i++) {
        if (isPrime(i)) {
            primeCount++;
            primeSum += i;
        }
    }

    return {
        n,
        primeCount,
        primeSum
    };
}

function isPrime(num) {
    if (num < 2) return false;
    if (num === 2) return true;
    if (num % 2 === 0) return false;

    const limit = Math.sqrt(num);
    for (let i = 3; i <= limit; i += 2) {
        if (num % i === 0) {
            return false;
        }
    }
    return true;
}

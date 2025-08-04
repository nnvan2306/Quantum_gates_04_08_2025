// ===== Main.js =====

// Biến toàn cục để lưu biểu đồ (để có thể xóa biểu đồ cũ trước khi vẽ mới)
let chartInstance;
let complexChartInstance;

// ==== CHUNG CHO MỌI TRANG: vector trạng thái đầu vào ====
const ket1Qubit = {
    0: [math.complex(1, 0), math.complex(0, 0)],
    1: [math.complex(0, 0), math.complex(1, 0)],
};

const ket2Qubit = {
    "00": [
        math.complex(1, 0),
        math.complex(0, 0),
        math.complex(0, 0),
        math.complex(0, 0),
    ],
    "01": [
        math.complex(0, 0),
        math.complex(1, 0),
        math.complex(0, 0),
        math.complex(0, 0),
    ],
    10: [
        math.complex(0, 0),
        math.complex(0, 0),
        math.complex(1, 0),
        math.complex(0, 0),
    ],
    11: [
        math.complex(0, 0),
        math.complex(0, 0),
        math.complex(0, 0),
        math.complex(1, 0),
    ],
};

// ==== MA TRẬN GỐC CHUNG ==== (cho kế thừa chuỗi cổng)
const gateMatrix = {
    H: [
        [1 / Math.sqrt(2), 1 / Math.sqrt(2)],
        [1 / Math.sqrt(2), -1 / Math.sqrt(2)],
    ],
    X: [
        [0, 1],
        [1, 0],
    ],
    Y: [
        [math.complex(0, 0), math.complex(0, -1)],
        [math.complex(0, 1), math.complex(0, 0)],
    ],
    Z: [
        [1, 0],
        [0, -1],
    ],
    S: [
        [1, 0],
        [0, math.complex(0, 1)],
    ],
    T: [
        [1, 0],
        [0, math.complex(Math.SQRT1_2, Math.SQRT1_2)],
    ],
    CNOT: [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 0],
    ],
};

// ==== ĐỊNH DẠNG SỐ PHỨC ====
function formatComplex(c) {
    const re = Math.round(c.re * 1000) / 1000;
    const im = Math.round(c.im * 1000) / 1000;
    if (im === 0) return `${re}`;
    if (re === 0) return `${im}i`;
    return `${re} ${im > 0 ? "+" : "-"} ${Math.abs(im)}i`;
}

// ==== HÀM MÔ PHỎNG CỔNG LƯỢNG TỬ BẤT KỲ ====
function simulateGate(matrix, label, colors) {
    const input = document.getElementById("inputState").value;

    let inputVector, labels;
    if (matrix.length === 2) {
        inputVector = ket1Qubit[input];
        labels = ["|0⟩", "|1⟩"];
    } else if (matrix.length === 4) {
        inputVector = ket2Qubit[input];
        labels = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"];
    } else {
        alert("Kích thước ma trận không hợp lệ!");
        return;
    }

    const result = matrix.map((row) =>
        row.reduce(
            (sum, val, i) => math.add(sum, math.multiply(val, inputVector[i])),
            math.complex(0, 0)
        )
    );

    // Biểu đồ 1: Biên độ
    const ctx = document.getElementById("stateChart").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label,
                    data: result.map((c) => math.abs(c)),
                    backgroundColor: colors,
                },
            ],
        },
        options: {
            responsive: true,
            scales: { y: { beginAtZero: true, max: 1 } },
        },
    });

    // Biểu đồ 2: Re/Im
    const complexCtx = document.getElementById("complexChart").getContext("2d");
    if (complexChartInstance) complexChartInstance.destroy();

    complexChartInstance = new Chart(complexCtx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                {
                    label: "Phần thực (Re)",
                    data: result.map((c) => c.re),
                    backgroundColor: "#facc15",
                },
                {
                    label: "Phần ảo (Im)",
                    data: result.map((c) => c.im),
                    backgroundColor: "#60a5fa",
                },
            ],
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, suggestedMin: -1, suggestedMax: 1 },
            },
        },
    });
}

// ==== HÀM MÔ PHỎNG RIÊNG ==== (có thể dùng hoặc không dùng tùy HTML)
function simulateHadamard() {
    simulateGate(gateMatrix["H"], "Biên độ (Hadamard)", ["#3b82f6", "#10b981"]);
}

function simulatePauliX() {
    simulateGate(gateMatrix["X"], "Biên độ (Pauli-X)", ["#f59e0b", "#8b5cf6"]);
}

function simulatePauliY() {
    simulateGate(gateMatrix["Y"], "Biên độ (Pauli-Y)", ["#6366f1", "#ec4899"]);
}

function simulatePauliZ() {
    simulateGate(gateMatrix["Z"], "Biên độ (Pauli-Z)", ["#f87171", "#60a5fa"]);
}

function simulateSGate() {
    simulateGate(gateMatrix["S"], "Biên độ (S)", ["#34d399", "#f472b6"]);
}

function simulateTGate() {
    simulateGate(gateMatrix["T"], "Biên độ (T)", ["#6ee7b7", "#c084fc"]);
}

function simulateCNOT() {
    simulateGate(gateMatrix["CNOT"], "Biên độ (CNOT)", [
        "#f472b6",
        "#a78bfa",
        "#34d399",
        "#f87171",
    ]);
}
// ==== ÁP DỤNG CHUỖI CỔNG LÊN 1 QUBIT ====
// Dùng cho mô phỏng chuỗi đơn qubit
function applyGateSequence(input, gateList) {
    if (!gateList || gateList.length === 0) return ket1Qubit[input];

    // Khởi tạo trạng thái đầu vào
    let state = [...ket1Qubit[input]];

    // Lặp qua từng cổng trong chuỗi
    for (const gateName of gateList) {
        const matrix = gateMatrix[gateName];
        if (!matrix) {
            console.warn(`Không tìm thấy ma trận cho cổng ${gateName}`);
            continue;
        }

        // Áp dụng cổng lên trạng thái
        state = matrix.map((row) =>
            row.reduce(
                (sum, val, i) => math.add(sum, math.multiply(val, state[i])),
                math.complex(0, 0)
            )
        );
    }

    return state;
}
/// ==== ÁP DỤNG CHUỖI CỔNG LÊN NHIỀU QUBIT ====
// Dùng cho mô phỏng chuỗi đa qubit
function applyGateSequence2Qubit(inputState, gateSequence) {
    let stateVector = math.matrix(ket2Qubit[inputState]);

    gateSequence.forEach((gate) => {
        const matrix = gateMatrix[gate];
        if (!matrix) {
            alert(`Cổng ${gate} chưa được hỗ trợ`);
            return;
        }
        stateVector = math.multiply(matrix, stateVector);
    });

    return stateVector.toArray();
}

// Hàm định dạng số phức nếu mở rộng
function formatNumber(num) {
    return Math.round(num * 1000) / 1000;
}

// ==== SLIDE HIỆU ỨNG ==== (nếu dùng slide ở cuối trang)
window.addEventListener("scroll", () => {
    const slide = document.getElementById("slideUpPage");
    const isAtBottom =
        window.scrollY + window.innerHeight >= document.body.offsetHeight - 10;
    slide?.classList.toggle("bottom-0", isAtBottom);
    slide?.classList.toggle("bottom-[-100%]", !isAtBottom);
});

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("button_control");
    if (!btn) return;

    const token = localStorage.getItem("quantum_gates_token");

    const setLogout = () => {
        btn.textContent = "Đăng xuất";
        btn.onclick = () => {
            localStorage.removeItem("quantum_gates_token");
            location.reload();
        };
    };

    const setLogin = () => {
        btn.textContent = "Đăng nhập";
        btn.onclick = () => {
            window.location.href = "/Pages/DangNhap.html";
        };
    };

    if (token) {
        setLogout();
    } else {
        setLogin();
    }
});
